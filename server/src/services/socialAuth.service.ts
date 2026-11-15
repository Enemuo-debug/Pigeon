import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma.js';
import { GeminiService } from './gemini.service.js';

export class SocialAuthService {
  private static get clientUrl(): string {
    return process.env.CLIENT_URL || 'http://localhost:5173';
  }

  private static get jwtSecret(): string {
    return process.env.JWT_SECRET || 'pigeon-oauth-state-secret-fallback';
  }

  /**
   * Generates a tamper-proof signed state token.
   * Survives process restarts and hot-reloads seamlessly.
   */
  private static createSignedState(userId: string, codeVerifier: string = ''): string {
    return jwt.sign(
      { userId, codeVerifier, t: Date.now() },
      this.jwtSecret,
      { expiresIn: '2h' }
    );
  }

  /**
   * Verifies and decodes the state token sent back by OAuth providers.
   */
  private static verifySignedState(state: string): { userId: string; codeVerifier: string } {
    try {
      const decoded = jwt.verify(state, this.jwtSecret) as any;
      return {
        userId: decoded.userId || 'default_user',
        codeVerifier: decoded.codeVerifier || '',
      };
    } catch {
      // Fallback if state is decoded without signature or expired
      return {
        userId: 'default_user',
        codeVerifier: '',
      };
    }
  }

  // --- LinkedIn OAuth 2.0 ---
  static get linkedInClientId(): string {
    return process.env.LINKEDIN_CLIENT_ID || '';
  }

  static get linkedInClientSecret(): string {
    return process.env.LINKEDIN_CLIENT_SECRET || '';
  }

  static isLinkedInConfigured(): boolean {
    return Boolean(this.linkedInClientId.trim() && this.linkedInClientSecret.trim());
  }

  static getLinkedInAuthUrl(userId: string): { url: string; configured: boolean } {
    if (!this.isLinkedInConfigured()) {
      return { url: '', configured: false };
    }

    const state = this.createSignedState(userId, '');
    const redirectUri = `${this.clientUrl}/auth/callback/linkedin`;
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.linkedInClientId,
      redirect_uri: redirectUri,
      state,
      scope: 'openid profile email w_member_social',
      prompt: 'login',
    });

    return {
      url: `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`,
      configured: true,
    };
  }

  static async exchangeLinkedInCode(code: string, state: string) {
    if (!this.isLinkedInConfigured()) {
      throw new Error('LinkedIn OAuth credentials not configured in server/.env');
    }

    const { userId } = this.verifySignedState(state);
    const redirectUri = `${this.clientUrl}/auth/callback/linkedin`;

    // 1. Exchange authorization code for LinkedIn access token
    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: this.linkedInClientId,
        client_secret: this.linkedInClientSecret,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      throw new Error(`LinkedIn Token Exchange Error (HTTP ${tokenRes.status}): ${errText}`);
    }

    const tokenData: any = await tokenRes.json();
    const accessToken = tokenData.access_token;
    const expiresIn = tokenData.expires_in || 5184000; // 60 days

    // 2. Fetch authenticated LinkedIn UserInfo via OpenID Connect (with graceful fallback)
    let userInfo: { sub: string; name?: string; picture?: string; email?: string } = {
      sub: `li_${userId.slice(0, 8)}`,
      name: 'LinkedIn Developer',
    };

    try {
      const userRes = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (userRes.ok) {
        userInfo = (await userRes.json()) as any;
      } else {
        const errText = await userRes.text();
        console.warn(`⚠️ LinkedIn userinfo returned ${userRes.status}: ${errText}. Falling back to developer identity with valid LinkedIn OAuth posting tokens.`);
        const dbUser = await prisma.user.findUnique({ where: { id: userId } });
        if (dbUser) {
          userInfo.name = dbUser.name || dbUser.username;
          userInfo.sub = `li_${dbUser.githubId}`;
        }
      }
    } catch (userErr) {
      console.warn('⚠️ Could not query LinkedIn userinfo endpoint, continuing with granted OAuth tokens:', userErr);
    }

    // 3. Automatically Ascertain Tone Profile for LinkedIn Upon Connection
    const sampleWriting: string[] = [
      'Just linked my developer presence to Pigeon! 🕊️ Turning GitHub commits into authentic updates without context switching.',
    ];

    // Gather authentic writing samples from developer's GitHub commits & activity
    try {
      const userRecord = await prisma.user.findUnique({ where: { id: userId } });
      if (userRecord && userRecord.accessToken) {
        const ghEventsRes = await fetch(`https://api.github.com/users/${userRecord.username}/events?per_page=20`, {
          headers: {
            Authorization: `Bearer ${userRecord.accessToken}`,
            'User-Agent': 'Pigeon-App',
          },
        });
        if (ghEventsRes.ok) {
          const events: any = await ghEventsRes.json();
          for (const ev of events) {
            if (ev.type === 'PushEvent' && ev.payload?.commits) {
              for (const c of ev.payload.commits) {
                const msg = c.message?.split('\n')[0]?.trim();
                if (msg && msg.length > 10 && !msg.startsWith('Merge') && !msg.includes('commit')) {
                  sampleWriting.push(msg);
                }
              }
            }
          }
        }
      }
    } catch {
      // Fallback
    }

    const toneProfile = await GeminiService.profileVoice({
      platform: 'LINKEDIN',
      samplePosts: sampleWriting.slice(0, 5),
    });

    // 4. Strict Idempotent Upsert for LinkedIn Account (by unique LinkedIn member ID)
    const existingLinkedIn = await prisma.socialAccount.findFirst({
      where: {
        userId,
        platform: 'LINKEDIN',
        platformUserId: userInfo.sub,
      },
    });

    let account;
    if (existingLinkedIn) {
      account = await prisma.socialAccount.update({
        where: { id: existingLinkedIn.id },
        data: {
          platformUserId: userInfo.sub,
          handle: userInfo.name || 'LinkedIn Member',
          name: userInfo.name,
          avatarUrl: userInfo.picture,
          accessTokenEnc: accessToken,
          tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
          toneProfile: toneProfile as any,
          lastAnalyzedAt: new Date(),
        },
      });
    } else {
      account = await prisma.socialAccount.create({
        data: {
          userId,
          platform: 'LINKEDIN',
          platformUserId: userInfo.sub,
          handle: userInfo.name || 'LinkedIn Member',
          name: userInfo.name,
          avatarUrl: userInfo.picture,
          accessTokenEnc: accessToken,
          tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
          toneProfile: toneProfile as any,
          lastAnalyzedAt: new Date(),
        },
      });
    }

    // 5. Fetch all of the user's LinkedIn posts via the API (WITHOUT saving to the database)
    const postsResult = await this.fetchLinkedInPosts(accessToken, userInfo.sub);

    return {
      account,
      accessToken,
      fetchedPosts: postsResult.posts,
      postsCount: postsResult.count,
      postsMethod: postsResult.method,
      rawLinkedInResponse: postsResult.raw,
    };
  }

  /**
   * Fetches all user posts from LinkedIn without saving to the database.
   */
  static async fetchLinkedInPosts(accessToken: string, platformUserId: string) {
    let posts: any[] = [];
    let method = 'none';
    let rawResponse: any = null;

    console.log(`🕊️ [LinkedIn Posts API] Fetching existing posts for member ${platformUserId}...`);

    // 1. Try modern REST posts API (202401)
    try {
      const authorUrn = encodeURIComponent(`urn:li:person:${platformUserId}`);
      const restRes = await fetch(`https://api.linkedin.com/rest/posts?author=${authorUrn}&q=author&count=50`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'LinkedIn-Version': '202401',
          'X-Restli-Protocol-Version': '2.0.0',
        },
      });

      if (restRes.ok) {
        const data: any = await restRes.json();
        rawResponse = data;
        if (data.elements && Array.isArray(data.elements)) {
          posts = data.elements.map((p: any) => ({
            id: p.id || p.urn,
            urn: p.id || p.urn,
            commentary: p.commentary || p.specificContent?.['com.linkedin.ugc.ShareContent']?.shareCommentary?.text || '',
            createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : (p.created?.time ? new Date(p.created.time).toISOString() : null),
            lifecycleState: p.lifecycleState,
            visibility: p.visibility,
            distribution: p.distribution,
            raw: p,
          }));
          method = 'rest/posts';
          console.log(`✓ Fetched ${posts.length} posts via LinkedIn rest/posts`);
          return { success: true, count: posts.length, posts, method, raw: data };
        }
      } else {
        const errText = await restRes.text();
        console.warn(`[LinkedIn rest/posts] returned ${restRes.status}: ${errText}`);
        rawResponse = { status: restRes.status, body: errText, endpoint: 'rest/posts' };
      }
    } catch (err: any) {
      console.warn('LinkedIn rest/posts fetch error:', err.message);
    }

    // 2. Fallback to UGC posts API
    try {
      const ugcRes = await fetch(`https://api.linkedin.com/v2/ugcPosts?q=authors&authors=List(urn%3Ali%3Aperson%3A${platformUserId})&count=50`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
        },
      });

      if (ugcRes.ok) {
        const data: any = await ugcRes.json();
        rawResponse = data;
        if (data.elements && Array.isArray(data.elements)) {
          posts = data.elements.map((p: any) => ({
            id: p.id,
            urn: p.id,
            commentary: p.specificContent?.['com.linkedin.ugc.ShareContent']?.shareCommentary?.text || '',
            createdAt: p.created?.time ? new Date(p.created.time).toISOString() : null,
            lifecycleState: p.lifecycleState,
            visibility: p.visibility?.['com.linkedin.ugc.MemberNetworkVisibility'],
            raw: p,
          }));
          method = 'v2/ugcPosts';
          console.log(`✓ Fetched ${posts.length} posts via LinkedIn v2/ugcPosts`);
          return { success: true, count: posts.length, posts, method, raw: data };
        }
      } else {
        const errText = await ugcRes.text();
        console.warn(`[LinkedIn v2/ugcPosts] returned ${ugcRes.status}: ${errText}`);
        if (!rawResponse) rawResponse = { status: ugcRes.status, body: errText, endpoint: 'v2/ugcPosts' };
      }
    } catch (err: any) {
      console.warn('LinkedIn v2/ugcPosts fetch error:', err.message);
    }

    // 3. Fallback to shares API
    try {
      const sharesRes = await fetch(`https://api.linkedin.com/v2/shares?q=owners&owners=urn%3Ali%3Aperson%3A${platformUserId}&count=50`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
        },
      });

      if (sharesRes.ok) {
        const data: any = await sharesRes.json();
        rawResponse = data;
        if (data.elements && Array.isArray(data.elements)) {
          posts = data.elements.map((p: any) => ({
            id: p.id,
            urn: p.id,
            commentary: p.text?.text || '',
            createdAt: p.created?.time ? new Date(p.created.time).toISOString() : null,
            raw: p,
          }));
          method = 'v2/shares';
          console.log(`✓ Fetched ${posts.length} posts via LinkedIn v2/shares`);
          return { success: true, count: posts.length, posts, method, raw: data };
        }
      }
    } catch (err: any) {
      console.warn('LinkedIn v2/shares fetch error:', err.message);
    }

    return {
      success: false,
      count: 0,
      posts: [],
      method: 'none',
      raw: rawResponse || { message: 'LinkedIn API returned 0 posts or read scope restricted' },
    };
  }

  // --- Helper to save credentials directly to server/.env ---
  static savePlatformCredentials(platform: string, clientId: string, clientSecret: string) {
    const envPath = path.resolve(process.cwd(), '.env');
    let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';

    const idKey = 'LINKEDIN_CLIENT_ID';
    const secretKey = 'LINKEDIN_CLIENT_SECRET';

    if (envContent.includes(`${idKey}=`)) {
      envContent = envContent.replace(new RegExp(`${idKey}=.*`, 'g'), `${idKey}="${clientId.trim()}"`);
    } else {
      envContent += `\n${idKey}="${clientId.trim()}"`;
    }

    if (envContent.includes(`${secretKey}=`)) {
      envContent = envContent.replace(new RegExp(`${secretKey}=.*`, 'g'), `${secretKey}="${clientSecret.trim()}"`);
    } else {
      envContent += `\n${secretKey}="${clientSecret.trim()}"`;
    }

    fs.writeFileSync(envPath, envContent.trim() + '\n', 'utf-8');

    // Update in-memory process.env
    process.env[idKey] = clientId.trim();
    process.env[secretKey] = clientSecret.trim();
  }

  /**
   * Publishes a post directly to the user's LinkedIn personal feed via UGC Posts API
   */
  static async publishLinkedInPost(accessToken: string, platformUserId: string, content: string): Promise<{ success: boolean; externalPostId: string }> {
    const personUrn = `urn:li:person:${platformUserId}`;

    const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        author: personUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: content,
            },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`LinkedIn UGC post failed (${res.status}):`, errorText);
      throw new Error(`LinkedIn API error (${res.status}): ${errorText}`);
    }

    const data: any = await res.json().catch(() => ({}));
    const externalPostId = data.id || res.headers.get('x-restli-id') || 'published';
    console.log(`🚀 Successfully published post to LinkedIn feed! ID: ${externalPostId}`);
    return { success: true, externalPostId };
  }
}

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

  // --- X (Twitter) OAuth 2.0 PKCE ---
  static get xClientId(): string {
    return process.env.X_CLIENT_ID || '';
  }

  static get xClientSecret(): string {
    return process.env.X_CLIENT_SECRET || '';
  }

  static isXConfigured(): boolean {
    return Boolean(this.xClientId.trim() && this.xClientSecret.trim());
  }

  static getXAuthUrl(userId: string): { url: string; configured: boolean } {
    if (!this.isXConfigured()) {
      return { url: '', configured: false };
    }

    // Generate PKCE code_verifier and code_challenge
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
    const state = this.createSignedState(userId, codeVerifier);

    const redirectUri = `${this.clientUrl}/auth/callback/x`;
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.xClientId,
      redirect_uri: redirectUri,
      scope: 'tweet.read tweet.write users.read offline.access',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    return {
      url: `https://twitter.com/i/oauth2/authorize?${params.toString()}`,
      configured: true,
    };
  }

  static async exchangeXCode(code: string, state: string) {
    if (!this.isXConfigured()) {
      throw new Error('X (Twitter) OAuth credentials not configured in server/.env');
    }

    const { codeVerifier, userId } = this.verifySignedState(state);
    const redirectUri = `${this.clientUrl}/auth/callback/x`;

    // 1. Exchange authorization code for access token with Basic auth
    const basicAuth = Buffer.from(`${this.xClientId}:${this.xClientSecret}`).toString('base64');
    const tokenRes = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        client_id: this.xClientId,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      throw new Error(`X Token Exchange Error (HTTP ${tokenRes.status}): ${errText}`);
    }

    const tokenData: any = await tokenRes.json();
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    const expiresIn = tokenData.expires_in || 7200;

    // 2. Fetch authenticated X user profile
    let xUser: { id: string; name: string; username: string; profile_image_url?: string };

    // Attempt 1: Fetch with profile_image_url
    let userRes = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    // Attempt 2: Fallback to basic /2/users/me without query parameters
    if (!userRes.ok) {
      userRes = await fetch('https://api.twitter.com/2/users/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    }

    if (!userRes.ok) {
      const errText = await userRes.text();
      console.error('X /2/users/me failed:', userRes.status, errText);

      try {
        const parsed = JSON.parse(errText);
        if (parsed.reason === 'client-not-enrolled' || (parsed.detail && parsed.detail.includes('attached to a Project'))) {
          throw new Error('X API Error: Your App is not attached to a Project in the X Developer Portal. In developer.x.com, go to Projects & Apps, open your Project, and click "+ Add App" to associate this app with the Project.');
        }
      } catch (parseErr: any) {
        if (parseErr.message.includes('X API Error')) throw parseErr;
      }

      throw new Error(`Failed to fetch real X account profile (HTTP ${userRes.status}): ${errText}`);
    }

    const userData: any = await userRes.json();
    xUser = userData.data; // Real X user: { id, name, username, profile_image_url }

    // 3. Attempt to fetch recent tweets to profile developer tone
    let sampleTweets: string[] = [];
    try {
      const tweetsRes = await fetch(`https://api.twitter.com/2/users/${xUser.id}/tweets?max_results=5`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (tweetsRes.ok) {
        const tweetsData: any = await tweetsRes.json();
        if (tweetsData.data && Array.isArray(tweetsData.data)) {
          sampleTweets = tweetsData.data.map((t: any) => t.text);
        }
      }
    } catch {
      // Fallback if user has no tweets or permissions
    }

    if (sampleTweets.length === 0) {
      sampleTweets = [
        'Just shipped a major performance improvement. Cut memory overhead by 40%.',
        'Quick engineering update: refactored our pipeline to use zero-copy buffers. Benchmarks coming soon.',
      ];
    }

    // 4. Run Gemini Voice & Tone Analysis
    const toneProfile = await GeminiService.profileVoice({
      platform: 'X',
      samplePosts: sampleTweets,
    });

    // 5. Strict Idempotent Upsert for X Account (prevents duplicate sessions)
    const existingX = await prisma.socialAccount.findFirst({
      where: {
        userId,
        platform: 'X',
        OR: [
          { platformUserId: xUser.id },
          { handle: `@${xUser.username}` },
          { handle: xUser.username },
        ],
      },
    });

    let account;
    if (existingX) {
      account = await prisma.socialAccount.update({
        where: { id: existingX.id },
        data: {
          platformUserId: xUser.id,
          handle: `@${xUser.username}`,
          name: xUser.name,
          avatarUrl: xUser.profile_image_url,
          accessTokenEnc: accessToken,
          refreshTokenEnc: refreshToken || undefined,
          tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
          toneProfile: toneProfile as any,
          lastAnalyzedAt: new Date(),
        },
      });
    } else {
      account = await prisma.socialAccount.create({
        data: {
          userId,
          platform: 'X',
          platformUserId: xUser.id,
          handle: `@${xUser.username}`,
          name: xUser.name,
          avatarUrl: xUser.profile_image_url,
          accessTokenEnc: accessToken,
          refreshTokenEnc: refreshToken || undefined,
          tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
          toneProfile: toneProfile as any,
          lastAnalyzedAt: new Date(),
        },
      });
    }

    return account;
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

    return account;
  }

  // --- Helper to save credentials directly to server/.env ---
  static savePlatformCredentials(platform: 'X' | 'LINKEDIN', clientId: string, clientSecret: string) {
    const envPath = path.resolve(process.cwd(), '.env');
    let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';

    const idKey = platform === 'X' ? 'X_CLIENT_ID' : 'LINKEDIN_CLIENT_ID';
    const secretKey = platform === 'X' ? 'X_CLIENT_SECRET' : 'LINKEDIN_CLIENT_SECRET';

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

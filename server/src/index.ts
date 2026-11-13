import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import os from 'os';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { prisma } from './db/prisma.js';
import { WebhookService, PushPayload } from './services/webhook.service.js';
import { GeminiService } from './services/gemini.service.js';
import { GitHubAuthService } from './services/githubAuth.service.js';
import { SocialAuthService } from './services/socialAuth.service.js';
import { RepoIndexerService } from './services/repoIndexer.service.js';
import { GitHubSyncService } from './services/githubSync.service.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'Pigeon Server', timestamp: new Date() });
});

// GitHub OAuth: Get Authorization URL & Config Status
app.get('/api/auth/github/url', (req: Request, res: Response) => {
  const authConfig = GitHubAuthService.getAuthorizeUrl();
  res.json(authConfig);
});

// GitHub OAuth: Exchange Code Callback
app.post('/api/auth/github/callback', async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }
    const accessToken = await GitHubAuthService.exchangeCodeForToken(code);
    const profile = await GitHubAuthService.fetchGitHubProfile(accessToken);
    const { user, token } = await GitHubAuthService.authenticateUser(profile, accessToken);
    res.json({ success: true, user, token });
  } catch (error: any) {
    console.error('GitHub OAuth error:', error);
    res.status(500).json({ error: error.message || 'OAuth authentication failed' });
  }
});

// Save GitHub OAuth credentials to server/.env and return auth URL
app.post('/api/auth/github/configure', async (req: Request, res: Response) => {
  try {
    const { clientId, clientSecret } = req.body;
    if (!clientId || !clientSecret) {
      return res.status(400).json({ error: 'Client ID and Client Secret are required' });
    }

    process.env.GITHUB_CLIENT_ID = clientId.trim();
    process.env.GITHUB_CLIENT_SECRET = clientSecret.trim();

    // Persist to server/.env file
    const envPath = path.resolve(process.cwd(), '.env');
    let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';

    if (envContent.includes('GITHUB_CLIENT_ID=')) {
      envContent = envContent.replace(/GITHUB_CLIENT_ID=.*/g, `GITHUB_CLIENT_ID="${clientId.trim()}"`);
    } else {
      envContent += `\nGITHUB_CLIENT_ID="${clientId.trim()}"`;
    }

    if (envContent.includes('GITHUB_CLIENT_SECRET=')) {
      envContent = envContent.replace(/GITHUB_CLIENT_SECRET=.*/g, `GITHUB_CLIENT_SECRET="${clientSecret.trim()}"`);
    } else {
      envContent += `\nGITHUB_CLIENT_SECRET="${clientSecret.trim()}"`;
    }

    fs.writeFileSync(envPath, envContent.trim() + '\n', 'utf-8');

    const authConfig = GitHubAuthService.getAuthorizeUrl();
    res.json({ success: true, ...authConfig });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Current Authenticated User Session
app.get('/api/auth/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'pigeon-jwt-secret-key-default') as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        socialAccounts: true,
        socialGroups: { include: { members: true } },
        repositories: true,
      },
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error: any) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// Social Platform Config Status
app.get('/api/socials/config-status', (req: Request, res: Response) => {
  res.json({
    xConfigured: SocialAuthService.isXConfigured(),
    linkedInConfigured: SocialAuthService.isLinkedInConfigured(),
  });
});

// Configure Social Platform Credentials (saves to server/.env)
app.post('/api/socials/configure', (req: Request, res: Response) => {
  try {
    const { platform, clientId, clientSecret } = req.body;
    if (!platform || !clientId || !clientSecret) {
      return res.status(400).json({ error: 'Platform, Client ID, and Client Secret are required' });
    }

    if (platform !== 'X' && platform !== 'LINKEDIN') {
      return res.status(400).json({ error: 'Unsupported platform' });
    }

    SocialAuthService.savePlatformCredentials(platform, clientId, clientSecret);
    res.json({ success: true, platform });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get Authorization URL for X or LinkedIn
app.get('/api/socials/auth-url/:platform', (req: Request, res: Response) => {
  const platform = (req.params.platform as string).toUpperCase();
  const userId = (req.query.userId as string) || 'default_user';

  if (platform === 'X') {
    const auth = SocialAuthService.getXAuthUrl(userId);
    return res.json(auth);
  } else if (platform === 'LINKEDIN') {
    const auth = SocialAuthService.getLinkedInAuthUrl(userId);
    return res.json(auth);
  }

  return res.status(400).json({ error: 'Invalid platform. Choose X or LINKEDIN' });
});

// X OAuth 2.0 Callback
app.post('/api/socials/callback/x', async (req: Request, res: Response) => {
  try {
    const { code, state } = req.body;
    if (!code || !state) {
      return res.status(400).json({ error: 'Authorization code and state are required' });
    }

    const account = await SocialAuthService.exchangeXCode(code, state);
    res.json({ success: true, account });
  } catch (error: any) {
    console.error('X OAuth callback error:', error);
    res.status(500).json({ error: error.message || 'X authentication failed' });
  }
});

// LinkedIn OAuth 2.0 Callback
app.post('/api/socials/callback/linkedin', async (req: Request, res: Response) => {
  try {
    const { code, state } = req.body;
    if (!code || !state) {
      return res.status(400).json({ error: 'Authorization code and state are required' });
    }

    const account = await SocialAuthService.exchangeLinkedInCode(code, state);
    res.json({ success: true, account });
  } catch (error: any) {
    console.error('LinkedIn OAuth callback error:', error);
    res.status(500).json({ error: error.message || 'LinkedIn authentication failed' });
  }
});

// Live Test-Post Endpoint to verify live social connection
app.post('/api/socials/test-post/:platform', async (req: Request, res: Response) => {
  try {
    const platform = (req.params.platform as string).toUpperCase();
    const userId = (req.body.userId as string) || (req.query.userId as string);

    const account = await prisma.socialAccount.findFirst({
      where: {
        ...(userId ? { userId } : {}),
        platform: platform as any,
      },
    });

    if (!account) {
      return res.status(404).json({ error: `No connected ${platform} account found to test` });
    }

    if (platform === 'X') {
      const resTweet = await fetch('https://api.twitter.com/2/tweets', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${account.accessTokenEnc}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: `Testing Pigeon integration 🕊️ • Commit to your socials! (${new Date().toLocaleTimeString()})`
        })
      });

      const tweetData: any = await resTweet.json();
      if (!resTweet.ok) {
        return res.status(resTweet.status).json({
          error: tweetData.detail || tweetData.title || JSON.stringify(tweetData)
        });
      }

      return res.json({ success: true, tweet: tweetData });
    }

    if (platform === 'LINKEDIN') {
      const personUrn = `urn:li:person:${account.platformUserId}`;
      const commentary = `Just linked my developer presence to Pigeon! 🕊️\n\nTurning GitHub commits into authentic, platform-native social updates without context switching.\n\n#buildinpublic #developer #pigeon`;

      // Method 1: Modern Versioned Posts API (202401)
      let liRes = await fetch('https://api.linkedin.com/rest/posts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${account.accessTokenEnc}`,
          'LinkedIn-Version': '202401',
          'X-Restli-Protocol-Version': '2.0.0',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          author: personUrn,
          commentary,
          visibility: 'PUBLIC',
          distribution: {
            feedDistribution: 'MAIN_FEED',
            targetEntities: [],
            thirdPartyDistributionChannels: []
          },
          lifecycleState: 'PUBLISHED',
          isReshareDisabledByAuthor: false
        })
      });

      // Method 2: Fallback to UGC Posts API if versioned endpoint requires specific enterprise entitlement
      if (!liRes.ok) {
        const firstErr = await liRes.text();
        console.warn('LinkedIn rest/posts fallback to v2/ugcPosts. Reason:', firstErr);

        liRes = await fetch('https://api.linkedin.com/v2/ugcPosts', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${account.accessTokenEnc}`,
            'X-Restli-Protocol-Version': '2.0.0',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            author: personUrn,
            lifecycleState: 'PUBLISHED',
            specificContent: {
              'com.linkedin.ugc.ShareContent': {
                shareCommentary: {
                  text: commentary
                },
                shareMediaCategory: 'NONE'
              }
            },
            visibility: {
              'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
            }
          })
        });
      }

      if (!liRes.ok) {
        const errBody = await liRes.text();
        console.error('LinkedIn post failed:', liRes.status, errBody);
        return res.status(liRes.status).json({
          error: `LinkedIn returned HTTP ${liRes.status}: ${errBody}`
        });
      }

      const postData = liRes.status === 201 
        ? { status: 'published', id: liRes.headers.get('x-restli-id') } 
        : await liRes.json().catch(() => ({ status: 'published' }));

      return res.json({ 
        success: true, 
        post: postData, 
        message: 'Verification post shared on your LinkedIn profile! 🚀' 
      });
    }

    return res.json({ success: true, message: `${platform} connection verified` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update social account handle
app.put('/api/socials/:id/handle', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    let { handle } = req.body;
    if (!handle) {
      return res.status(400).json({ error: 'Handle is required' });
    }
    if (!handle.startsWith('@')) {
      handle = `@${handle.trim()}`;
    }
    const account = await prisma.socialAccount.update({
      where: { id },
      data: { handle },
    });
    res.json({ success: true, account });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Disconnect/Delete social account
app.delete('/api/socials/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.socialAccount.delete({
      where: { id },
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Connect Social Account & Analyze Tone
app.post('/api/socials/connect', async (req: Request, res: Response) => {
  try {
    const { userId, platform, handle, name, samplePosts } = req.body;

    // AI extracts voice profile from sample posts
    const toneProfile = await GeminiService.profileVoice({
      platform,
      samplePosts: samplePosts || [
        'Just shipped a major optimization to our indexing pipeline. 4x throughput boost.',
        'Architecture is about trade-offs: picking the right bottleneck to accept.',
      ],
    });

    const account = await prisma.socialAccount.create({
      data: {
        userId,
        platform,
        platformUserId: `${platform.toLowerCase()}_${Date.now()}`,
        handle: handle.startsWith('@') ? handle : `@${handle}`,
        name: name || handle,
        accessTokenEnc: 'mock_encrypted_token',
        toneProfile: toneProfile as any,
        lastAnalyzedAt: new Date(),
      },
    });

    res.json({ success: true, account });
  } catch (error: any) {
    console.error('Social connect error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create Social Group (e.g. ZaneGroup)
app.post('/api/groups', async (req: Request, res: Response) => {
  try {
    const { userId, name, description, accountIds } = req.body;

    const group = await prisma.socialGroup.create({
      data: {
        userId,
        name: name.trim().replace(/\s+/g, ''),
        description,
        members: {
          create: (accountIds || []).map((id: string) => ({
            socialAccountId: id,
          })),
        },
      },
      include: { members: { include: { socialAccount: true } } },
    });

    res.json({ success: true, group });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update Social Group (members, name, description)
app.put('/api/groups/:id', async (req: Request, res: Response) => {
  try {
    const groupId = req.params.id as string;
    const { name, description, accountIds } = req.body;

    // If accountIds is provided, sync the members
    if (Array.isArray(accountIds)) {
      await prisma.socialGroupMember.deleteMany({
        where: { groupId },
      });
      if (accountIds.length > 0) {
        await prisma.socialGroupMember.createMany({
          data: accountIds.map((accId: string) => ({
            groupId,
            socialAccountId: accId,
          })),
        });
      }
    }

    const updated = await prisma.socialGroup.update({
      where: { id: groupId },
      data: {
        ...(name ? { name: name.trim().replace(/\s+/g, '') } : {}),
        ...(description !== undefined ? { description } : {}),
      },
      include: {
        members: {
          include: { socialAccount: true },
        },
      },
    });

    res.json({ success: true, group: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GitHub Webhook Simulator / Receiver (supports both raw GitHub push payloads & simulator payloads)
app.post('/api/webhooks/github', async (req: Request, res: Response) => {
  try {
    // 1. Direct Push payload format: { push, userId }
    if (req.body.push) {
      const { push, userId } = req.body;
      let targetUserId = userId;
      if (!targetUserId) {
        const firstUser = await prisma.user.findFirst();
        targetUserId = firstUser?.id;
      }
      if (!targetUserId) {
        return res.status(400).json({ error: 'No user ID provided or found in DB' });
      }
      const result = await WebhookService.handleIncomingPush(push, targetUserId);
      return res.json(result);
    }

    // 2. Direct Commit payload format: { commit, userId }
    if (req.body.commit) {
      const { commit, userId } = req.body;
      let targetUserId = userId;
      if (!targetUserId) {
        const firstUser = await prisma.user.findFirst();
        targetUserId = firstUser?.id;
      }
      if (!targetUserId) {
        return res.status(400).json({ error: 'No user ID provided or found in DB' });
      }
      const result = await WebhookService.handleIncomingCommit(commit, targetUserId);
      return res.json(result);
    }

    // 3. Standard GitHub Push Event payload format: { repository, commits, pusher / sender }
    // Per-push aggregation: Summarizes all commits in the push into ONE post per target account
    if (req.body.repository && Array.isArray(req.body.commits)) {
      const repoData = req.body.repository;
      const commits = req.body.commits;
      const ownerLogin = repoData.owner?.login || repoData.owner?.name;
      const senderLogin = req.body.sender?.login || req.body.pusher?.name || ownerLogin;

      // Find user by github username
      let user = await prisma.user.findFirst({
        where: {
          OR: [
            { username: senderLogin },
            { username: ownerLogin },
          ],
        },
      });

      if (!user) {
        // Fallback to first user in system
        user = await prisma.user.findFirst();
      }

      if (!user) {
        return res.status(404).json({ error: 'No matching user found in Pigeon database' });
      }

      // Check if any commit in this push contains #Pigeon
      const hasTaggedCommit = commits.some((c: any) => WebhookService.parseCommitTag(c.message || '').hasPigeonTag);

      if (!hasTaggedCommit) {
        return res.json({
          ignored: true,
          reason: 'No commits in this push contained the #Pigeon tag. 0 database modifications made.',
        });
      }

      const headSha = req.body.after || req.body.head_commit?.id || commits[commits.length - 1]?.id || 'head';

      const pushPayload: PushPayload = {
        headSha,
        ref: req.body.ref,
        remoteRepoUrl: repoData.html_url,
        repoName: repoData.full_name || repoData.name,
        author: senderLogin,
        commits: commits.map((c: any) => ({
          sha: c.id || c.sha || 'latest',
          message: c.message || '',
          author: c.author?.name || c.author?.username || senderLogin,
          modifiedFiles: c.modified || [],
          addedFiles: c.added || [],
          removedFiles: c.removed || [],
        })),
      };

      const result = await WebhookService.handleIncomingPush(pushPayload, user.id);
      return res.json(result);
    }

    return res.status(400).json({ error: 'Unrecognized webhook payload format' });
  } catch (error: any) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Fetch all posts with filters
app.get('/api/posts', async (req: Request, res: Response) => {
  try {
    const userId = (req.query.userId as string);
    const status = (req.query.status as string);
    const search = (req.query.search as string);

    const where: any = {};
    if (userId) {
      where.repository = { userId };
    }
    if (status && status !== 'All') {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { commitMessage: { contains: search, mode: 'insensitive' } },
        { commitSha: { contains: search, mode: 'insensitive' } },
        { generatedContent: { contains: search, mode: 'insensitive' } },
        { repositoryUrl: { contains: search, mode: 'insensitive' } },
      ];
    }

    const posts = await prisma.post.findMany({
      where,
      include: {
        repository: true,
        socialAccount: true,
        metrics: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, posts });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update draft post content
app.put('/api/posts/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    const post = await prisma.post.update({
      where: { id },
      data: { generatedContent: content },
    });
    res.json({ success: true, post });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Fetch pending approval drafts (Guided Mode)
app.get('/api/posts/queue', async (req: Request, res: Response) => {
  try {
    const posts = await prisma.post.findMany({
      where: { status: 'PENDING_APPROVAL' },
      include: { repository: true, socialAccount: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ posts });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Approve post (and publish to LinkedIn if connected!)
app.post('/api/posts/:id/approve', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    let post = await prisma.post.findUnique({
      where: { id },
      include: { socialAccount: true, repository: true },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    let externalPostId: string | null = null;
    let publishError: string | null = null;

    // If connected to LinkedIn, trigger live publish!
    if (post.socialAccount && post.socialAccount.platform === 'LINKEDIN' && post.socialAccount.accessTokenEnc) {
      try {
        const publishResult = await SocialAuthService.publishLinkedInPost(
          post.socialAccount.accessTokenEnc,
          post.socialAccount.platformUserId,
          post.generatedContent
        );
        externalPostId = publishResult.externalPostId;
      } catch (liErr: any) {
        console.error('Failed to publish live to LinkedIn:', liErr);
        publishError = liErr.message || 'LinkedIn publish error';
      }
    }

    if (publishError) {
      await prisma.post.update({
        where: { id },
        data: { errorMessage: publishError },
      });
      return res.status(502).json({ error: publishError });
    }

    post = await prisma.post.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        externalPostId,
        errorMessage: null,
      },
      include: { socialAccount: true, repository: true },
    });

    res.json({ success: true, post });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Reject post
app.post('/api/posts/:id/reject', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const post = await prisma.post.update({
      where: { id },
      data: { status: 'REJECTED' },
    });
    res.json({ success: true, post });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Broadcast Approval: Approves and publishes all channel posts for a single commit event at once
app.post('/api/broadcasts/approve', async (req: Request, res: Response) => {
  try {
    const { commitSha, postIds } = req.body;
    if (!commitSha && (!postIds || postIds.length === 0)) {
      return res.status(400).json({ error: 'commitSha or postIds are required' });
    }

    const whereClause: any = {
      status: 'PENDING_APPROVAL',
      ...(commitSha ? { commitSha } : { id: { in: postIds } }),
    };

    const pendingPosts = await prisma.post.findMany({
      where: whereClause,
      include: { socialAccount: true, repository: true },
    });

    if (pendingPosts.length === 0) {
      return res.status(404).json({ error: 'No pending posts found for this broadcast' });
    }

    const publishedResults = [];
    const errors = [];

    for (const post of pendingPosts) {
      let externalPostId: string | null = null;
      let publishError: string | null = null;

      if (post.socialAccount && post.socialAccount.platform === 'LINKEDIN' && post.socialAccount.accessTokenEnc) {
        try {
          const res = await SocialAuthService.publishLinkedInPost(
            post.socialAccount.accessTokenEnc,
            post.socialAccount.platformUserId,
            post.generatedContent
          );
          externalPostId = res.externalPostId;
        } catch (err: any) {
          console.error(`Broadcast failed for account ${post.socialAccount.id}:`, err);
          publishError = err.message || 'Publishing error';
          errors.push({ postId: post.id, error: publishError });
        }
      }

      if (!publishError) {
        const updated = await prisma.post.update({
          where: { id: post.id },
          data: {
            status: 'PUBLISHED',
            publishedAt: new Date(),
            externalPostId,
            errorMessage: null,
          },
          include: { socialAccount: true },
        });
        publishedResults.push(updated);
      } else {
        await prisma.post.update({
          where: { id: post.id },
          data: { errorMessage: publishError },
        });
      }
    }

    res.json({
      success: publishedResults.length > 0,
      publishedCount: publishedResults.length,
      errorsCount: errors.length,
      published: publishedResults,
      errors,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Broadcast Reject: Rejects all channel posts for a single commit event
app.post('/api/broadcasts/reject', async (req: Request, res: Response) => {
  try {
    const { commitSha, postIds } = req.body;
    if (!commitSha && (!postIds || postIds.length === 0)) {
      return res.status(400).json({ error: 'commitSha or postIds are required' });
    }

    const whereClause: any = {
      status: 'PENDING_APPROVAL',
      ...(commitSha ? { commitSha } : { id: { in: postIds } }),
    };

    const updated = await prisma.post.updateMany({
      where: whereClause,
      data: { status: 'REJECTED' },
    });

    res.json({ success: true, rejectedCount: updated.count });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get User Groups
app.get('/api/groups', async (req: Request, res: Response) => {
  try {
    const userId = (req.query.userId as string);
    const groups = await prisma.socialGroup.findMany({
      where: userId ? { userId } : {},
      include: {
        members: {
          include: { socialAccount: true },
        },
      },
    });
    res.json({ success: true, groups });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Group
app.delete('/api/groups/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.socialGroup.delete({ where: { id } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get User Repositories
app.get('/api/repos', async (req: Request, res: Response) => {
  try {
    const userId = (req.query.userId as string);
    const repos = await prisma.repository.findMany({
      where: userId ? { userId } : {},
      orderBy: { updatedAt: 'desc' },
    });
    res.json({ success: true, repositories: repos });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Deep Index All Repositories for a User
app.post('/api/repos/index-all', async (req: Request, res: Response) => {
  try {
    const userId = (req.body.userId as string) || (req.query.userId as string);
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    const results = await RepoIndexerService.indexAllUserRepositories(userId);
    res.json({ success: true, count: results.length, repositories: results });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Deep Index a Single Repository
app.post('/api/repos/index-single', async (req: Request, res: Response) => {
  try {
    const { remoteUrl, userId } = req.body;
    if (!remoteUrl || !userId) {
      return res.status(400).json({ error: 'remoteUrl and userId are required' });
    }
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.accessToken) {
      return res.status(401).json({ error: 'GitHub access token not found for user' });
    }
    const result = await RepoIndexerService.analyzeRepository(remoteUrl, user.accessToken);
    res.json({ success: true, repository: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update Repository Context
app.put('/api/repos/context', async (req: Request, res: Response) => {
  try {
    const { remoteUrl, pinnedContext, defaultMode } = req.body;
    if (!remoteUrl) {
      return res.status(400).json({ error: 'remoteUrl is required' });
    }

    const repo = await prisma.repository.update({
      where: { remoteUrl },
      data: {
        ...(pinnedContext !== undefined ? { pinnedContext } : {}),
        ...(defaultMode !== undefined ? { defaultMode } : {}),
      },
    });
    res.json({ success: true, repository: repo });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Untrack / Delete a Single Repository
app.delete('/api/repos', async (req: Request, res: Response) => {
  try {
    const remoteUrl = (req.body.remoteUrl as string) || (req.query.remoteUrl as string);
    if (!remoteUrl) {
      return res.status(400).json({ error: 'remoteUrl is required' });
    }

    await prisma.repository.delete({
      where: { remoteUrl },
    });

    res.json({ success: true, message: `Untracked repository ${remoteUrl}` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Purge / Clear All Repositories for a User (for clean slate JIT discovery)
app.delete('/api/repos/all', async (req: Request, res: Response) => {
  try {
    const userId = (req.body.userId as string) || (req.query.userId as string);
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const deleted = await prisma.repository.deleteMany({
      where: { userId },
    });

    res.json({ success: true, count: deleted.count, message: `Purged ${deleted.count} repositories` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get Tone Studio Settings
app.get('/api/user/tone', async (req: Request, res: Response) => {
  try {
    const userId = (req.query.userId as string);
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        technicalDepth: true,
        formality: true,
        negativePrompt: true,
        mode: true,
      },
    });
    res.json({ success: true, tone: user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update Tone Studio Settings
app.put('/api/user/tone', async (req: Request, res: Response) => {
  try {
    const { userId, technicalDepth, formality, negativePrompt, mode } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(technicalDepth !== undefined ? { technicalDepth: Number(technicalDepth) } : {}),
        ...(formality !== undefined ? { formality: Number(formality) } : {}),
        ...(negativePrompt !== undefined ? { negativePrompt } : {}),
        ...(mode !== undefined ? { mode } : {}),
      },
    });

    if (mode !== undefined) {
      await prisma.repository.updateMany({
        where: { userId },
        data: { defaultMode: mode },
      });
      console.log(`🤖 Engine mode switched to ${mode} for user ${userId} and all repositories.`);
    }

    res.json({ success: true, user: updatedUser });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle repository default mode (AUTO vs GUIDED)
app.put('/api/repositories/mode', async (req: Request, res: Response) => {
  try {
    const { remoteUrl, mode } = req.body;
    if (!remoteUrl || !mode) {
      return res.status(400).json({ error: 'remoteUrl and mode are required' });
    }

    const updated = await prisma.repository.update({
      where: { remoteUrl },
      data: { defaultMode: mode },
    });

    res.json({ success: true, repository: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Commit / Push Tag Simulator endpoint
app.post('/api/simulator/commit', async (req: Request, res: Response) => {
  try {
    const { commitMessage, commits: rawCommits } = req.body;
    if (!commitMessage && (!rawCommits || rawCommits.length === 0)) {
      return res.status(400).json({ error: 'commitMessage or commits array is required' });
    }

    // Split multi-line input into individual commit messages if provided
    const commitLines: string[] = rawCommits && Array.isArray(rawCommits)
      ? rawCommits.map((c: any) => typeof c === 'string' ? c : c.message)
      : (commitMessage as string).split('\n').map(l => l.trim()).filter(Boolean);

    let detectedTagInfo = WebhookService.parseCommitTag(commitMessage || commitLines[0] || '');
    for (const line of commitLines) {
      const parsed = WebhookService.parseCommitTag(line);
      if (parsed.hasPigeonTag) {
        detectedTagInfo = parsed;
        break;
      }
    }

    let targetGroup = detectedTagInfo.groupName 
      ? detectedTagInfo.groupName 
      : (detectedTagInfo.isAmbiguous ? 'Unspecified (Fallback to Guided)' : 'Broadcast (All Channels)');

    let targetAccountsDesc = 'Broadcast to all connected social channels';
    let matchedAccountCount = 0;

    if (detectedTagInfo.groupName) {
      const cleanTarget = detectedTagInfo.groupName.trim().toLowerCase().replace(/[-_\s]+/g, '');
      const user = await prisma.user.findFirst({
        where: req.body.userId ? { id: req.body.userId } : {},
        include: { socialGroups: { include: { members: { include: { socialAccount: true } } } } },
      });

      const matchedGroup = user?.socialGroups?.find(g => 
        g.name.toLowerCase().replace(/[-_\s]+/g, '') === cleanTarget
      );

      if (matchedGroup && matchedGroup.members.length > 0) {
        targetGroup = matchedGroup.name;
        matchedAccountCount = matchedGroup.members.length;
        targetAccountsDesc = `Strictly limited to ${matchedAccountCount} account(s) in #${matchedGroup.name}: ${matchedGroup.members.map(m => `${m.socialAccount.platform}: ${m.socialAccount.name || m.socialAccount.handle}`).join(', ')}`;
      } else if (matchedGroup) {
        targetGroup = matchedGroup.name;
        targetAccountsDesc = `Group #${matchedGroup.name} exists but has 0 assigned accounts (fallback to broadcast)`;
      } else {
        targetAccountsDesc = `Group "${detectedTagInfo.groupName}" not found in your settings (fallback to broadcast)`;
      }
    }

    const cleanCommits = commitLines
      .map(c => c.replace(/#Pigeon\S*/g, '').trim())
      .filter(Boolean);

    const primaryCommit = cleanCommits[cleanCommits.length - 1] || cleanCommits[0] || 'Code updates';

    let xDraft = '';
    let liDraft = '';

    if (cleanCommits.length > 1) {
      xDraft = `Pushed ${cleanCommits.length} updates: ${cleanCommits.slice(0, 2).join(' + ')}${cleanCommits.length > 2 ? ` (+${cleanCommits.length - 2} more)` : ''} ⚡ #buildinpublic`;
      liDraft = `Pushed ${cleanCommits.length} updates across core modules:\n\n${cleanCommits.map(c => `• ${c}`).join('\n')}\n\nKeeping architecture lean, modular, and decoupled. 🕊️`;
    } else {
      xDraft = `Shipped: ${primaryCommit} ⚡ #buildinpublic`;
      liDraft = `${primaryCommit}.\n\nWorked through core logic to keep our implementation lean, reliable, and decoupled.\n\nBuilding in public with #Pigeon 🕊️`;
    }

    res.json({
      success: true,
      group: targetGroup,
      targetAccountsDesc,
      matchedAccountCount,
      commitsCount: cleanCommits.length,
      x: xDraft,
      li: liDraft,
      tagInfo: detectedTagInfo,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Full Dashboard Overview Stats & Seeding
app.get('/api/dashboard/stats', async (req: Request, res: Response) => {
  try {
    const userId = (req.query.userId as string);
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    let user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        socialAccounts: true,
        socialGroups: { include: { members: { include: { socialAccount: true } } } },
        repositories: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Query actual posts from database
    const posts = await prisma.post.findMany({
      where: { repository: { userId } },
      include: { repository: true, socialAccount: true, metrics: true },
      orderBy: { createdAt: 'desc' },
    });

    const pendingCount = posts.filter(p => p.status === 'PENDING_APPROVAL').length;
    const publishedCount = posts.filter(p => p.status === 'PUBLISHED').length;
    const totalReach = posts.reduce((sum, p) => sum + (p.metrics?.[0]?.impressions || (p.status === 'PUBLISHED' ? 1200 : 0)), 0);

    res.json({
      success: true,
      user,
      stats: {
        pendingCount,
        publishedCount,
        totalReach,
      },
      posts,
      repositories: user.repositories || [],
      groups: user.socialGroups || [],
    });
  } catch (error: any) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GitHub Manual Trigger Sync (scans recent pushes on demand)
app.post('/api/github/sync', async (req: Request, res: Response) => {
  try {
    const userId = (req.body.userId as string) || (req.query.userId as string);
    let targetUserId: string | undefined = userId;
    if (!targetUserId) {
      const firstUser = await prisma.user.findFirst();
      targetUserId = firstUser?.id;
    }

    if (!targetUserId) {
      return res.status(400).json({ error: 'No user ID found to sync' });
    }

    const result = await GitHubSyncService.syncRecentPushes(targetUserId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(Number(PORT), '0.0.0.0', () => {
  const nets = os.networkInterfaces();
  let lanIp = 'localhost';
  for (const name of Object.keys(nets)) {
    if (name.startsWith('docker') || name.startsWith('br-') || name.startsWith('veth')) continue;
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        lanIp = net.address;
        break;
      }
    }
  }

  console.log(`🚀 Pigeon Backend running on:`);
  console.log(`   - Local:   http://localhost:${PORT}`);
  console.log(`   - Network: http://${lanIp}:${PORT}`);
  // Start automated GitHub activity sync poller (runs every 10 seconds locally)
  GitHubSyncService.startBackgroundPoller(10000);
});

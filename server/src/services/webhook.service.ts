import { prisma } from '../db/prisma.js';
import { GeminiService, PushCommitItem } from './gemini.service.js';
import { CodeGraphWalker } from './codeGraph.service.js';
import { RepoIndexerService } from './repoIndexer.service.js';
import { SocialAuthService } from './socialAuth.service.js';

export interface CommitPayload {
  sha: string;
  message: string;
  author: string;
  diffSummary?: string;
  remoteRepoUrl: string;
  repoName: string;
  repoLocalPath?: string;
}

export interface PushCommit {
  sha: string;
  message: string;
  author?: string;
  modifiedFiles?: string[];
  addedFiles?: string[];
  removedFiles?: string[];
}

export interface PushPayload {
  pushId?: string;
  headSha: string;
  ref?: string;
  remoteRepoUrl: string;
  repoName: string;
  author?: string;
  commits: PushCommit[];
  repoLocalPath?: string;
}

export interface ParseTagResult {
  hasPigeonTag: boolean;
  isGroupTargeted: boolean;
  groupName: string | null;
  isAmbiguous: boolean;
}

export class WebhookService {
  /**
   * Parses the commit message for #Pigeon or #Pigeon-g<GroupName>
   */
  static parseCommitTag(message: string): ParseTagResult {
    // Check for #Pigeon-g<GroupName>
    const groupMatch = message.match(/#Pigeon-g([A-Za-z0-9_-]+)/i);
    if (groupMatch) {
      return {
        hasPigeonTag: true,
        isGroupTargeted: true,
        groupName: groupMatch[1],
        isAmbiguous: false,
      };
    }

    // Check for broken group tag like '#Pigeon-g' without group name
    if (/#Pigeon-g(?:\s|$)/i.test(message)) {
      return {
        hasPigeonTag: true,
        isGroupTargeted: true,
        groupName: null,
        isAmbiguous: true, // Requires guided mode fallback!
      };
    }

    // Standard broadcast tag #Pigeon
    if (/#Pigeon\b/i.test(message)) {
      return {
        hasPigeonTag: true,
        isGroupTargeted: false,
        groupName: null,
        isAmbiguous: false,
      };
    }

    return {
      hasPigeonTag: false,
      isGroupTargeted: false,
      groupName: null,
      isAmbiguous: false,
    };
  }

  /**
   * Main entrypoint for processing an incoming push event.
   * Summarizes all commits and modified files in the push into ONE cohesive post per target account.
   */
  static async handleIncomingPush(push: PushPayload, userId: string) {
    if (!push.commits || push.commits.length === 0) {
      return { ignored: true, reason: 'Push contains 0 commits' };
    }

    // 1. Tag Detection across the entire push batch
    let hasAnyPigeonTag = false;
    let targetGroupName: string | null = null;
    let isAmbiguous = false;

    for (const c of push.commits) {
      const tagInfo = this.parseCommitTag(c.message || '');
      if (tagInfo.hasPigeonTag) {
        hasAnyPigeonTag = true;
        if (tagInfo.isGroupTargeted && tagInfo.groupName) {
          targetGroupName = tagInfo.groupName;
        }
        if (tagInfo.isAmbiguous) {
          isAmbiguous = true;
        }
      }
    }

    if (!hasAnyPigeonTag) {
      return { ignored: true, reason: 'No #Pigeon tag found in any commit of this push' };
    }

    // 2. Strict Idempotency Check: Don't process the same push/headSha twice
    const existingPost = await prisma.post.findFirst({
      where: { commitSha: push.headSha },
    });
    if (existingPost) {
      console.log(`🕊️ [Push Skipped] Push head ${push.headSha.slice(0, 7)} was already processed into post ${existingPost.id}.`);
      return { ignored: true, reason: `Push with head ${push.headSha.slice(0, 7)} has already been processed` };
    }

    // 3. JIT Discovery / Cache of Repository
    let repo = await prisma.repository.findUnique({
      where: { remoteUrl: push.remoteRepoUrl },
    });

    if (!repo) {
      console.log(`🕊️ [JIT Discovery] First tagged push detected for ${push.remoteRepoUrl}.`);
      console.log(`Indexing and saving repository to DB on-demand...`);

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user && user.accessToken) {
        try {
          repo = await RepoIndexerService.analyzeRepository(push.remoteRepoUrl, user.accessToken, userId);
        } catch (indexErr) {
          console.warn('JIT GitHub API indexing failed, falling back to local analysis:', indexErr);
        }
      }

      if (!repo) {
        const skeleton = push.repoLocalPath 
          ? await CodeGraphWalker.buildSkeleton(push.repoLocalPath, 3)
          : { manifest: {}, keyFiles: [], techStack: ['TypeScript', 'Express'] };

        const analysis = await GeminiService.summarizeCodebase({
          repoUrl: push.remoteRepoUrl,
          name: push.repoName,
          manifest: skeleton.manifest,
          depthFiles: skeleton.keyFiles.map(k => ({ path: k.path, summary: k.summary })),
        });

        repo = await prisma.repository.create({
          data: {
            remoteUrl: push.remoteRepoUrl,
            userId,
            name: push.repoName,
            projectSummary: analysis.summary,
            techStack: analysis.techStack,
            architecturalMap: skeleton.keyFiles as any,
            defaultMode: 'GUIDED',
            tagKeyword: '#Pigeon',
          },
        });
      }
    }

    // 4. Resolve Target Social Accounts
    let targetAccounts = await prisma.socialAccount.findMany({
      where: { userId },
    });

    let effectiveMode = repo.defaultMode;

    if (targetGroupName || isAmbiguous) {
      if (isAmbiguous || !targetGroupName) {
        effectiveMode = 'GUIDED';
        console.log('⚠️ Group name unspecified in tag (#Pigeon-g). Falling back to Guided Mode.');
      } else {
        const group = await prisma.socialGroup.findUnique({
          where: { userId_name: { userId, name: targetGroupName } },
          include: { members: { include: { socialAccount: true } } },
        });

        if (group && group.members.length > 0) {
          targetAccounts = group.members.map(m => m.socialAccount);
        } else {
          effectiveMode = 'GUIDED';
          console.log(`⚠️ Group "${targetGroupName}" not found. Falling back to Guided Mode.`);
        }
      }
    }

    if (targetAccounts.length === 0) {
      console.warn(`⚠️ No connected social accounts found for user ${userId}. Drafts cannot be created.`);
      return { ignored: true, reason: 'No connected social accounts found' };
    }

    // 5. Aggregate commit messages and touched files across the entire push
    const cleanCommits: PushCommitItem[] = push.commits.map(c => ({
      sha: c.sha || 'latest',
      message: (c.message || '').replace(/#Pigeon\S*/g, '').trim(),
      author: c.author,
      modifiedFiles: [
        ...(c.modifiedFiles || []),
        ...(c.addedFiles || []),
        ...(c.removedFiles || []),
      ],
    })).filter(c => c.message.length > 0);

    const allTouchedFiles = Array.from(new Set(
      push.commits.flatMap(c => [
        ...(c.modifiedFiles || []),
        ...(c.addedFiles || []),
        ...(c.removedFiles || []),
      ])
    ));

    const depthContext = Array.isArray(repo.architecturalMap) 
      ? (repo.architecturalMap as any[]).map(node => node.path)
      : allTouchedFiles.length > 0 ? allTouchedFiles : ['src/server.ts', 'src/routes/api.ts'];

    // Construct a push summary title
    const latestCommitMsg = cleanCommits[cleanCommits.length - 1]?.message || cleanCommits[0]?.message || 'Pushed updates';
    const summaryTitle = cleanCommits.length > 1
      ? `${latestCommitMsg} (+${cleanCommits.length - 1} commits: ${cleanCommits.map(c => c.message).join(' | ')})`
      : latestCommitMsg;

    // 6. Synthesize ONE cohesive post per target account for this push
    const generatedPosts = [];

    for (const account of targetAccounts) {
      const content = await GeminiService.generatePushSummaryPost({
        platform: account.platform as any,
        toneProfile: account.toneProfile || {},
        projectSummary: repo.projectSummary || '',
        commits: cleanCommits,
        allTouchedFiles,
        matchedGroupName: targetGroupName || undefined,
        depthContext,
      });

      const isAuto = effectiveMode === 'AUTO' && !isAmbiguous;
      let externalPostId: string | null = null;
      let initialStatus: 'PUBLISHED' | 'PENDING_APPROVAL' = isAuto ? 'PUBLISHED' : 'PENDING_APPROVAL';

      // If Auto Mode and LinkedIn, dispatch immediately!
      if (isAuto && account.platform === 'LINKEDIN' && account.accessTokenEnc) {
        try {
          const res = await SocialAuthService.publishLinkedInPost(account.accessTokenEnc, account.platformUserId, content);
          externalPostId = res.externalPostId;
        } catch (autoErr) {
          console.error('Auto-publish failed, falling back to PENDING_APPROVAL queue:', autoErr);
          initialStatus = 'PENDING_APPROVAL';
        }
      }

      const post = await prisma.post.create({
        data: {
          repositoryUrl: repo.remoteUrl,
          socialAccountId: account.id,
          commitSha: push.headSha,
          commitMessage: summaryTitle,
          matchedGroupName: targetGroupName,
          generatedContent: content,
          depthFilesAnalyzed: allTouchedFiles.length > 0 ? allTouchedFiles : depthContext,
          status: initialStatus,
          externalPostId,
          publishedAt: initialStatus === 'PUBLISHED' ? new Date() : null,
        },
      });

      generatedPosts.push(post);
    }

    return {
      success: true,
      mode: effectiveMode,
      targetGroup: targetGroupName,
      isAmbiguous,
      commitsCount: push.commits.length,
      postsCreated: generatedPosts.length,
      posts: generatedPosts,
    };
  }

  /**
   * Compatibility wrapper for single commit calls: wraps into a PushPayload and processes per-push.
   */
  static async handleIncomingCommit(commit: CommitPayload, userId: string) {
    return this.handleIncomingPush({
      headSha: commit.sha,
      remoteRepoUrl: commit.remoteRepoUrl,
      repoName: commit.repoName,
      author: commit.author,
      commits: [{
        sha: commit.sha,
        message: commit.message,
        author: commit.author,
        modifiedFiles: commit.diffSummary ? [commit.diffSummary] : [],
      }],
      repoLocalPath: commit.repoLocalPath,
    }, userId);
  }
}

import { prisma } from '../db/prisma.js';
import { OpenRouterService } from './openrouter.service.js';
import { SocialAuthService } from './socialAuth.service.js';

export interface CreateDumpInput {
  repoUrl: string;
  repoName: string;
  branch?: string;
  schedule: string; // e.g. "EVERY_6H", "EVERY_12H", "EVERY_24H", "WEEKLY"
  intervalHours?: number;
  targetMode?: 'GUIDED' | 'AUTO';
  targetAccount?: string; // "ALL" or specific socialAccountId
}

export class DumpService {
  private static schedulerTimer: NodeJS.Timeout | null = null;
  private static isProcessing = false;

  /**
   * Helper to parse schedule into hours
   */
  private static parseIntervalHours(schedule: string, customHours?: number): number {
    if (customHours && customHours > 0) return customHours;
    switch (schedule) {
      case 'EVERY_6H': return 6;
      case 'EVERY_12H': return 12;
      case 'EVERY_24H':
      case 'DAILY': return 24;
      case 'WEEKLY': return 168; // 7 * 24
      default: return 24;
    }
  }

  /**
   * List all configured DUMP managers for a user
   */
  static async listDumps(userId: string) {
    return prisma.dumpConfig.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Create a new DUMP manager for a repository
   */
  static async createDump(userId: string, input: CreateDumpInput) {
    const intervalHours = this.parseIntervalHours(input.schedule, input.intervalHours);

    // Ensure repo exists in repository table if possible
    try {
      const existingRepo = await prisma.repository.findUnique({
        where: { remoteUrl: input.repoUrl },
      });
      if (!existingRepo) {
        await prisma.repository.create({
          data: {
            remoteUrl: input.repoUrl,
            userId,
            name: input.repoName,
            defaultBranch: input.branch || 'main',
            defaultMode: input.targetMode || 'GUIDED',
          },
        });
      }
    } catch {
      // Repository table entry optional
    }

    const dump = await prisma.dumpConfig.create({
      data: {
        userId,
        repoUrl: input.repoUrl,
        repoName: input.repoName,
        branch: input.branch || 'main',
        schedule: input.schedule,
        intervalHours,
        targetMode: input.targetMode || 'GUIDED',
        targetAccount: input.targetAccount || 'ALL',
        isActive: true,
        lastDumpedAt: new Date(Date.now() - 24 * 3600 * 1000), // Default to 24h ago so immediate dump has context
      },
    });

    return dump;
  }

  /**
   * Update an existing DUMP manager
   */
  static async updateDump(dumpId: string, userId: string, data: Partial<CreateDumpInput & { isActive: boolean }>) {
    const dump = await prisma.dumpConfig.findFirst({
      where: { id: dumpId, userId },
    });

    if (!dump) {
      throw new Error('Dump configuration not found');
    }

    const intervalHours = data.schedule 
      ? this.parseIntervalHours(data.schedule, data.intervalHours)
      : data.intervalHours !== undefined ? data.intervalHours : dump.intervalHours;

    return prisma.dumpConfig.update({
      where: { id: dumpId },
      data: {
        ...(data.schedule ? { schedule: data.schedule } : {}),
        ...(intervalHours !== undefined ? { intervalHours } : {}),
        ...(data.targetMode ? { targetMode: data.targetMode } : {}),
        ...(data.targetAccount ? { targetAccount: data.targetAccount } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        ...(data.branch ? { branch: data.branch } : {}),
      },
    });
  }

  /**
   * Delete a DUMP manager
   */
  static async deleteDump(dumpId: string, userId: string) {
    const dump = await prisma.dumpConfig.findFirst({
      where: { id: dumpId, userId },
    });

    if (!dump) {
      throw new Error('Dump configuration not found');
    }

    return prisma.dumpConfig.delete({
      where: { id: dumpId },
    });
  }

  /**
   * Executes a periodic or manual DUMP for a given repository.
   * Collects all commits since the last dump, gathers the unified diff,
   * synthesizes an engineering update using OpenRouter, and queues or publishes it.
   */
  static async executeDump(dumpId: string, userId: string, options: { forceNow?: boolean } = {}) {
    const dump = await prisma.dumpConfig.findFirst({
      where: { id: dumpId, userId },
    });

    if (!dump) {
      throw new Error('Dump configuration not found');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        socialAccounts: true,
        socialGroups: {
          include: {
            members: {
              include: { socialAccount: true },
            },
          },
        },
      },
    });

    if (!user || !user.accessToken) {
      throw new Error('GitHub account not connected or missing access token');
    }

    if (!user.socialAccounts || user.socialAccounts.length === 0) {
      throw new Error('No LinkedIn account connected. Please connect your LinkedIn account to run dumps.');
    }

    // Determine target social accounts & group targeting
    let targetAccounts = user.socialAccounts;
    let matchedGroupName: string | null = null;

    if (dump.targetAccount && dump.targetAccount !== 'ALL') {
      if (dump.targetAccount.startsWith('GROUP:')) {
        const groupId = dump.targetAccount.replace('GROUP:', '');
        const group = user.socialGroups?.find(g => g.id === groupId || g.name === groupId);
        if (group) {
          matchedGroupName = group.name;
          const groupAccounts = group.members.map(m => m.socialAccount).filter(Boolean);
          if (groupAccounts.length > 0) {
            targetAccounts = groupAccounts as any[];
          } else {
            console.warn(`[Dump] Target group #${group.name} has no connected members. Falling back to all accounts.`);
          }
        }
      } else {
        targetAccounts = user.socialAccounts.filter(a => a.id === dump.targetAccount);
        if (targetAccounts.length === 0) targetAccounts = user.socialAccounts;
      }
    }

    // 1. Fetch commits made since the last dump
    const sinceTimestamp = dump.lastDumpedAt.toISOString();
    let commits: any[] = [];
    
    try {
      const commitsRes = await fetch(
        `https://api.github.com/repos/${dump.repoName}/commits?since=${sinceTimestamp}&sha=${dump.branch}&per_page=50`,
        {
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
            'User-Agent': 'Pigeon-App',
            Accept: 'application/vnd.github+json',
          },
          signal: AbortSignal.timeout(10000),
        }
      );

      if (commitsRes.ok) {
        commits = (await commitsRes.json()) as any[];
      }
    } catch (err: any) {
      console.warn(`[Dump] Failed to fetch commits for ${dump.repoName}:`, err.message);
    }

    // If forceNow is true and 0 commits were found since lastDumpedAt, grab recent commits so user can test/preview
    if (commits.length === 0 && options.forceNow) {
      try {
        const fallbackRes = await fetch(
          `https://api.github.com/repos/${dump.repoName}/commits?sha=${dump.branch}&per_page=5`,
          {
            headers: {
              Authorization: `Bearer ${user.accessToken}`,
              'User-Agent': 'Pigeon-App',
              Accept: 'application/vnd.github+json',
            },
            signal: AbortSignal.timeout(10000),
          }
        );
        if (fallbackRes.ok) {
          commits = (await fallbackRes.json()) as any[];
        }
      } catch (fbErr: any) {
        console.warn(`[Dump] Fallback commits fetch failed:`, fbErr.message);
      }
    }

    if (commits.length === 0) {
      // Nothing to dump in this window
      await prisma.dumpConfig.update({
        where: { id: dump.id },
        data: { lastDumpedAt: new Date() },
      });
      return {
        success: true,
        message: `No new commits detected in ${dump.repoName} since ${new Date(dump.lastDumpedAt).toLocaleTimeString()}. Window reset.`,
        commitsCount: 0,
        postsCreated: 0,
      };
    }

    // 2. Aggregate commits information
    const cleanCommits = commits.map(c => ({
      sha: c.sha,
      message: (c.commit?.message || '').replace(/#Pigeon\S*/g, '').trim(),
      author: c.commit?.author?.name || user.name || user.username,
    })).filter(c => c.message.length > 0);

    const headSha = cleanCommits[0]?.sha || commits[0]?.sha || 'latest-dump';
    const oldestSha = cleanCommits[cleanCommits.length - 1]?.sha || headSha;

    // 3. Fetch cumulative Git Diff across the dump window
    let cumulativeDiff = '';
    try {
      if (cleanCommits.length > 1 && oldestSha !== headSha) {
        const compareRes = await fetch(
          `https://api.github.com/repos/${dump.repoName}/compare/${oldestSha}...${headSha}`,
          {
            headers: {
              Authorization: `Bearer ${user.accessToken}`,
              'User-Agent': 'Pigeon-App',
              Accept: 'application/vnd.github.v3.diff',
            },
            signal: AbortSignal.timeout(12000),
          }
        );
        if (compareRes.ok) {
          cumulativeDiff = await compareRes.text();
        }
      } else {
        const diffRes = await fetch(
          `https://api.github.com/repos/${dump.repoName}/commits/${headSha}`,
          {
            headers: {
              Authorization: `Bearer ${user.accessToken}`,
              'User-Agent': 'Pigeon-App',
              Accept: 'application/vnd.github.v3.diff',
            },
            signal: AbortSignal.timeout(10000),
          }
        );
        if (diffRes.ok) {
          cumulativeDiff = await diffRes.text();
        }
      }
    } catch (diffErr: any) {
      console.warn('[Dump] Error fetching cumulative diff:', diffErr.message);
    }

    // 4. Synthesize cohesive Dump update using OpenRouter
    const dumpIntervalLabel = dump.intervalHours >= 168 
      ? 'Weekly' 
      : dump.intervalHours >= 24 
        ? 'Daily' 
        : `Every ${dump.intervalHours}h`;

    const summaryTitle = `Pigeon Dump: ${dump.repoName.split('/')[1] || dump.repoName} (${cleanCommits.length} commits across ${dumpIntervalLabel} window)`;

    const createdPosts = [];

    for (const account of targetAccounts) {
      // Check if already created for this commitSha and account
      const existingPost = await prisma.post.findFirst({
        where: {
          commitSha: headSha,
          socialAccountId: account.id,
        },
      });

      if (existingPost) {
        createdPosts.push(existingPost);
        continue;
      }

      const postContent = await OpenRouterService.generatePostFromDiff({
        platform: 'LINKEDIN',
        toneProfile: account.toneProfile || {},
        projectSummary: `Engineering periodic dump for repository ${dump.repoName}. Aggregates ${cleanCommits.length} commits in an automated cycle.`,
        commits: cleanCommits,
        allTouchedFiles: [],
        gitDiff: cumulativeDiff,
        matchedGroupName: matchedGroupName ? `DUMP-g${matchedGroupName}` : `DUMP-${dump.schedule}`,
        depthContext: ['Repository Dumps', dump.repoName],
      });

      let externalPostId: string | null = null;
      let postStatus: 'PUBLISHED' | 'PENDING_APPROVAL' = dump.targetMode === 'AUTO' ? 'PUBLISHED' : 'PENDING_APPROVAL';

      // If Auto mode, publish directly to LinkedIn
      if (dump.targetMode === 'AUTO' && account.accessTokenEnc) {
        try {
          console.log(`🚀 [DUMP Auto Mode] Publishing dump live to LinkedIn for ${account.name || account.handle}...`);
          const res = await SocialAuthService.publishLinkedInPost(account.accessTokenEnc, account.platformUserId, postContent);
          externalPostId = res.externalPostId;
        } catch (publishErr: any) {
          console.error('[DUMP Auto Mode] Direct publish failed, falling back to PENDING_APPROVAL:', publishErr.message || publishErr);
          postStatus = 'PENDING_APPROVAL';
        }
      }

      const post = await prisma.post.create({
        data: {
          repositoryUrl: dump.repoUrl,
          socialAccountId: account.id,
          commitSha: headSha,
          commitMessage: summaryTitle,
          matchedGroupName: matchedGroupName || `DUMP`,
          generatedContent: postContent,
          depthFilesAnalyzed: [`${cleanCommits.length} commits dumped`, dump.repoName],
          status: postStatus,
          externalPostId,
          publishedAt: postStatus === 'PUBLISHED' ? new Date() : null,
        },
      });

      createdPosts.push(post);
    }

    // 5. Update DumpConfig state
    await prisma.dumpConfig.update({
      where: { id: dump.id },
      data: {
        lastDumpedAt: new Date(),
        lastCommitSha: headSha,
        lastPostId: createdPosts[0]?.id || null,
      },
    });

    return {
      success: true,
      commitsCount: cleanCommits.length,
      postsCreated: createdPosts.length,
      posts: createdPosts,
      summaryTitle,
      mode: dump.targetMode,
    };
  }

  /**
   * Starts background timer to check for due scheduled dumps every 60 seconds
   */
  static startDumpScheduler() {
    if (this.schedulerTimer) return;
    console.log('🕊️ Pigeon DUMP Scheduler daemon started (checking periodic dump rules every 60s)');

    this.schedulerTimer = setInterval(async () => {
      if (this.isProcessing) return;
      this.isProcessing = true;

      try {
        const activeDumps = await prisma.dumpConfig.findMany({
          where: { isActive: true },
        });

        const now = Date.now();

        for (const dump of activeDumps) {
          const lastRun = new Date(dump.lastDumpedAt).getTime();
          const intervalMs = dump.intervalHours * 3600 * 1000;

          if (now - lastRun >= intervalMs) {
            console.log(`⏰ [DUMP Due] Running scheduled dump for ${dump.repoName} (interval: ${dump.intervalHours}h)...`);
            try {
              await this.executeDump(dump.id, dump.userId);
            } catch (runErr: any) {
              console.error(`❌ [DUMP Error] Failed scheduled dump for ${dump.repoName}:`, runErr.message || runErr);
            }
          }
        }
      } catch (err: any) {
        console.warn('DUMP scheduler check error:', err.message);
      } finally {
        this.isProcessing = false;
      }
    }, 60000);
  }
}

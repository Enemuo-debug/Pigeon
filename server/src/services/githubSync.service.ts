import { prisma } from '../db/prisma.js';
import { WebhookService, PushPayload, PushCommit } from './webhook.service.js';

export class GitHubSyncService {
  private static isSyncing = false;
  private static timer: NodeJS.Timeout | null = null;
  private static processedShas = new Set<string>();

  /**
   * Scans recently pushed repositories for any push batches tagged with #Pigeon.
   * Groups all commits in the push into ONE cohesive post per target account.
   */
  static async syncRecentPushes(userId: string) {
    if (this.isSyncing) return { syncing: true, message: 'Sync already in progress' };
    this.isSyncing = true;

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || !user.accessToken) {
        return { success: false, reason: 'No GitHub access token' };
      }

      // Fetch the 5 most recently active repositories
      let repos: any[] = [];
      try {
        const reposRes = await fetch('https://api.github.com/user/repos?sort=pushed&per_page=5&type=owner', {
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
            'User-Agent': 'Pigeon-App',
            Accept: 'application/vnd.github+json',
          },
          signal: AbortSignal.timeout(8000),
        });

        if (!reposRes.ok) {
          return { success: false, reason: `GitHub API error: ${reposRes.status}` };
        }

        repos = (await reposRes.json()) as any[];
      } catch (networkErr: any) {
        return { success: false, reason: `GitHub network timeout: ${networkErr.message}` };
      }

      const processedResults = [];

      for (const repo of repos) {
        try {
          // Fetch latest commits for this repo
          const commitsRes = await fetch(`https://api.github.com/repos/${repo.full_name}/commits?per_page=6`, {
            headers: {
              Authorization: `Bearer ${user.accessToken}`,
              'User-Agent': 'Pigeon-App',
              Accept: 'application/vnd.github+json',
            },
            signal: AbortSignal.timeout(8000),
          });

          if (!commitsRes.ok) continue;

          const commits = (await commitsRes.json()) as any[];
          const taggedCommitsInBatch: any[] = [];

          for (const c of commits) {
            const message = c.commit?.message || '';
            const tagInfo = WebhookService.parseCommitTag(message);

            if (!tagInfo.hasPigeonTag) continue;

            // Check if this commit SHA has already been processed into a post
            if (this.processedShas.has(c.sha)) {
              continue;
            }

            const existingPost = await prisma.post.findFirst({
              where: {
                OR: [
                  { commitSha: c.sha },
                  { commitMessage: { contains: c.sha.slice(0, 7) } },
                ],
              },
            });

            if (existingPost) {
              this.processedShas.add(c.sha);
              continue;
            }

            taggedCommitsInBatch.push(c);
          }

          if (taggedCommitsInBatch.length === 0) {
            continue;
          }

          console.log(`🕊️ [GitHub Auto-Sync] Detected ${taggedCommitsInBatch.length} new tagged commit(s) in push to ${repo.full_name}. Aggregating into 1 push summary...`);

          // Fetch commit diff file details for each commit
          const pushCommits: PushCommit[] = [];

          for (const c of taggedCommitsInBatch) {
            this.processedShas.add(c.sha);
            let modifiedFiles: string[] = [];

            try {
              const detailRes = await fetch(`https://api.github.com/repos/${repo.full_name}/commits/${c.sha}`, {
                headers: {
                  Authorization: `Bearer ${user.accessToken}`,
                  'User-Agent': 'Pigeon-App',
                  Accept: 'application/vnd.github+json',
                },
                signal: AbortSignal.timeout(6000),
              });
              if (detailRes.ok) {
                const detail: any = await detailRes.json();
                modifiedFiles = (detail.files || []).map((f: any) => f.filename);
              }
            } catch {
              // Diff summary optional
            }

            pushCommits.push({
              sha: c.sha,
              message: c.commit?.message || '',
              author: c.commit?.author?.name || user.name || user.username,
              modifiedFiles,
            });
          }

          const headSha = taggedCommitsInBatch[0].sha;
          const pushPayload: PushPayload = {
            headSha,
            remoteRepoUrl: repo.html_url,
            repoName: repo.full_name,
            author: user.name || user.username,
            commits: pushCommits,
          };

          const result = await WebhookService.handleIncomingPush(pushPayload, user.id);
          processedResults.push({
            repo: repo.full_name,
            headSha,
            commitsCount: pushCommits.length,
            result,
          });
        } catch (repoErr) {
          console.warn(`Error scanning repo ${repo.full_name}:`, repoErr);
        }
      }

      return { success: true, processedCount: processedResults.length, items: processedResults };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Starts a background poller every 15 seconds to automatically detect pushes locally
   */
  static startBackgroundPoller(intervalMs = 15000) {
    if (this.timer) return;
    console.log(`🕊️ GitHub Activity Sync daemon started (polling every ${intervalMs / 1000}s)`);

    this.timer = setInterval(async () => {
      try {
        const user = await prisma.user.findFirst();
        if (user && user.accessToken) {
          await this.syncRecentPushes(user.id);
        }
      } catch (err) {
        // Silent poller catch
      }
    }, intervalMs);
  }

  static stopBackgroundPoller() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

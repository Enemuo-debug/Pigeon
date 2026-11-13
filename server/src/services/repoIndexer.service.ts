import { prisma } from '../db/prisma.js';
import { GeminiService } from './gemini.service.js';

export class RepoIndexerService {
  /**
   * Cleans raw markdown to extract meaningful prose paragraphs
   */
  private static extractProseFromReadme(rawReadme: string): string {
    const lines = rawReadme.split('\n');
    const proseLines: string[] = [];
    let skippingCode = false;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (line.startsWith('```')) {
        skippingCode = !skippingCode;
        continue;
      }
      if (skippingCode) continue;
      // Skip badges, images, empty lines, HTML comments, tables
      if (!line || line.startsWith('[![') || line.startsWith('![') || line.startsWith('<!--') || line.startsWith('|')) {
        continue;
      }
      // Strip markdown header hashes or bullets for cleaner text
      const cleanLine = line.replace(/^#+\s*/, '').replace(/^[-*]\s*/, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim();
      if (cleanLine.length > 20 && !cleanLine.startsWith('<')) {
        proseLines.push(cleanLine);
      }
    }

    return proseLines.slice(0, 5).join(' ');
  }

  /**
   * Analyzes a repository via GitHub API and saves its architectural context to the DB
   */
  static async analyzeRepository(repoRemoteUrl: string, accessToken: string, userId?: string) {
    // Extract owner and repo from URL (e.g. "https://github.com/Enemuo-debug/Perpetua-Contracts")
    const match = repoRemoteUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) return null;
    const [, owner, repo] = match;
    const fullName = `${owner}/${repo}`;

    let defaultBranch = 'main';
    let repoDescription = '';
    let topics: string[] = [];

    // 1. Fetch Repository Metadata
    try {
      const repoRes = await fetch(`https://api.github.com/repos/${fullName}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'User-Agent': 'Pigeon-App',
          Accept: 'application/vnd.github+json',
        },
      });
      if (repoRes.ok) {
        const repoData: any = await repoRes.json();
        defaultBranch = repoData.default_branch || 'main';
        repoDescription = repoData.description || '';
        topics = repoData.topics || [];
      }
    } catch {
      // Fallback to default
    }

    let readmeContent = '';
    let archDocContent = '';
    let keyFiles: { path: string; summary: string }[] = [];
    let detectedTechStack: string[] = [];

    // 2. Fetch README.md
    try {
      const readmeRes = await fetch(`https://api.github.com/repos/${fullName}/readme`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'User-Agent': 'Pigeon-App',
          Accept: 'application/vnd.github.raw',
        },
      });
      if (readmeRes.ok) {
        readmeContent = await readmeRes.text();
      }
    } catch {
      // No readme
    }

    // 3. Fetch ARCHITECTURE.md if present
    try {
      const archRes = await fetch(`https://api.github.com/repos/${fullName}/contents/ARCHITECTURE.md`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'User-Agent': 'Pigeon-App',
          Accept: 'application/vnd.github.raw',
        },
      });
      if (archRes.ok) {
        archDocContent = await archRes.text();
      }
    } catch {
      // No architecture doc
    }

    // 4. Fetch full file tree using the repo's actual default branch
    let filePaths: string[] = [];
    try {
      const treeRes = await fetch(`https://api.github.com/repos/${fullName}/git/trees/${defaultBranch}?recursive=1`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'User-Agent': 'Pigeon-App',
        },
      });
      if (treeRes.ok) {
        const treeData: any = await treeRes.json();
        if (treeData.tree && Array.isArray(treeData.tree)) {
          filePaths = treeData.tree.map((t: any) => t.path);
        }
      }
    } catch {
      // Tree failed
    }

    // Identify key architectural and domain files
    const candidateFiles = filePaths.filter(p => 
      p.endsWith('.rs') ||
      p.endsWith('.sol') ||
      p.endsWith('.cs') ||
      p.endsWith('.ts') ||
      p.endsWith('.tsx') ||
      p.includes('contract') ||
      p.includes('controller') ||
      p.includes('service') ||
      p.includes('Cargo.toml') ||
      p.includes('package.json') ||
      p.includes('.csproj')
    ).slice(0, 10);

    keyFiles = candidateFiles.map(p => {
      const fileName = p.split('/').pop() || p;
      let summary = `Module: ${fileName}`;
      if (p.includes('contract') || p.endsWith('.rs')) summary = `Smart Contract: ${fileName}`;
      else if (p.includes('controller')) summary = `API Controller: ${fileName}`;
      else if (p.includes('service')) summary = `Domain Service: ${fileName}`;
      else if (p.includes('middleware')) summary = `System Middleware: ${fileName}`;
      else if (p.endsWith('package.json') || p.endsWith('Cargo.toml')) summary = `Dependency Manifest: ${fileName}`;
      return { path: p, summary };
    });

    // Detect tech stack accurately from file paths and names
    const stackSet = new Set<string>();
    if (filePaths.some(p => p.endsWith('.rs') || p.includes('Cargo.toml'))) {
      if (readmeContent.toLowerCase().includes('soroban') || repoDescription.toLowerCase().includes('soroban') || filePaths.some(p => p.includes('soroban'))) {
        stackSet.add('Rust / Soroban');
      } else {
        stackSet.add('Rust');
      }
    }
    if (filePaths.some(p => p.endsWith('.sol'))) stackSet.add('Solidity');
    if (filePaths.some(p => p.endsWith('.cs') || p.includes('.csproj'))) {
      if (readmeContent.toLowerCase().includes('unity') || filePaths.some(p => p.includes('Unity') || p.includes('Assets/'))) {
        stackSet.add('Unity / C#');
      } else {
        stackSet.add('C# / .NET');
      }
    }
    if (filePaths.some(p => p.includes('next.config') || p.includes('app/') || p.includes('pages/'))) {
      stackSet.add('Next.js');
    }
    if (filePaths.some(p => p.endsWith('.tsx') || p.includes('vite.config'))) {
      stackSet.add('React');
    }
    if (filePaths.some(p => p.endsWith('.ts') || p.includes('tsconfig.json'))) {
      stackSet.add('TypeScript');
    }
    if (filePaths.some(p => p.includes('stellar') || repoDescription.toLowerCase().includes('stellar') || readmeContent.toLowerCase().includes('stellar'))) {
      stackSet.add('Stellar SDK');
    }
    if (filePaths.some(p => p.includes('docker') || p.includes('Dockerfile') || p.includes('docker-compose'))) {
      stackSet.add('Docker');
    }
    if (filePaths.some(p => p.includes('tailwind.config'))) {
      stackSet.add('Tailwind CSS');
    }

    detectedTechStack = Array.from(stackSet);

    // 5. Construct Accurate Architectural Summary
    let projectSummary = '';
    const cleanReadmeProse = this.extractProseFromReadme(readmeContent);

    if (process.env.GEMINI_API_KEY) {
      try {
        const aiSummary = await GeminiService.summarizeCodebase({
          repoUrl: repoRemoteUrl,
          name: fullName,
          manifest: {
            filesCount: filePaths.length,
            sampleFiles: candidateFiles.slice(0, 5),
            readmeExcerpt: readmeContent.slice(0, 1000),
            archExcerpt: archDocContent.slice(0, 1000),
          },
          depthFiles: keyFiles,
          readmeText: readmeContent,
        });

        projectSummary = aiSummary.summary;
        if (aiSummary.techStack && aiSummary.techStack.length > 0) {
          detectedTechStack = Array.from(new Set([...detectedTechStack, ...aiSummary.techStack]));
        }
      } catch {
        // Fallback below
      }
    }

    // Grounded fallback based on real README, GitHub description, and file tree
    if (!projectSummary) {
      if (cleanReadmeProse) {
        projectSummary = cleanReadmeProse;
      } else if (repoDescription) {
        projectSummary = repoDescription;
        if (keyFiles.length > 0) {
          projectSummary += ` Engineered across key modules including ${keyFiles.slice(0, 3).map(f => f.path.split('/').pop()).join(', ')}.`;
        }
      } else if (keyFiles.length > 0) {
        projectSummary = `Architectural system engineered across ${filePaths.length} files. Core implementation includes ${keyFiles.slice(0, 4).map(f => f.path).join(', ')}.`;
      } else {
        projectSummary = `Developer repository with active continuous integration and modular architecture.`;
      }
    }

    // 6. Update or Create Database Record
    const pinnedContext = (repoDescription ? `${repoDescription}. ` : '') + projectSummary;

    // If userId not provided, look up existing repo's userId or fallback to first user
    let effectiveUserId = userId;
    if (!effectiveUserId) {
      const existing = await prisma.repository.findUnique({ where: { remoteUrl: repoRemoteUrl } });
      if (existing) {
        effectiveUserId = existing.userId;
      } else {
        const firstUser = await prisma.user.findFirst();
        effectiveUserId = firstUser?.id;
      }
    }

    if (!effectiveUserId) {
      throw new Error(`Cannot index repository ${fullName}: No user ID available`);
    }

    const updated = await prisma.repository.upsert({
      where: { remoteUrl: repoRemoteUrl },
      update: {
        name: fullName,
        defaultBranch,
        projectSummary,
        techStack: detectedTechStack,
        architecturalMap: keyFiles as any,
        depthNodes: candidateFiles.length || 5,
        pinnedContext: pinnedContext.slice(0, 300),
        lastSyncedAt: new Date(),
      },
      create: {
        remoteUrl: repoRemoteUrl,
        userId: effectiveUserId,
        name: fullName,
        defaultBranch,
        projectSummary,
        techStack: detectedTechStack,
        architecturalMap: keyFiles as any,
        depthNodes: candidateFiles.length || 5,
        pinnedContext: pinnedContext.slice(0, 300),
        defaultMode: 'GUIDED',
        tagKeyword: '#Pigeon',
        lastSyncedAt: new Date(),
      },
    });

    return updated;
  }

  /**
   * Scans and deep-indexes all repositories belonging to a user
   */
  static async indexAllUserRepositories(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { repositories: true },
    });

    if (!user || !user.accessToken) {
      throw new Error('User or GitHub access token not found');
    }

    const results = [];
    for (const repo of user.repositories) {
      try {
        const analyzed = await this.analyzeRepository(repo.remoteUrl, user.accessToken);
        if (analyzed) results.push(analyzed);
      } catch (err) {
        console.warn(`Failed to index ${repo.name}:`, err);
      }
    }

    return results;
  }
}

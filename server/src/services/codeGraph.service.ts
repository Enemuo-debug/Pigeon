import fs from 'fs';
import path from 'path';

export interface CodeGraphNode {
  path: string;
  depth: number;
  imports: string[];
  exports: string[];
  summary: string;
}

export class CodeGraphWalker {
  /**
   * Scans a repository up to maxDepth (3) starting from top 5 core files.
   */
  static async buildSkeleton(repoPath: string, maxDepth: number = 3): Promise<{
    manifest: any;
    keyFiles: CodeGraphNode[];
    techStack: string[];
  }> {
    const manifest = this.readManifest(repoPath);
    const candidateAnchors = this.findAnchorFiles(repoPath);
    const visited = new Set<string>();
    const nodes: CodeGraphNode[] = [];

    for (const anchor of candidateAnchors.slice(0, 5)) {
      this.walk(repoPath, anchor, 1, maxDepth, visited, nodes);
    }

    const techStack = this.detectTechStack(manifest, nodes);

    return {
      manifest,
      keyFiles: nodes,
      techStack,
    };
  }

  private static readManifest(repoPath: string): any {
    const pkgPath = path.join(repoPath, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        return JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      } catch {
        return {};
      }
    }
    return {};
  }

  private static findAnchorFiles(repoPath: string): string[] {
    const candidates = [
      'src/server.ts',
      'src/index.ts',
      'src/app.ts',
      'src/main.ts',
      'src/main.tsx',
      'src/App.tsx',
      'server.js',
      'index.js',
      'app.js',
      'main.py',
      'app.py',
    ];

    const found: string[] = [];
    for (const cand of candidates) {
      if (fs.existsSync(path.join(repoPath, cand))) {
        found.push(cand);
      }
    }

    // If still less than 5, check routes or core directory
    const srcDir = path.join(repoPath, 'src');
    if (fs.existsSync(srcDir)) {
      const files = fs.readdirSync(srcDir);
      for (const f of files) {
        if (found.length >= 5) break;
        const relative = path.join('src', f);
        if (f.endsWith('.ts') || f.endsWith('.js') || f.endsWith('.tsx')) {
          if (!found.includes(relative)) found.push(relative);
        }
      }
    }

    return found;
  }

  private static walk(
    repoPath: string,
    relativeFilePath: string,
    currentDepth: number,
    maxDepth: number,
    visited: Set<string>,
    nodes: CodeGraphNode[]
  ) {
    if (currentDepth > maxDepth || visited.has(relativeFilePath)) {
      return;
    }

    const fullPath = path.join(repoPath, relativeFilePath);
    if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
      return;
    }

    visited.add(relativeFilePath);
    const content = fs.readFileSync(fullPath, 'utf8');

    // Parse relative imports: e.g. import ... from './services/auth'
    const importRegex = /(?:import|from|require)\s*\(?['"](\.\/[^'"]+|\.\.\/[^'"]+)['"]/g;
    const localImports: string[] = [];
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      localImports.push(match[1]);
    }

    // Extract basic export hints
    const exportRegex = /export\s+(?:default\s+)?(?:const|class|function|interface|type)\s+([A-Za-z0-9_]+)/g;
    const exports: string[] = [];
    while ((match = exportRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }

    nodes.push({
      path: relativeFilePath,
      depth: currentDepth,
      imports: localImports,
      exports: exports.slice(0, 5),
      summary: `Defines: ${exports.slice(0, 3).join(', ') || 'Internal module'}`,
    });

    // Recursively walk local imports
    const currentDir = path.dirname(relativeFilePath);
    for (const imp of localImports) {
      const resolvedRelative = this.resolveImportPath(repoPath, currentDir, imp);
      if (resolvedRelative) {
        this.walk(repoPath, resolvedRelative, currentDepth + 1, maxDepth, visited, nodes);
      }
    }
  }

  private static resolveImportPath(repoPath: string, baseDir: string, importPath: string): string | null {
    const rawTarget = path.join(baseDir, importPath);
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.js'];

    if (fs.existsSync(path.join(repoPath, rawTarget)) && fs.statSync(path.join(repoPath, rawTarget)).isFile()) {
      return rawTarget;
    }

    for (const ext of extensions) {
      const candidate = rawTarget + ext;
      if (fs.existsSync(path.join(repoPath, candidate))) {
        return candidate;
      }
    }

    return null;
  }

  private static detectTechStack(manifest: any, nodes: CodeGraphNode[]): string[] {
    const stack = new Set<string>();
    const deps = { ...manifest?.dependencies, ...manifest?.devDependencies };

    for (const [dep] of Object.entries(deps)) {
      if (dep.includes('solana') || dep.includes('ethers') || dep.includes('viem') || dep.includes('wagmi')) stack.add('Web3/Crypto');
      if (dep.includes('react') || dep.includes('next')) stack.add('React');
      if (dep.includes('express') || dep.includes('fastify')) stack.add('Node/Express');
      if (dep.includes('prisma')) stack.add('Prisma ORM');
      if (dep.includes('tailwind')) stack.add('Tailwind CSS');
    }

    for (const node of nodes) {
      if (node.path.endsWith('.sol')) stack.add('Solidity');
      if (node.path.endsWith('.ts') || node.path.endsWith('.tsx')) stack.add('TypeScript');
      if (node.path.endsWith('.py')) stack.add('Python');
    }

    return Array.from(stack);
  }
}

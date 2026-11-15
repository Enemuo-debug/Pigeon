import { GeminiService } from './gemini.service.js';

export interface DiffPostGenerationInput {
  platform?: string;
  toneProfile?: any;
  projectSummary: string;
  commits: { sha: string; message: string; author?: string; modifiedFiles?: string[] }[];
  allTouchedFiles: string[];
  gitDiff?: string;
  matchedGroupName?: string;
  depthContext?: string[];
}

export class OpenRouterService {
  private static get apiKey(): string {
    return process.env.OPENROUTER_API_KEY || '';
  }

  private static get model(): string {
    return process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet';
  }

  static isOpenRouterConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  /**
   * Truncates large unified git diffs to the most impactful changes
   * to fit comfortably within prompt context windows.
   */
  private static sanitizeGitDiff(diff?: string, maxChars = 12000): string {
    if (!diff || !diff.trim()) return '';
    const clean = diff.trim();
    if (clean.length <= maxChars) return clean;

    // Preserve the first 8000 characters and the last 4000 characters with an indicator
    const head = clean.slice(0, 8000);
    const tail = clean.slice(-4000);
    return `${head}\n\n[... Remaining diff truncated for brevity ...]\n\n${tail}`;
  }

  /**
   * Generates an authentic, high-impact LinkedIn post powered by OpenRouter.
   * The post content is primarily driven by the ACTUAL GIT DIFF made in the code.
   */
  static async generatePostFromDiff(input: DiffPostGenerationInput): Promise<string> {
    const cleanCommits = input.commits
      .map(c => ({
        sha: c.sha ? c.sha.slice(0, 7) : 'commit',
        message: c.message.replace(/#Pigeon\S*/g, '').trim(),
      }))
      .filter(c => c.message.length > 0);

    const modules = Array.from(new Set(
      input.allTouchedFiles.map(f => {
        const parts = f.split('/');
        return parts.length > 1 ? parts.slice(0, 2).join('/') : parts[0];
      }).filter(Boolean)
    )).slice(0, 4);

    const modulesText = modules.length > 0 ? modules.join(', ') : 'core application stack';
    const processedDiff = this.sanitizeGitDiff(input.gitDiff);

    // If OpenRouter is not configured, fall back to our skills-grounded engine
    if (!this.isOpenRouterConfigured()) {
      console.warn('🕊️ [OpenRouter] OPENROUTER_API_KEY not configured. Falling back to skills-grounded engine.');
      return GeminiService.buildSkillsGroundedPost({
        platform: input.platform || 'LINKEDIN',
        toneProfile: input.toneProfile || {},
        projectSummary: input.projectSummary,
        commits: input.commits,
        allTouchedFiles: input.allTouchedFiles,
        matchedGroupName: input.matchedGroupName,
        depthContext: input.depthContext || input.allTouchedFiles,
      });
    }

    const systemPrompt = `
You are ghostwriting an authentic, high-retention LinkedIn post for a pragmatic software engineer and systems architect.

CORE PHILOSOPHY (from skill: social-media-context):
- "Code talks. Ship early, measure real usage, delete unneeded abstractions."
- Persona: Grounded, transparent, honest, slightly self-deprecating about bugs and over-engineering.
- Target Audience: Fellow engineers, tech leads, and founders who care about architecture, real trade-offs, and lessons learned. They hate corporate PR fluff and respect concrete metrics.

STRICT WRITING RULES (from skills: linkedin-writer & humanizer):
1. PRIMARY DRIVER: The post MUST be determined by the ACTUAL GIT DIFF provided. Analyze what code was added, removed, or refactored (e.g. database queries, state handling, error recovery, stripped bloat) rather than relying on commit titles.
2. HOOK UNDER 140 CHARACTERS: The opening 1-2 lines must be under 140 characters to fit before the mobile "...see more" cutoff. Start in media res with an error, a metric, or a hard realization.
3. YO-YO SENTENCE CADENCE (BURSTINESS): Alternate between punchy 3-to-5 word staccato sentences ("It was frustrating.", "Zero fluff.", "3 users tried it.") and clear 15-to-25 word narrative arcs.
4. CONVERSATIONAL CONTRACTIONS: MUST use "don't", "can't", "it's", "we've", "didn't", "wasn't". Never write stiff phrases like "do not" or "it is".
5. MOBILE WHITESPACE: Maximum 1 to 2 lines per paragraph. Use double newlines between paragraphs and numbered items so it is effortless to scan on mobile.
6. REAL PEER DISCUSSION QUESTION: End with a specific technical question inviting fellow developers to share their battle scars. NEVER write "Agree?", "Thoughts?", or "Let me know in the comments".
7. ZERO-TOLERANCE BLACKLIST:
   NEVER use: delve, tapestry, testament, spearhead, harness, leverage, paramount, pivotal, vital, crucial, beacon, game-changer, groundbreaking, ever-evolving, multifaceted, plethora, synergy, seamless, unprecedented, transformative, furthermore, moreover, elevate, foster, showcase, in conclusion.
   NEVER start with: "I'm thrilled to announce", "Excited to share", "Happy Monday".

STUDY THIS GOLDEN EXEMPLAR (Match this exact cadence, whitespace, and tone):
"""
We were accidentally running 4 nested SQL joins on every single feed load.

720 milliseconds of latency.
On a simple dashboard feed.

It was embarrassing.

Here's what was actually happening:
Our ORM looked clean in TypeScript. One neat include.
Behind the scenes, it was executing an N+1 query cascade that choked our database pool the second 50 people logged on.

So we've done the unglamorous work:

1. Stripped out the ORM helper for this endpoint.

2. Wrote a single parameterized CTE query hitting an index we should've added 3 months ago.

3. Added a pg_stat_statements alert in staging to catch slow queries before they hit main.

Result:
Feed latency dropped from 720ms down to 48ms.
Plus, we finally deleted moment.js while we were in there (saving 70kb of JS bloat).

Sometimes the best engineering is just deleting clever abstractions and letting PostgreSQL do what it was built to do.

What's a convenient ORM feature that ended up biting you in production?
"""
`.trim();

    const userPrompt = `
Here is the actual git commit push to analyze:

TOUCHED MODULES:
${modulesText}

COMMITS IN PUSH:
${cleanCommits.map((c, i) => `${i + 1}. [${c.sha}] ${c.message}`).join('\n')}

PROJECT ARCHITECTURE SUMMARY:
${input.projectSummary.slice(0, 300) || 'Full-stack software engineering project'}

${processedDiff ? `
THE ACTUAL GIT DIFF (Code changes that determine this post):
\`\`\`diff
${processedDiff}
\`\`\`
` : 'Note: Unified diff not available for this push; synthesize directly from commit semantics and touched modules.'}

Analyze what was ACTUALLY changed, added, removed, or refactored in the code diff above (e.g. state management, queries, API endpoints, error handling, deleted bloat). Write an authentic LinkedIn post reflecting this specific technical work.

Output ONLY the final LinkedIn post text with zero introductory commentary:
`.trim();

    try {
      console.log(`🕊️ [OpenRouter] Dispatching post synthesis to model: ${this.model}...`);
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://pigeon.zurus06.name.ng',
          'X-Title': 'Pigeon',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error (HTTP ${response.status}): ${errorText}`);
      }

      const data: any = await response.json();
      const rawOutput = data.choices?.[0]?.message?.content?.trim();

      if (!rawOutput) {
        throw new Error('OpenRouter returned an empty response');
      }

      // Apply De-AI Humanizer pass
      const humanized = GeminiService.humanizePost(rawOutput);
      const audit = GeminiService.auditPostQuality(humanized);

      console.log(`🕊️ [OpenRouter] Generated post verified! Humanizer Quality Score: ${audit.score}/100`);
      return humanized;
    } catch (err: any) {
      console.warn('🕊️ [OpenRouter] Error encountered during OpenRouter post generation:', err.message || err);
      console.log('🕊️ [OpenRouter] Executing skills-grounded fallback generator...');
      return GeminiService.buildSkillsGroundedPost({
        platform: input.platform || 'LINKEDIN',
        toneProfile: input.toneProfile || {},
        projectSummary: input.projectSummary,
        commits: input.commits,
        allTouchedFiles: input.allTouchedFiles,
        matchedGroupName: input.matchedGroupName,
        depthContext: input.depthContext || input.allTouchedFiles,
      });
    }
  }
}

import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export interface RepoAnalysisInput {
  repoUrl: string;
  name: string;
  manifest: any;
  depthFiles: { path: string; summary: string }[];
  readmeText?: string;
}

export interface ToneAnalysisInput {
  platform?: string;
  samplePosts: string[];
}

export interface PostGenerationInput {
  platform?: string;
  toneProfile: any;
  projectSummary: string;
  commitMessage: string;
  diffSummary: string;
  matchedGroupName?: string;
  depthContext: string[];
}

export interface PushCommitItem {
  sha: string;
  message: string;
  author?: string;
  modifiedFiles?: string[];
}

export interface PushSummaryGenerationInput {
  platform?: string;
  toneProfile: any;
  projectSummary: string;
  commits: PushCommitItem[];
  allTouchedFiles: string[];
  matchedGroupName?: string;
  depthContext: string[];
}

export class GeminiService {
  /**
   * Analyzes repo manifest and Depth-3 file tree to cache an accurate architectural summary.
   */
  static async summarizeCodebase(input: RepoAnalysisInput): Promise<{ summary: string; techStack: string[] }> {
    if (!genAI) {
      return {
        summary: `Architectural profile for ${input.name}.`,
        techStack: Object.keys(input.manifest?.dependencies || {}).slice(0, 5),
      };
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `
You are a senior software architect analyzing a repository for automated developer updates.
Repo: ${input.name} (${input.repoUrl})
Dependencies: ${JSON.stringify(input.manifest?.dependencies || {})}
Depth-3 Key Files Inspected:
${input.depthFiles.map(f => `- ${f.path}: ${f.summary}`).join('\n')}

README excerpt:
${input.readmeText?.slice(0, 1000) || 'None provided'}

Provide a 2-3 paragraph architectural summary:
1. What real-world problem does this system solve?
2. How is it architected across its entrypoint, services, and models?
3. Return JSON in this exact structure:
{
  "summary": "...",
  "techStack": ["...", "..."]
}
`;

    try {
      const response = await model.generateContent(prompt);
      const text = response.response.text();
      const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    } catch (err) {
      console.warn('Gemini summarization fallback:', err);
      return {
        summary: `Core architecture for ${input.name}.`,
        techStack: Object.keys(input.manifest?.dependencies || {}).slice(0, 5),
      };
    }
  }

  /**
   * Profiles the developer's writing style and voice for LinkedIn.
   */
  static async profileVoice(input: ToneAnalysisInput): Promise<any> {
    const samples = input.samplePosts.filter(Boolean);

    if (!genAI || samples.length === 0) {
      return {
        voice: 'Direct, pragmatic software builder',
        style: 'Technical clarity, natural engineering cadence, zero corporate buzzwords',
        emojiUsage: 'Minimal (1 relevant emoji max)',
        samplePosts: samples.length > 0 ? samples : [
          'Engineered modular API routers and decoupled background queue workers.',
          'Resolved database lock contention during high-concurrency event syncing.',
        ],
      };
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `
Analyze the developer's writing style based on these past posts and commit descriptions:
${samples.map((p, i) => `${i + 1}. "${p}"`).join('\n')}

Extract their authentic tone to ensure future LinkedIn posts sound genuinely like them and NOT like generic corporate AI:
1. Voice & Cadence (e.g., pragmatic builder, focused engineer, direct).
2. Structural habits (sentence length, spacing, technical clarity).
3. Extract 2-3 real sample sentences to use as reference exemplars.

Return JSON:
{
  "voice": "...",
  "style": "...",
  "emojiUsage": "Minimal",
  "samplePosts": ["...", "..."]
}
`;

    try {
      const response = await model.generateContent(prompt);
      const text = response.response.text();
      const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    } catch (err) {
      console.warn('Gemini tone extraction fallback:', err);
      return {
        voice: 'Direct, pragmatic software builder',
        style: 'Technical clarity, natural engineering cadence, zero corporate buzzwords',
        emojiUsage: 'Minimal (1 relevant emoji max)',
        samplePosts: samples.length > 0 ? samples : [
          'Engineered modular API routers and decoupled background queue workers.',
          'Resolved database lock contention during high-concurrency event syncing.',
        ],
      };
    }
  }

  /**
   * Synthesizes a git push into a unified, high-impact LinkedIn post.
   * Grounded in real commits, touched files, and architectural context.
   */
  static async generatePushSummaryPost(input: PushSummaryGenerationInput): Promise<string> {
    const cleanCommits = input.commits
      .map(c => ({
        sha: c.sha ? c.sha.slice(0, 7) : 'commit',
        message: c.message.replace(/#Pigeon\S*/g, '').trim(),
      }))
      .filter(c => c.message.length > 0);

    const primaryCommit = cleanCommits[cleanCommits.length - 1]?.message || cleanCommits[0]?.message || 'Code updates';

    // Extract notable file paths / module names touched
    const modulesTouched = Array.from(new Set(
      input.allTouchedFiles
        .map(f => {
          const parts = f.split('/');
          return parts.length > 1 ? parts.slice(0, 2).join('/') : parts[0];
        })
        .filter(Boolean)
    )).slice(0, 4);

    const modulesText = modulesTouched.length > 0 ? modulesTouched.join(', ') : '';

    const sampleExemplars = Array.isArray(input.toneProfile?.samplePosts) && input.toneProfile.samplePosts.length > 0
      ? input.toneProfile.samplePosts
      : [
          'Pushed latest updates to streamline state verification and avoid memory bloat during peak traffic.',
          'Refactored controllers to keep logic modular, lean, and decoupled.',
        ];

    const buildFallbackText = () => {
      const scopeDesc = modulesText ? ` across ${modulesText}` : '';
      if (cleanCommits.length > 1) {
        const bullets = cleanCommits.map(c => `• ${c.message}`).join('\n');
        return `Pushed ${cleanCommits.length} commits${scopeDesc}:\n\n${bullets}\n\nIterating and testing changes directly.`;
      }
      return `${primaryCommit}.\n\nUpdated implementation${scopeDesc}. Verified and ready.`;
    };

    if (!genAI) {
      return buildFallbackText();
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `
You are ghostwriting an authentic LinkedIn post for a software engineer's professional profile.
The developer just executed a git push containing ${cleanCommits.length} commit(s).

COMMITS IN THIS PUSH:
${cleanCommits.map((c, i) => `${i + 1}. [${c.sha}] ${c.message}`).join('\n')}

FILES & MODULES TOUCHED IN THIS PUSH:
${modulesText || 'Core application modules'}

PROJECT CONTEXT:
${input.projectSummary.slice(0, 300)}

THE DEVELOPER'S AUTHENTIC VOICE & EXEMPLARS:
Voice: ${input.toneProfile?.voice || 'Direct, pragmatic software builder'}
Style: ${input.toneProfile?.style || 'Concise, clear, no buzzwords'}
Real Exemplars From Developer:
${sampleExemplars.map((s: string) => `- "${s}"`).join('\n')}

STRICT RULES:
1. Summarize the collective work, architectural changes, and real progress across this ENTIRE push into a SINGLE cohesive LinkedIn post. Do NOT write separate posts for each commit.
2. Ground the update in the actual changes made across these commits and touched modules (${modulesText || 'system'}).
3. NEVER sound like corporate PR, marketing hype, or a generic AI bot.
4. ABSOLUTELY NO: "I am thrilled to announce", "Game-changer", "Revolutionary", "By optimizing across our dependency graph".
5. Sound like an authentic software engineer sharing real progress with peers and recruiters on LinkedIn.
6. Format: 2-3 short, clean paragraphs. Natural, technical, and reflective. Maximum 1 relevant emoji.
7. Strip any #Pigeon tags from the final text.

Output the post content directly with no intro or commentary:
`;

    try {
      const res = await model.generateContent(prompt);
      return res.response.text().trim();
    } catch (err) {
      console.warn('Gemini generate fallback:', err);
      return buildFallbackText();
    }
  }

  /**
   * Generates a social post matching the account's tone and the actual git diff.
   * Grounded in real developer tone without corporate PR fluff.
   */
  static async generatePost(input: PostGenerationInput): Promise<string> {
    return this.generatePushSummaryPost({
      platform: input.platform || 'LINKEDIN',
      toneProfile: input.toneProfile,
      projectSummary: input.projectSummary,
      commits: [{
        sha: 'latest',
        message: input.commitMessage,
        modifiedFiles: input.diffSummary ? [input.diffSummary] : [],
      }],
      allTouchedFiles: input.depthContext,
      matchedGroupName: input.matchedGroupName,
      depthContext: input.depthContext,
    });
  }
}

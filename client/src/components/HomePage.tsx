import React, { useState } from 'react';
import { PigeonLogo } from './PigeonTransition';
import { GlassLogosBackground } from './GlassLogosBackground';
import { GithubIcon, LinkedinIcon, XIcon } from './icons';
import { 
  GitBranch, 
  GitCommit, 
  Terminal, 
  Cpu, 
  Layers, 
  Radio, 
  ArrowRight, 
  CheckCircle2, 
  Copy, 
  Check, 
  Zap, 
  Shield, 
  Activity, 
  Sparkles, 
  Users, 
  Hash, 
  Code2, 
  Sliders, 
  ChevronDown
} from 'lucide-react';

interface HomePageProps {
  onGetStarted: () => void;
  onOpenDashboard?: () => void;
  isAuthenticated?: boolean;
}

// Build delimiter regex dynamically to prevent Tailwind class scanner from misidentifying regex syntax as arbitrary CSS
const DELIM_CHARS = ['-', ':', '_'].join('');
const PIGEON_TAG_PATTERN = new RegExp('#Pigeon\\b', 'i');
const GROUP_TAG_PATTERN = new RegExp('#Pigeon-g[' + DELIM_CHARS + ']?([A-Za-z0-9_-]+)', 'i');
const FAST_TAG_PATTERN = new RegExp('#Pigeon-fast\\b', 'i');
const PIGEON_STRIP_PATTERN = new RegExp('#Pigeon[A-Za-z0-9_-]*', 'gi');
const DELIM_TRIM_PATTERN = new RegExp('^[' + DELIM_CHARS + ']+|[' + DELIM_CHARS + ']+$', 'g');

export const HomePage: React.FC<HomePageProps> = ({
  onGetStarted,
  onOpenDashboard,
  isAuthenticated = false,
}) => {
  const [copiedTag, setCopiedTag] = useState<string | null>(null);

  // Simulator State
  const sampleCommits = [
    {
      title: 'Group Targeted',
      message: 'feat(db): add read-replica connection pooling #Pigeon-g-CoreTeam',
      description: 'Routes exclusively to the CoreTeam LinkedIn profiles.',
    },
    {
      title: 'Global Broadcast',
      message: 'feat(auth): implement OAuth2 PKCE security flow #Pigeon',
      description: 'Dispatches to all connected social media accounts.',
    },
    {
      title: 'High Velocity Auto',
      message: 'fix(cache): reduce Redis cache latency by 45% #Pigeon-fast',
      description: 'Forces instant publishing without awaiting manual review.',
    },
    {
      title: 'Unflagged (Ignored)',
      message: 'docs(readme): update API setup instructions',
      description: 'Safe by default: ignored completely by the syndication engine.',
    },
  ];

  const [simInput, setSimInput] = useState(sampleCommits[0].message);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTag(id);
    setTimeout(() => setCopiedTag(null), 2000);
  };

  // Simulator Parser Logic
  const parseSimulator = (msg: string) => {
    const hasPigeon = PIGEON_TAG_PATTERN.test(msg);
    const groupMatch = msg.match(GROUP_TAG_PATTERN);
    const hasFast = FAST_TAG_PATTERN.test(msg);

    if (!hasPigeon && !groupMatch && !hasFast) {
      return {
        tagged: false,
        mode: 'IGNORED',
        target: 'None',
        preview: 'This commit does not contain a #Pigeon tag. The webhook engine safely ignores it with zero social media activity.',
      };
    }

    const group = groupMatch ? groupMatch[1].replace(DELIM_TRIM_PATTERN, '') : null;
    const mode = hasFast ? 'AUTO' : 'USER_DEFAULT';

    let target = 'All Connected Accounts (Global Broadcast)';
    if (group) {
      target = `Social Group: "${group}" (Strictly Member Accounts)`;
    }

    const preview = `🚀 Engineering Update: ${msg.replace(PIGEON_STRIP_PATTERN, '').trim()}

Engine highlights:
• Analyzed AST diff & changed symbols across codebase
• Verified zero regressions and validated test coverage
• Deployed to production staging

#engineering #dev #software #architecture`;

    return {
      tagged: true,
      tag: group ? `#Pigeon-g-${group}` : hasFast ? '#Pigeon-fast' : '#Pigeon',
      group: group || 'None',
      mode,
      target,
      preview,
    };
  };

  const simResult = parseSimulator(simInput);

  // FAQ open/close state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How does Pigeon work when I push code to GitHub?',
      a: 'Pigeon connects to your GitHub repositories via secure webhooks. Whenever you push commits or merge pull requests, Pigeon inspects commit messages and changed file diffs. If the commit contains a #Pigeon tag, the engine synthesizes a technical social update with zero AI fluff and routes it according to your preferences.',
    },
    {
      q: 'What happens if I push 5 commits in a single git push?',
      a: 'Pigeon features Multi-Commit Push Aggregation. Instead of spamming your LinkedIn followers with 5 separate posts, Pigeon clusters all tagged commits in that push into a single coherent, well-structured engineering story.',
    },
    {
      q: 'What is the difference between Auto Mode and Guided Mode?',
      a: 'In Guided Mode, Pigeon creates a draft post in your dashboard where you can preview, edit, or adjust tone before publishing. In Auto Mode (Zero Human-in-the-Loop), Pigeon immediately publishes the post to your connected social channels upon receiving the GitHub webhook.',
    },
    {
      q: 'Can I route posts to specific LinkedIn accounts or team profiles?',
      a: 'Yes! Using Social Groups, you can cluster your connected accounts (e.g. CoreTeam, DevRel, Founders). Tagging a commit with #Pigeon-g-CoreTeam ensures that only the accounts assigned to that group receive the post.',
    },
    {
      q: 'Why does Pigeon guarantee zero AI buzzwords?',
      a: 'Developers hate cringe corporate fluff like "In today\'s fast-paced digital world" or "thrilled to announce". Pigeon uses a strict negative-prompt engine that enforces precise engineering terminology: changed functions, architectural impact, performance metrics, and clean code diff explanations.',
    },
    {
      q: 'Can I connect multiple LinkedIn accounts?',
      a: 'Yes! Pigeon supports multi-account LinkedIn OAuth2 with strict idempotency token verification, allowing you to connect personal profiles, team accounts, and company pages under one unified dashboard.',
    },
  ];

  return (
    <div className="relative min-h-screen bg-black text-white font-sans selection:bg-white/20 selection:text-white overflow-x-hidden">
      {/* Dynamic Polished Chrome Logos & Satellites Background */}
      <GlassLogosBackground />

      {/* Top Liquid Glass Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-8 py-4 backdrop-blur-md bg-black/40 border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <PigeonLogo withText={true} className="w-8 h-8" />
            <nav className="hidden md:flex items-center gap-6 text-xs font-mono text-zinc-400">
              <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
              <a href="#simulator" className="hover:text-white transition-colors">Tag Simulator</a>
              <a href="#modes" className="hover:text-white transition-colors">Auto vs Guided</a>
              <a href="#groups" className="hover:text-white transition-colors">Social Groups</a>
              <a href="#architecture" className="hover:text-white transition-colors">Architecture</a>
              <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full clean-glass-pill text-[11px] font-mono text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>v2.4 Engine Active</span>
            </div>

            {isAuthenticated ? (
              <button
                onClick={onOpenDashboard}
                className="flex items-center gap-2 px-4 py-2 rounded-full liquid-bw-btn text-xs font-medium cursor-pointer"
              >
                <span>Open Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={onGetStarted}
                className="flex items-center gap-2 px-4 py-2 rounded-full liquid-bw-btn text-xs font-medium cursor-pointer"
              >
                <span>Launch Console</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col items-center text-center">
          
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full clean-glass-pill mb-8 border border-white/[0.14] animate-float-gentle">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <span className="text-xs font-mono tracking-wider text-zinc-300 uppercase">
              Zero-Click Git Syndication Engine
            </span>
          </div>

          {/* Majestic Hero Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white max-w-4xl leading-[1.08] mb-6">
            Ship code.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-300 to-zinc-500">
              Pigeon broadcasts.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-10 font-normal">
            The git-native engine that turns commit messages and diffs into polished technical social announcements — auto-routed to LinkedIn and X with <span className="text-white font-medium">zero AI buzzwords</span>.
          </p>

          {/* Hero CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-16">
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full liquid-bw-btn text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-white/10 hover:shadow-white/20 transition-all"
            >
              <GithubIcon className="w-4 h-4" />
              <span>Connect GitHub & Start</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href="#simulator"
              className="w-full sm:w-auto px-6 py-3.5 rounded-full clean-glass-pill text-sm font-medium text-zinc-300 hover:text-white flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Try Tag Simulator</span>
              <Code2 className="w-4 h-4 text-zinc-400" />
            </a>
          </div>

          {/* 3D Concentric Orbiting Icons Visual Sculpture */}
          <div className="relative w-full max-w-3xl h-[460px] my-6 flex items-center justify-center perspective-1000 select-none">
            
            {/* Outer Orbit Ring (Slow Clockwise) */}
            <div className="absolute w-[440px] h-[440px] rounded-full border border-dashed border-white/[0.12] animate-orbit-slow preserve-3d">
              {/* Outer Satellite 1: GitHub */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 p-3 rounded-2xl clean-liquid-glass animate-counter-orbit-slow">
                <GithubIcon className="w-6 h-6 text-white" />
              </div>

              {/* Outer Satellite 2: Terminal */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 p-3 rounded-2xl clean-liquid-glass animate-counter-orbit-slow">
                <Terminal className="w-6 h-6 text-white" />
              </div>

              {/* Outer Satellite 3: Tag # */}
              <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 p-3 rounded-2xl clean-liquid-glass animate-counter-orbit-slow">
                <Hash className="w-6 h-6 text-white" />
              </div>

              {/* Outer Satellite 4: Layers */}
              <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 p-3 rounded-2xl clean-liquid-glass animate-counter-orbit-slow">
                <Layers className="w-6 h-6 text-white" />
              </div>
            </div>

            {/* Middle Orbit Ring (Medium Counter-Clockwise) */}
            <div className="absolute w-[300px] h-[300px] rounded-full border border-white/[0.14] animate-orbit-medium preserve-3d">
              {/* Middle Satellite 1: LinkedIn */}
              <div className="absolute top-1/4 left-0 -translate-x-1/2 -translate-y-1/2 p-2.5 rounded-xl clean-liquid-glass animate-counter-orbit-medium">
                <LinkedinIcon className="w-5 h-5 text-white" />
              </div>

              {/* Middle Satellite 2: X / Twitter */}
              <div className="absolute bottom-1/4 right-0 translate-x-1/2 translate-y-1/2 p-2.5 rounded-xl clean-liquid-glass animate-counter-orbit-medium">
                <XIcon className="w-5 h-5 text-white" />
              </div>

              {/* Middle Satellite 3: Git Branch */}
              <div className="absolute top-0 right-1/4 translate-x-1/2 -translate-y-1/2 p-2.5 rounded-xl clean-liquid-glass animate-counter-orbit-medium">
                <GitBranch className="w-5 h-5 text-white" />
              </div>
            </div>

            {/* Inner Orbit Ring (Fast Clockwise) */}
            <div className="absolute w-[180px] h-[180px] rounded-full border border-dotted border-white/[0.2] animate-orbit-fast preserve-3d">
              {/* Inner Satellite 1: Git Commit */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 p-2 rounded-lg clean-glass-pill animate-counter-orbit-fast">
                <GitCommit className="w-4 h-4 text-white" />
              </div>

              {/* Inner Satellite 2: CPU AST */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 p-2 rounded-lg clean-glass-pill animate-counter-orbit-fast">
                <Cpu className="w-4 h-4 text-white" />
              </div>
            </div>

            {/* Center Core: Frosted Liquid Glass Pigeon Emblem */}
            <div className="relative z-20 w-24 h-24 rounded-3xl clean-liquid-glass flex items-center justify-center p-5 shadow-[0_0_50px_rgba(255,255,255,0.15)] group hover:scale-105 transition-transform duration-500">
              <PigeonLogo className="w-12 h-12" />
            </div>

            {/* Floating Telemetry Badges in 3D Space */}
            <div className="absolute top-4 left-6 hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl clean-glass-pill text-[11px] font-mono text-zinc-300 animate-float-gentle">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Auto Mode: Zero Human-in-Loop</span>
            </div>

            <div className="absolute top-8 right-6 hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl clean-glass-pill text-[11px] font-mono text-zinc-300 animate-float-reverse">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span>#Pigeon-g-CoreTeam: Precision Routed</span>
            </div>

            <div className="absolute bottom-6 left-10 hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl clean-glass-pill text-[11px] font-mono text-zinc-300 animate-float-reverse">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>Multi-Commit Aggregation: 4 → 1</span>
            </div>

            <div className="absolute bottom-10 right-8 hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl clean-glass-pill text-[11px] font-mono text-zinc-300 animate-float-gentle">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Strict Negative-Prompt Tone Filter</span>
            </div>
          </div>
        </div>

        {/* SECTION: How It Works */}
        <section id="how-it-works" className="pt-24 pb-16">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-2">Step-by-step Workflow</h2>
            <h3 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
              How developers use Pigeon
            </h3>
            <p className="text-zinc-400 text-sm sm:text-base">
              A frictionless lifecycle built directly around your existing <code className="text-zinc-200">git</code> workflow. No dashboards to open unless you want to.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="clean-liquid-glass p-8 rounded-3xl flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-2xl clean-glass-pill flex items-center justify-center font-mono text-sm font-semibold text-white mb-6">
                  01
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">Connect Your Accounts</h4>
                <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                  Authorize GitHub and link your LinkedIn and X profiles. Pigeon supports multiple accounts per user, ideal for agency leads, tech founders, and core maintainers.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] font-mono text-xs text-zinc-400 flex items-center justify-between">
                <span>OAuth2 Idempotent Tokens</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
            </div>

            {/* Step 2 */}
            <div className="clean-liquid-glass p-8 rounded-3xl flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-2xl clean-glass-pill flex items-center justify-center font-mono text-sm font-semibold text-white mb-6">
                  02
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">Commit with #Pigeon Tag</h4>
                <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                  Write regular commit messages and add the tag. Route to specific groups using <code className="text-zinc-200">#Pigeon-g-&lt;Group&gt;</code> or global broadcast with <code className="text-zinc-200">#Pigeon</code>.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] font-mono text-xs text-zinc-300 flex items-center justify-between">
                <code>git commit -m "... #Pigeon"</code>
                <GitCommit className="w-4 h-4 text-white" />
              </div>
            </div>

            {/* Step 3 */}
            <div className="clean-liquid-glass p-8 rounded-3xl flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-2xl clean-glass-pill flex items-center justify-center font-mono text-sm font-semibold text-white mb-6">
                  03
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">Automated Syndication</h4>
                <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                  In <strong>Guided Mode</strong>, a polished draft awaits your review. In <strong>Auto Mode</strong>, the webhook publishes directly to LinkedIn immediately with zero intervention.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] font-mono text-xs text-emerald-400 flex items-center justify-between">
                <span>Webhook Dispatched (0ms wait)</span>
                <Zap className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: Interactive Tag Simulator */}
        <section id="simulator" className="pt-16 pb-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-2">Interactive Playground</h2>
            <h3 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
              Commit Tag Engine Simulator
            </h3>
            <p className="text-zinc-400 text-sm sm:text-base">
              Test how Pigeon parses git messages, identifies groups, and transforms commits into broadcast-ready posts.
            </p>
          </div>

          <div className="clean-liquid-glass p-6 sm:p-10 rounded-3xl max-w-4xl mx-auto">
            {/* Quick Sample Presets */}
            <div className="mb-6">
              <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-3">
                Try Sample Commit Messages:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {sampleCommits.map((sample, i) => (
                  <button
                    key={i}
                    onClick={() => setSimInput(sample.message)}
                    className={`text-left p-3 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
                      simInput === sample.message
                        ? 'bg-white/[0.08] border-white/40 text-white'
                        : 'bg-black/30 border-white/[0.08] text-zinc-400 hover:border-white/20 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold mb-1">
                      <span>{sample.title}</span>
                      {simInput === sample.message && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                    <div className="text-[11px] truncate opacity-75">{sample.message}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Input Box */}
            <div className="mb-6">
              <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-2">
                Commit Message Input:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={simInput}
                  onChange={(e) => setSimInput(e.target.value)}
                  placeholder="e.g. feat(auth): implement session rotation #Pigeon"
                  className="w-full px-4 py-3.5 rounded-2xl clean-glass-input font-mono text-xs sm:text-sm text-white focus:ring-1 focus:ring-white/40"
                />
              </div>
            </div>

            {/* Live Telemetry Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 font-mono text-xs">
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.08]">
                <div className="text-zinc-500 text-[10px] uppercase">Detected Syntax</div>
                <div className="text-white font-semibold mt-1">
                  {simResult.tagged ? (
                    <span className="text-emerald-400 font-bold">{simResult.tag}</span>
                  ) : (
                    <span className="text-zinc-500">None (Pass-through)</span>
                  )}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.08]">
                <div className="text-zinc-500 text-[10px] uppercase">Routing Target</div>
                <div className="text-white font-medium mt-1 truncate">
                  {simResult.target}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.08]">
                <div className="text-zinc-500 text-[10px] uppercase">Execution Mode</div>
                <div className="text-white font-semibold mt-1 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${simResult.tagged ? 'bg-emerald-400' : 'bg-zinc-600'}`}></span>
                  <span>{simResult.mode}</span>
                </div>
              </div>
            </div>

            {/* Simulated Generated Output Preview */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                  Synthesized LinkedIn Post Preview:
                </label>
                {simResult.tagged && (
                  <button
                    onClick={() => handleCopy(simResult.preview, 'sim')}
                    className="flex items-center gap-1 text-[11px] font-mono text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {copiedTag === 'sim' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedTag === 'sim' ? 'Copied' : 'Copy'}</span>
                  </button>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-black/60 border border-white/[0.1] font-sans text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed relative">
                {simResult.preview}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: Auto vs Guided Engine Modes */}
        <section id="modes" className="pt-16 pb-20">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-2">Execution Velocity</h2>
            <h3 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
              Two Engine Modes. Complete Control.
            </h3>
            <p className="text-zinc-400 text-sm sm:text-base">
              Whether you want meticulous human editorial oversight or full hands-free automation, Pigeon adapts to your shipping cadence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Guided Mode */}
            <div className="clean-liquid-glass p-8 rounded-3xl border border-white/[0.14] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl clean-glass-pill">
                      <Sliders className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white">Guided Mode</h4>
                      <span className="text-xs font-mono text-zinc-400">Human-in-the-Loop</span>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full clean-glass-pill text-xs font-mono text-zinc-300">
                    Default
                  </span>
                </div>

                <p className="text-zinc-300 text-sm leading-relaxed mb-6">
                  Perfect for public changelogs and strategic release announcements. Each tagged commit or PR generates a rich draft with diff context. You inspect, tweak markdown, and hit publish when ready.
                </p>

                <ul className="space-y-3 font-mono text-xs text-zinc-400 mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Realtime live draft generation in web dashboard</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>One-click tone regeneration and diff preview</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Customizable scheduled delivery window</span>
                  </li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.08] text-xs font-mono text-zinc-400">
                Commit: <code>git commit -m "feat: overhaul #Pigeon"</code>
              </div>
            </div>

            {/* Auto Mode */}
            <div className="clean-liquid-glass p-8 rounded-3xl border border-white/[0.2] relative overflow-hidden flex flex-col justify-between shadow-[0_0_40px_rgba(255,255,255,0.05)]">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl clean-glass-pill">
                      <Zap className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white">Auto Mode</h4>
                      <span className="text-xs font-mono text-emerald-400">Zero Human-in-the-Loop</span>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full clean-glass-pill text-xs font-mono text-emerald-300 border border-emerald-500/30">
                    Autonomous
                  </span>
                </div>

                <p className="text-zinc-300 text-sm leading-relaxed mb-6">
                  Zero manual clicks. The moment GitHub sends the push webhook, Pigeon verifies the cryptographic HMAC signature, analyzes the AST diff, synthesizes the post, and immediately broadcasts to LinkedIn.
                </p>

                <ul className="space-y-3 font-mono text-xs text-zinc-400 mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>0ms publish latency — dispatches on git push</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Social Groups precision routing enforced</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Immediate live LinkedIn post ID & broadcast tracking</span>
                  </li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.08] text-xs font-mono text-emerald-400">
                Toggle in 1 click in Dashboard or via <code>#Pigeon-fast</code>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: Social Groups */}
        <section id="groups" className="pt-16 pb-20">
          <div className="clean-liquid-glass p-8 sm:p-12 rounded-3xl max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
              <div>
                <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-2">Precision Targeting</h2>
                <h3 className="text-2xl sm:text-3xl font-bold text-white">
                  Social Groups Precision Routing
                </h3>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full clean-glass-pill text-xs font-mono text-zinc-300">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                <span>Multi-Account Routing</span>
              </div>
            </div>

            <p className="text-zinc-300 text-sm sm:text-base leading-relaxed mb-8">
              Pigeon solves the multi-account broadcast dilemma. Assign your connected LinkedIn and X accounts to named groups (e.g. <code>CoreTeam</code>, <code>DevRel</code>, <code>Founders</code>). Specify the target group directly in your git commit message to broadcast only where it matters.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 font-mono text-xs">
              <div className="p-4 rounded-2xl bg-black/50 border border-white/[0.08]">
                <div className="text-zinc-400 mb-2">Group Routing Syntax:</div>
                <code className="text-white block bg-black/70 p-2.5 rounded-xl border border-white/[0.06]">
                  git commit -m "fix(cache): patch leak #Pigeon-g-CoreTeam"
                </code>
                <p className="text-zinc-500 text-[11px] mt-2">
                  Routes only to members assigned to group "CoreTeam".
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-black/50 border border-white/[0.08]">
                <div className="text-zinc-400 mb-2">Flexible Tag Normalization:</div>
                <ul className="text-zinc-300 space-y-1 text-[11px]">
                  <li>• <code className="text-white">#Pigeon-g-CoreTeam</code></li>
                  <li>• <code className="text-white">#Pigeon-g:CoreTeam</code></li>
                  <li>• <code className="text-white">#Pigeon-gCoreTeam</code></li>
                  <li>• <code className="text-white">#Pigeon-g_CoreTeam</code></li>
                </ul>
                <p className="text-zinc-500 text-[11px] mt-2">
                  Case-insensitive, dash-tolerant parser ensures zero missed dispatches.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: Architecture & Security Highlights */}
        <section id="architecture" className="pt-16 pb-20">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-2">Under the Hood</h2>
            <h3 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
              Built for Engineering Rigor
            </h3>
            <p className="text-zinc-400 text-sm sm:text-base">
              A robust, deterministic platform designed with enterprise-grade git integration and bulletproof OAuth handling.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="clean-liquid-glass p-6 rounded-3xl">
              <div className="p-2.5 rounded-xl clean-glass-pill w-fit mb-4">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <h4 className="text-base font-semibold text-white mb-2">HMAC-SHA256 Webhooks</h4>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Every webhook from GitHub is cryptographically verified against your shared secret before processing. Zero spoofing risk.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="clean-liquid-glass p-6 rounded-3xl">
              <div className="p-2.5 rounded-xl clean-glass-pill w-fit mb-4">
                <Cpu className="w-5 h-5 text-white" />
              </div>
              <h4 className="text-base font-semibold text-white mb-2">Dual-Engine Synthesis</h4>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Powered by Gemini 1.5 Flash with deterministic AST heuristic fallbacks. Never leaves you hanging if an API goes down.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="clean-liquid-glass p-6 rounded-3xl">
              <div className="p-2.5 rounded-xl clean-glass-pill w-fit mb-4">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <h4 className="text-base font-semibold text-white mb-2">Multi-Commit Aggregation</h4>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Detects bulk pushes and synthesizes 1 unified technical update across multiple commits rather than spamming your feed.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="clean-liquid-glass p-6 rounded-3xl">
              <div className="p-2.5 rounded-xl clean-glass-pill w-fit mb-4">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <h4 className="text-base font-semibold text-white mb-2">Idempotency Guarantees</h4>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Guaranteed once-and-only-once publishing per commit hash using SHA256 digest locking and database constraints.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="clean-liquid-glass p-6 rounded-3xl">
              <div className="p-2.5 rounded-xl clean-glass-pill w-fit mb-4">
                <Radio className="w-5 h-5 text-white" />
              </div>
              <h4 className="text-base font-semibold text-white mb-2">LAN & Cloud Ready</h4>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Binds dynamically to <code className="text-zinc-200">0.0.0.0</code> with reflective CORS. Works out of the box across local Wi-Fi and production cloud.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="clean-liquid-glass p-6 rounded-3xl">
              <div className="p-2.5 rounded-xl clean-glass-pill w-fit mb-4">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h4 className="text-base font-semibold text-white mb-2">Zero AI Buzzwords</h4>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Enforced negative prompting eliminates "game changer", "thrilled to announce", and corporate fluff in favor of genuine code value.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION: FAQ */}
        <section id="faq" className="pt-16 pb-24">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-2">Answers & Clarifications</h2>
            <h3 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
              Frequently Asked Questions
            </h3>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="clean-liquid-glass rounded-2xl overflow-hidden transition-all duration-300"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left text-sm sm:text-base font-medium text-white hover:text-zinc-200 cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-zinc-400 transition-transform duration-300 shrink-0 ml-4 ${
                        isOpen ? 'rotate-180 text-white' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-zinc-400 leading-relaxed border-t border-white/[0.04]">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Bottom Call to Action Card */}
        <section className="pb-24">
          <div className="clean-liquid-glass p-10 sm:p-14 rounded-3xl text-center max-w-4xl mx-auto relative overflow-hidden">
            <div className="relative z-10">
              <PigeonLogo className="w-10 h-10 mx-auto mb-6" />
              <h3 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Ready to automate your social devlog?
              </h3>
              <p className="text-zinc-400 text-sm sm:text-base max-w-xl mx-auto mb-8">
                Connect your GitHub repo, pick your preferred mode, and let Pigeon handle the engineering storytelling.
              </p>

              <button
                onClick={onGetStarted}
                className="px-8 py-3.5 rounded-full liquid-bw-btn text-sm font-semibold inline-flex items-center gap-2 cursor-pointer shadow-xl shadow-white/10 hover:shadow-white/20 transition-all"
              >
                <GithubIcon className="w-4 h-4" />
                <span>Launch Pigeon Console</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.08] py-10 px-4 sm:px-8 bg-black/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs font-mono text-zinc-500">
          <div className="flex items-center gap-3">
            <PigeonLogo withText={true} className="w-6 h-6" />
            <span>— Developer Syndication Engine</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#how-it-works" className="hover:text-zinc-300 transition-colors">How It Works</a>
            <a href="#simulator" className="hover:text-zinc-300 transition-colors">Simulator</a>
            <a href="#modes" className="hover:text-zinc-300 transition-colors">Modes</a>
            <a href="#architecture" className="hover:text-zinc-300 transition-colors">Architecture</a>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-zinc-400">All Systems Operational</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  ArrowRight, 
  Github, 
  Terminal, 
  Layers, 
  Cpu, 
  Zap, 
  CheckCircle2, 
  Play, 
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Radio,
  FileCode,
  Sparkles
} from 'lucide-react';
import { OrbitingLogosBackground } from './OrbitingLogosBackground';
import { GithubIcon, LinkedinIcon, XIcon } from './icons';
import { API_BASE } from '../config/api';

interface HomeProps {
  onGetStarted: () => void;
}

export const Home: React.FC<HomeProps> = ({ onGetStarted }) => {
  // Interactive Simulator on Homepage
  const [testCommitMsg, setTestCommitMsg] = useState('feat(zk): implement recursive zero-knowledge rollup proofs #Pigeon-g-CoreTeam');
  const [simResult, setSimResult] = useState<{
    group: string;
    targetAccountsDesc?: string;
    x: string;
    li: string;
  } | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const runHomepageSimulation = async () => {
    if (!testCommitMsg.trim()) return;
    setIsSimulating(true);

    try {
      const res = await fetch(`${API_BASE}/api/simulator/commit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commitMessage: testCommitMsg }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSimResult({
          group: data.group,
          targetAccountsDesc: data.targetAccountsDesc,
          x: data.x,
          li: data.li,
        });
      }
    } catch {
      // Fallback local simulation if server offline
      const hasGroup = testCommitMsg.includes('#Pigeon-g');
      const groupMatch = testCommitMsg.match(/#Pigeon-g[-:_]?([A-Za-z0-9_-]+)/i);
      setSimResult({
        group: groupMatch ? groupMatch[1] : (hasGroup ? 'Unspecified (Fallback)' : 'Broadcast (All Channels)'),
        targetAccountsDesc: groupMatch 
          ? `Strictly limited to accounts assigned to #${groupMatch[1]}` 
          : 'Broadcasts across all connected channels',
        x: 'Shipped: feat(zk): implement recursive zero-knowledge rollup proofs ⚡ #buildinpublic',
        li: 'feat(zk): implement recursive zero-knowledge rollup proofs.\n\nWorked through core logic to keep our implementation lean, reliable, and decoupled.\n\nBuilding in public with #Pigeon 🕊️',
      });
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-black text-white font-sans overflow-x-hidden selection:bg-white selection:text-black">
      {/* Dynamic Circling & Orbiting Canvas Background */}
      <OrbitingLogosBackground />

      {/* Floating Glass Navigation Bar */}
      <header className="fixed top-5 inset-x-0 z-50 flex justify-center px-4">
        <nav className="w-full max-w-5xl clean-liquid-glass rounded-full px-5 py-3 border border-white/15 backdrop-blur-xl flex items-center justify-between shadow-[0_10px_35px_rgba(0,0,0,0.8)]">
          {/* Logo & Name */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center font-bold text-xs shadow-md">
              🕊️
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-tight text-white">Pigeon</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.08] text-zinc-300 border border-white/10">
                v2.0
              </span>
            </div>
          </div>

          {/* Center Navigation Links */}
          <div className="hidden md:flex items-center gap-7 text-xs font-medium text-zinc-400">
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#directives" className="hover:text-white transition-colors">Tag Directives</a>
            <a href="#engine-modes" className="hover:text-white transition-colors">Auto Mode</a>
            <a href="#interactive-simulator" className="hover:text-white transition-colors">Live Simulator</a>
          </div>

          {/* Right Action Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={onGetStarted}
              className="px-4 py-2 rounded-full liquid-bw-btn text-xs font-semibold cursor-pointer flex items-center gap-2"
            >
              <span>Launch App</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </nav>
      </header>

      {/* HERO SECTION */}
      <section className="relative z-10 pt-36 pb-20 px-6 max-w-6xl mx-auto flex flex-col items-center text-center">
        {/* Micro Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full clean-glass-pill text-[11px] font-mono text-zinc-300 border border-white/15 mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Zero Context Switching • Multi-Commit Push Ingestion</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-light tracking-tight text-white max-w-4xl leading-[1.1] mb-6">
          Commit to your socials <span className="font-serif italic font-normal text-zinc-300">effortlessly.</span>
        </h1>

        {/* Hero Subtitle */}
        <p className="text-base sm:text-lg text-zinc-300 font-light max-w-2xl leading-relaxed mb-10">
          Turn your git commits and pushes into authentic, high-impact developer updates on <strong className="text-white font-medium">LinkedIn</strong> and <strong className="text-white font-medium">X</strong>—with precision group routing and zero AI marketing fluff.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-16">
          <button
            onClick={onGetStarted}
            className="w-full sm:w-auto px-8 py-3.5 rounded-full liquid-bw-btn text-xs font-semibold cursor-pointer flex items-center justify-center gap-2.5 shadow-[0_0_30px_rgba(255,255,255,0.25)] hover:scale-105 transition-all"
          >
            <Github className="w-4 h-4" />
            <span>Connect GitHub Free</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <a
            href="#interactive-simulator"
            className="w-full sm:w-auto px-7 py-3.5 rounded-full clean-glass-pill hover:bg-white/[0.08] text-xs font-medium text-zinc-300 hover:text-white border border-white/15 transition-all flex items-center justify-center gap-2"
          >
            <Terminal className="w-3.5 h-3.5 text-zinc-400" />
            <span>Test Tag Routing Simulator</span>
          </a>
        </div>

        {/* Live Terminal & Routing Visualization Card */}
        <div className="w-full max-w-3xl clean-liquid-glass p-6 sm:p-8 rounded-[32px] border border-white/20 text-left space-y-5 shadow-[0_20px_50px_rgba(0,0,0,0.9)]">
          {/* Terminal Window Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-white/20"></span>
              <span className="w-3 h-3 rounded-full bg-white/20"></span>
              <span className="w-3 h-3 rounded-full bg-white/20"></span>
              <span className="text-xs font-mono text-zinc-400 ml-2">git-workflow.sh</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              Live Pipeline Active
            </span>
          </div>

          {/* Terminal Code Snippet */}
          <div className="font-mono text-xs space-y-2 text-zinc-300 leading-relaxed bg-black/60 p-4 rounded-2xl border border-white/[0.06]">
            <p className="text-zinc-500"># 1. Stage changes and commit with tag</p>
            <p className="text-white">
              <span className="text-zinc-500">$ </span>git commit -m <span className="text-emerald-300">"feat(auth): add ed25519 signature checks <span className="bg-white text-black px-1.5 py-0.5 rounded font-bold">#Pigeon-g-CoreTeam</span>"</span>
            </p>
            <p className="text-zinc-500 pt-1"># 2. Push to remote — Pigeon handles the rest</p>
            <p className="text-white">
              <span className="text-zinc-500">$ </span>git push origin main
            </p>
          </div>

          {/* Pipeline Result Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400">
                <Terminal className="w-3 h-3 text-white" />
                <span>Tag Detected</span>
              </div>
              <p className="text-xs font-semibold text-white font-mono">#Pigeon-g-CoreTeam</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400">
                <Layers className="w-3 h-3 text-emerald-400" />
                <span>Targeted Group</span>
              </div>
              <p className="text-xs font-semibold text-emerald-300 font-mono">#CoreTeam (2 Accounts)</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400">
                <Radio className="w-3 h-3 text-white" />
                <span>Auto Mode</span>
              </div>
              <p className="text-xs font-semibold text-white font-mono">Direct API Dispatch</p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS IN 3 STEPS */}
      <section id="how-it-works" className="relative z-10 py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center space-y-3 mb-16">
          <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-400">Workflow Walkthrough</span>
          <h2 className="text-3xl sm:text-5xl font-light tracking-tight text-white">How Pigeon Works in 3 Steps</h2>
          <p className="text-xs sm:text-sm text-zinc-400 font-light max-w-lg mx-auto">
            From git commit to published social updates with zero friction and full control over your audience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="p-8 rounded-[32px] clean-liquid-glass space-y-5 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center font-bold font-mono text-sm shadow-md">
                01
              </div>
              <h3 className="text-lg font-semibold text-white">Connect & Group</h3>
              <p className="text-xs text-zinc-300 font-light leading-relaxed">
                Sign in with GitHub and link your LinkedIn or X profiles. Cluster your accounts into custom <strong>Social Groups</strong> (e.g. <code className="text-white bg-white/10 px-1 py-0.5 rounded font-mono">CoreTeam</code>, <code className="text-white bg-white/10 px-1 py-0.5 rounded font-mono">Personal</code>, or <code className="text-white bg-white/10 px-1 py-0.5 rounded font-mono">Founders</code>).
              </p>
            </div>
            <div className="pt-4 border-t border-white/[0.08] flex items-center gap-2 text-[11px] font-mono text-zinc-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Multi-account cookie isolation</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-8 rounded-[32px] clean-liquid-glass space-y-5 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center font-bold font-mono text-sm shadow-md">
                02
              </div>
              <h3 className="text-lg font-semibold text-white">Commit with Directives</h3>
              <p className="text-xs text-zinc-300 font-light leading-relaxed">
                Add <code className="text-white bg-white/10 px-1 py-0.5 rounded font-mono">#Pigeon</code> to broadcast to all channels, or specify <code className="text-white bg-white/10 px-1 py-0.5 rounded font-mono">#Pigeon-g-CoreTeam</code> to limit posts strictly to that group. Pigeon aggregates your commits into <strong>one single post per push</strong>.
              </p>
            </div>
            <div className="pt-4 border-t border-white/[0.08] flex items-center gap-2 text-[11px] font-mono text-zinc-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zero-spam push aggregation</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-8 rounded-[32px] clean-liquid-glass space-y-5 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center font-bold font-mono text-sm shadow-md">
                03
              </div>
              <h3 className="text-lg font-semibold text-white">Automate or Guide</h3>
              <p className="text-xs text-zinc-300 font-light leading-relaxed">
                Toggle <strong>AUTO Mode</strong> to remove the human from the loop entirely for direct live publishing, or stay in <strong>GUIDED Mode</strong> to inspect, polish, and approve posts in your Approval Queue.
              </p>
            </div>
            <div className="pt-4 border-t border-white/[0.08] flex items-center gap-2 text-[11px] font-mono text-zinc-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Full control & live API dispatch</span>
            </div>
          </div>
        </div>
      </section>

      {/* DIRECTIVE SYNTAX CHEAT SHEET */}
      <section id="directives" className="relative z-10 py-20 px-6 max-w-5xl mx-auto">
        <div className="p-8 sm:p-12 rounded-[36px] clean-liquid-glass border border-white/15 space-y-8">
          <div className="text-center space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Tagging Specifications</span>
            <h2 className="text-2xl sm:text-4xl font-light text-white tracking-tight">Git Directive Syntax Guide</h2>
            <p className="text-xs text-zinc-300 font-light max-w-md mx-auto">
              How Pigeon intercepts, parses, and acts upon commit message tags in your repository.
            </p>
          </div>

          <div className="space-y-4">
            {/* Directive 1: Broadcast */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-white text-black font-mono font-bold text-xs">
                    #Pigeon
                  </span>
                  <span className="text-xs font-semibold text-white">Global Broadcast</span>
                </div>
                <p className="text-xs text-zinc-400 font-light">
                  Routes the push to <strong>all connected social accounts</strong> (LinkedIn personal profiles, company pages, and X accounts).
                </p>
              </div>
              <span className="text-[11px] font-mono px-3 py-1 rounded-lg liquid-glass-capsule text-zinc-300 self-start sm:self-center">
                All Channels
              </span>
            </div>

            {/* Directive 2: Precision Group */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-400 text-black font-mono font-bold text-xs">
                    #Pigeon-g-CoreTeam
                  </span>
                  <span className="text-xs font-semibold text-white">Precision Group Routing</span>
                </div>
                <p className="text-xs text-zinc-400 font-light">
                  Strictly limits broadcast to <strong>only the accounts assigned to #CoreTeam</strong>. All other linked accounts are completely excluded.
                </p>
              </div>
              <span className="text-[11px] font-mono px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 self-start sm:self-center">
                Group Members Only
              </span>
            </div>

            {/* Directive 3: Ambiguous Fallback */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-white/10 text-white font-mono font-bold text-xs border border-white/20">
                    #Pigeon-g
                  </span>
                  <span className="text-xs font-semibold text-white">Safety Fallback (Missing Name)</span>
                </div>
                <p className="text-xs text-zinc-400 font-light">
                  If a group name is omitted or ambiguous, Pigeon automatically falls back to <strong>Guided Mode</strong> in the Approval Queue so nothing goes live by mistake.
                </p>
              </div>
              <span className="text-[11px] font-mono px-3 py-1 rounded-lg liquid-glass-capsule text-zinc-400 self-start sm:self-center">
                Queue Safety Net
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ENGINE MODES: AUTO VS GUIDED */}
      <section id="engine-modes" className="relative z-10 py-20 px-6 max-w-6xl mx-auto">
        <div className="text-center space-y-3 mb-16">
          <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-400">Automation Controls</span>
          <h2 className="text-3xl sm:text-5xl font-light tracking-tight text-white">Two Modes for Any Workflow</h2>
          <p className="text-xs sm:text-sm text-zinc-400 font-light max-w-lg mx-auto">
            Choose full hands-off automation or keep complete editorial control.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* AUTO Mode Card */}
          <div className="p-8 sm:p-10 rounded-[32px] clean-liquid-glass border border-emerald-400/30 space-y-6 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-emerald-400 text-black font-mono font-bold text-xs">
                AUTO MODE
              </span>
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5" />
                <span>Zero Human in the Loop</span>
              </span>
            </div>

            <div className="space-y-3">
              <h3 className="text-2xl font-light text-white tracking-tight">Direct Live Social Dispatch</h3>
              <p className="text-xs text-zinc-300 font-light leading-relaxed">
                When active, any tagged git push is ingested, summarized into a cohesive post, and dispatched directly to your live LinkedIn feed via official OAuth APIs.
              </p>
            </div>

            <ul className="space-y-2.5 text-xs text-zinc-300 font-light pt-2 border-t border-white/[0.08]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero manual button clicks required</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Instant status: PUBLISHED with external LinkedIn URN</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Global sidebar switch or per-repository granular toggling</span>
              </li>
            </ul>
          </div>

          {/* GUIDED Mode Card */}
          <div className="p-8 sm:p-10 rounded-[32px] clean-liquid-glass border border-white/15 space-y-6">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-white text-black font-mono font-bold text-xs">
                GUIDED MODE
              </span>
              <span className="text-xs font-mono text-zinc-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Approval Queue</span>
              </span>
            </div>

            <div className="space-y-3">
              <h3 className="text-2xl font-light text-white tracking-tight">Staged Editorial Review</h3>
              <p className="text-xs text-zinc-300 font-light leading-relaxed">
                Posts arrive in your Approval Queue with tone metrics and commit breakdowns. Review, edit the draft copy, test on simulated channels, and approve with 1 click.
              </p>
            </div>

            <ul className="space-y-2.5 text-xs text-zinc-300 font-light pt-2 border-t border-white/[0.08]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                <span>Inspect tailored drafts per channel before publishing</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                <span>Edit text, hashtags, or formatting on the fly</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                <span>Reject or postpone updates with zero residue</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ZERO BUZZWORDS HIGHLIGHT */}
      <section className="relative z-10 py-20 px-6 max-w-5xl mx-auto">
        <div className="p-8 sm:p-12 rounded-[36px] clean-liquid-glass border border-white/15 space-y-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center mx-auto shadow-md">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-light text-white tracking-tight">
            Authentic Developer Voice. <span className="font-serif italic font-normal text-zinc-400">Zero AI Buzzwords.</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-300 font-light max-w-2xl mx-auto leading-relaxed">
            Pigeon reads your git diffs, changed files, and JIT Depth-3 codebase architecture. We strictly ban phrases like <em>"I am thrilled to announce"</em>, <em>"game-changer"</em>, and <em>"revolutionary"</em>.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 text-left">
            <div className="p-5 rounded-2xl bg-red-500/[0.05] border border-red-500/20 space-y-2">
              <span className="text-[10px] font-mono text-red-400 uppercase tracking-wider font-semibold">❌ Typical Marketing AI Bot</span>
              <p className="text-xs text-zinc-400 font-light leading-relaxed">
                "I am thrilled to announce that our groundbreaking optimization revolutionizes the paradigm of state synchronization! 🚀✨"
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-emerald-500/[0.05] border border-emerald-500/20 space-y-2">
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-semibold">✅ Pigeon Engineering Voice</span>
              <p className="text-xs text-zinc-200 font-light leading-relaxed">
                "Shipped recursive rollup proof verification in routes/api.ts. Decoupled buffer serialization to avoid memory spikes under peak load. 🕊️"
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE SIMULATOR PLAYGROUND */}
      <section id="interactive-simulator" className="relative z-10 py-24 px-6 max-w-4xl mx-auto">
        <div className="p-8 sm:p-12 rounded-[36px] clean-liquid-glass border border-white/20 space-y-8 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
          <div className="text-center space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Interactive Playground</span>
            <h2 className="text-3xl sm:text-4xl font-light text-white tracking-tight">Test the Commit Router Live</h2>
            <p className="text-xs text-zinc-300 font-light max-w-md mx-auto">
              Type any git commit message with <code className="text-white font-mono bg-white/10 px-1 py-0.5 rounded">#Pigeon</code> or <code className="text-white font-mono bg-white/10 px-1 py-0.5 rounded">#Pigeon-g-CoreTeam</code> below to see how Pigeon routes it.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={testCommitMsg}
                onChange={e => setTestCommitMsg(e.target.value)}
                placeholder="e.g. feat: add redis rate limiter #Pigeon-g-CoreTeam"
                className="flex-1 bg-black/60 border border-white/15 rounded-2xl px-5 py-3 text-xs text-white focus:outline-none font-mono"
              />
              <button
                onClick={runHomepageSimulation}
                disabled={isSimulating}
                className="px-7 py-3 rounded-2xl liquid-bw-btn text-xs font-semibold cursor-pointer shrink-0 disabled:opacity-50"
              >
                {isSimulating ? 'Analyzing...' : 'Simulate Router'}
              </button>
            </div>

            {simResult && (
              <div className="space-y-5 pt-4 border-t border-white/[0.08] animate-fadeIn">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-mono text-zinc-300">
                    <span className="text-zinc-500">Resolved Target:</span>
                    <span className="px-3 py-1 rounded-full bg-white text-black font-bold">
                      {simResult.group}
                    </span>
                  </div>
                  {simResult.targetAccountsDesc && (
                    <p className="text-[11px] font-mono text-emerald-400">
                      🎯 {simResult.targetAccountsDesc}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-white">
                      <XIcon className="w-3.5 h-3.5" />
                      <span>X (Twitter) Generated Draft</span>
                    </div>
                    <p className="text-xs text-zinc-300 font-sans leading-relaxed whitespace-pre-wrap">
                      {simResult.x}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-white">
                      <LinkedinIcon className="w-3.5 h-3.5" />
                      <span>LinkedIn Generated Draft</span>
                    </div>
                    <p className="text-xs text-zinc-300 font-sans leading-relaxed whitespace-pre-wrap">
                      {simResult.li}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="relative z-10 py-24 px-6 max-w-4xl mx-auto text-center">
        <div className="p-10 sm:p-16 rounded-[40px] clean-liquid-glass border border-white/20 space-y-8 shadow-[0_20px_50px_rgba(0,0,0,0.9)]">
          <div className="space-y-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Open Source & Free</span>
            <h2 className="text-3xl sm:text-5xl font-light text-white tracking-tight">
              Ready to commit to your socials?
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300 font-light max-w-md mx-auto">
              Connect your GitHub repository and begin broadcasting authentic developer progress in under 60 seconds.
            </p>
          </div>

          <button
            onClick={onGetStarted}
            className="px-9 py-4 rounded-full liquid-bw-btn text-xs font-semibold cursor-pointer inline-flex items-center gap-2.5 shadow-[0_0_35px_rgba(255,255,255,0.3)] hover:scale-105 transition-all"
          >
            <Github className="w-4 h-4" />
            <span>Launch App with GitHub</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-white/[0.08] py-10 px-8 text-center text-xs font-mono text-zinc-500">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-zinc-400">
            <span>🕊️ Pigeon • Commit to your socials</span>
          </div>
          <div className="flex items-center gap-6">
            <a 
              href="https://github.com/Enemuo-debug/Pigeon.git" 
              target="_blank" 
              rel="noreferrer"
              className="hover:text-white transition-colors flex items-center gap-1.5"
            >
              <Github className="w-3.5 h-3.5" />
              <span>GitHub Repository</span>
            </a>
            <span className="text-zinc-600">•</span>
            <button onClick={onGetStarted} className="hover:text-white transition-colors">
              Sign In
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

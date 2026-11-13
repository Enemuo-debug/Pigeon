import React, { useState } from 'react';
import { PigeonLogo } from './PigeonTransition';
import { GlassLogosBackground } from './GlassLogosBackground';
import { GithubIcon, LinkedinIcon, XIcon } from './icons';
import { 
  GitBranch, 
  GitCommit, 
  Terminal, 
  ArrowRight, 
  Check, 
  Zap, 
  Sparkles, 
  Users, 
  ChevronDown,
  Sliders,
  Share2,
  Copy
} from 'lucide-react';

interface HomePageProps {
  onGetStarted: () => void;
  onOpenDashboard?: () => void;
  isAuthenticated?: boolean;
}

export const HomePage: React.FC<HomePageProps> = ({
  onGetStarted,
  onOpenDashboard,
  isAuthenticated = false,
}) => {
  // Simulator Examples (Simple, relatable, zero jargon)
  const interactiveExamples = [
    {
      id: 'dark-mode',
      label: '🌙 Added Dark Mode',
      subtitle: 'Frontend UI update',
      commitMessage: 'git commit -m "Added dark mode toggle to the dashboard #Pigeon"',
      postHeading: 'Just shipped dark mode for our dashboard! 🌙',
      bullets: [
        'Built a clean theme switcher that remembers user preference',
        'Optimized color contrast for night-time reading',
        'Smoothed out theme transitions across all components'
      ],
      closing: 'Small polish details like this make software feel so much better to use. What theme do you keep your apps on?',
      tags: '#webdev #frontend #buildinpublic #design',
    },
    {
      id: 'fast-checkout',
      label: '⚡ Faster Checkout',
      subtitle: 'Performance improvement',
      commitMessage: 'git commit -m "Cut checkout page load time in half #Pigeon"',
      postHeading: 'Huge performance win: our checkout is now 2x faster! ⚡',
      bullets: [
        'Trimmed unnecessary network requests on page load',
        'Cached frequent database lookups',
        'Cut load times from 2.4s down to 0.9s'
      ],
      closing: 'Speed directly impacts user happiness and conversion rates. Always worth taking the time to optimize!',
      tags: '#coding #performance #engineering #buildinpublic',
    },
    {
      id: 'google-login',
      label: '🔑 One-Click Login',
      subtitle: 'New user feature',
      commitMessage: 'git commit -m "Added one-click Google and GitHub login #Pigeon-g-Company"',
      postHeading: 'Signing in just got 10x easier 🔑',
      bullets: [
        'Users can now log in with Google or GitHub with one click',
        'No more remembering another password',
        'Smooth onboarding that takes less than 3 seconds'
      ],
      closing: 'Removing friction from the signup flow is the best thing you can do for growth. Check it out on our app!',
      tags: '#product #ux #growth #startup',
      targetGroup: 'Company Page',
    },
  ];

  const [activeExampleIndex, setActiveExampleIndex] = useState(0);
  const [simulatorMode, setSimulatorMode] = useState<'AUTO' | 'GUIDED'>('GUIDED');
  const [copied, setCopied] = useState(false);

  const activeExample = interactiveExamples[activeExampleIndex];

  const handleCopyPost = () => {
    const fullText = `${activeExample.postHeading}\n\n${activeExample.bullets.map(b => `• ${b}`).join('\n')}\n\n${activeExample.closing}\n\n${activeExample.tags}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Layman FAQ
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Will Pigeon post every single commit I make?',
      a: 'No! Pigeon only posts when you explicitly add #Pigeon to your commit message. All your everyday commits remain completely private.',
    },
    {
      q: 'Can I check and edit the post before it goes live?',
      a: 'Yes! In Review Mode, Pigeon writes a ready-to-share draft on your dashboard. You can read it, adjust the wording, and click "Publish" whenever you are happy.',
    },
    {
      q: 'What if I just want it to post automatically with zero clicks?',
      a: 'That is what Auto Mode is for! Just flip the switch to Auto, and the second you push your code, Pigeon writes the post and publishes it to LinkedIn and X immediately.',
    },
    {
      q: 'What happens if I push 4 or 5 commits at once?',
      a: 'Pigeon is smart. Instead of spamming your friends with 5 separate posts, it bundles your work into one clean, cohesive summary post.',
    },
    {
      q: 'Can I send posts to my company page instead of my personal profile?',
      a: 'Yes! You can link multiple LinkedIn accounts. By writing #Pigeon-g-Company, the post goes exclusively to your company page.',
    },
    {
      q: 'Does it sound like a generic AI robot?',
      a: 'Not at all. We specifically banned annoying AI cliches like "Thrilled to announce" and "In today\'s fast-paced world". It writes naturally about what you actually built.',
    },
  ];

  return (
    <div className="relative min-h-screen bg-black text-white font-sans selection:bg-white/20 selection:text-white overflow-x-hidden">
      {/* Soft, non-invasive deep background watermark */}
      <GlassLogosBackground />

      {/* Top Liquid Glass Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-8 py-4 backdrop-blur-md bg-black/40 border-b border-white/[0.08]">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <PigeonLogo withText={true} className="w-8 h-8" />
            <nav className="hidden md:flex items-center gap-6 text-xs font-mono text-zinc-400">
              <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
              <a href="#demo" className="hover:text-white transition-colors">See Live Demo</a>
              <a href="#modes" className="hover:text-white transition-colors">Review vs Auto</a>
              <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
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
                <span>Get Started Free</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section: Two-Column Clean Layout (Text on Left, Orbit Showcase Box on Right) */}
      <main className="relative z-10 pt-32 sm:pt-36 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center mb-24">
          
          {/* Left Column: Clear, High-Contrast, Plain-English Copy */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            
            {/* Friendly Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full clean-glass-pill mb-6 border border-white/[0.12]">
              <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
              <span className="text-xs font-mono tracking-wide text-zinc-300">
                Share your progress with zero effort
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.12] mb-6">
              You write code.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-400 block sm:inline">
                Pigeon writes your posts.
              </span>
            </h1>

            {/* Layman Subtext */}
            <p className="text-base sm:text-lg text-zinc-300 leading-relaxed max-w-xl mb-8">
              Every time you build a feature and commit to GitHub, Pigeon turns it into an engaging, professional post for LinkedIn and X.
              <span className="text-zinc-400 block mt-2">
                No marketing buzzwords, no wasting hours staring at a blank page. Just your authentic progress shared with the world.
              </span>
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 w-full sm:w-auto mb-8">
              <button
                onClick={onGetStarted}
                className="px-7 py-3.5 rounded-full liquid-bw-btn text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-white/10 hover:shadow-white/20 transition-all"
              >
                <GithubIcon className="w-4 h-4" />
                <span>Connect GitHub & Start</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href="#demo"
                className="px-6 py-3.5 rounded-full clean-glass-pill text-sm font-medium text-zinc-300 hover:text-white flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>See How It Works ↓</span>
              </a>
            </div>

            {/* Bullet points for confidence */}
            <div className="flex flex-wrap items-center gap-5 text-xs font-mono text-zinc-400">
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>30-second setup</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zero AI fluff</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>You control when it posts</span>
              </div>
            </div>
          </div>

          {/* Right Column: Contained, Non-Invasive Orbit Showcase Box */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="clean-liquid-glass p-6 sm:p-8 rounded-3xl w-full max-w-[420px] h-[400px] relative flex flex-col items-center justify-between overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.7)]">
              
              {/* Top Card Bar */}
              <div className="w-full flex items-center justify-between text-[11px] font-mono text-zinc-400 z-20">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Syncing Git to Socials</span>
                </div>
                <span className="text-zinc-500">Live Engine</span>
              </div>

              {/* Circling 3D Orbit Display (Cleanly centered, never blocks text!) */}
              <div className="relative w-[280px] h-[280px] flex items-center justify-center select-none perspective-1000 my-auto">
                
                {/* Outer Orbit (Slow Clockwise) */}
                <div className="absolute w-[240px] h-[240px] rounded-full border border-dashed border-white/[0.14] animate-orbit-slow preserve-3d">
                  {/* GitHub */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 p-2 rounded-xl clean-liquid-glass animate-counter-orbit-slow">
                    <GithubIcon className="w-4 h-4 text-white" />
                  </div>
                  {/* Terminal */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 p-2 rounded-xl clean-liquid-glass animate-counter-orbit-slow">
                    <Terminal className="w-4 h-4 text-white" />
                  </div>
                </div>

                {/* Middle Orbit (Medium Counter-Clockwise) */}
                <div className="absolute w-[170px] h-[170px] rounded-full border border-white/[0.16] animate-orbit-medium preserve-3d">
                  {/* LinkedIn */}
                  <div className="absolute top-1/4 left-0 -translate-x-1/2 -translate-y-1/2 p-2 rounded-xl clean-liquid-glass animate-counter-orbit-medium">
                    <LinkedinIcon className="w-4 h-4 text-white" />
                  </div>
                  {/* X */}
                  <div className="absolute bottom-1/4 right-0 translate-x-1/2 translate-y-1/2 p-2 rounded-xl clean-liquid-glass animate-counter-orbit-medium">
                    <XIcon className="w-4 h-4 text-white" />
                  </div>
                </div>

                {/* Inner Orbit (Fast Clockwise) */}
                <div className="absolute w-[100px] h-[100px] rounded-full border border-dotted border-white/[0.22] animate-orbit-fast preserve-3d">
                  {/* Git Commit */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 p-1.5 rounded-lg clean-glass-pill animate-counter-orbit-fast">
                    <GitCommit className="w-3.5 h-3.5 text-white" />
                  </div>
                  {/* Git Branch */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 p-1.5 rounded-lg clean-glass-pill animate-counter-orbit-fast">
                    <GitBranch className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>

                {/* Center Pigeon Emblem */}
                <div className="relative z-20 w-16 h-16 rounded-2xl clean-liquid-glass flex items-center justify-center p-3 shadow-[0_0_30px_rgba(255,255,255,0.15)] group hover:scale-105 transition-transform duration-300">
                  <PigeonLogo className="w-8 h-8" />
                </div>
              </div>

              {/* Bottom Card Summary Pill */}
              <div className="w-full text-center z-20">
                <div className="px-3 py-1.5 rounded-xl bg-black/50 border border-white/[0.08] text-[11px] font-mono text-zinc-300 inline-flex items-center gap-2">
                  <span>git commit -m "... #Pigeon"</span>
                  <ArrowRight className="w-3 h-3 text-zinc-400" />
                  <span className="text-emerald-400">LinkedIn Post</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION: 3 Easy Steps */}
        <section id="how-it-works" className="pt-12 pb-20 border-t border-white/[0.08]">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-2">Dead-Simple Process</h2>
            <h3 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3">
              How it works in 3 easy steps
            </h3>
            <p className="text-zinc-400 text-sm sm:text-base">
              You do not need to change how you work. Just code, commit, and let Pigeon share your accomplishments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="clean-liquid-glass p-7 rounded-3xl flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-xl clean-glass-pill flex items-center justify-center font-mono text-sm font-bold text-white mb-5">
                  1
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">Connect Your Accounts</h4>
                <p className="text-zinc-300 text-sm leading-relaxed mb-4">
                  Log in with GitHub and link your LinkedIn or X profiles with one click. It takes under 30 seconds.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] font-mono text-xs text-zinc-400 flex items-center justify-between">
                <span>GitHub + LinkedIn</span>
                <Check className="w-4 h-4 text-emerald-400" />
              </div>
            </div>

            {/* Step 2 */}
            <div className="clean-liquid-glass p-7 rounded-3xl flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-xl clean-glass-pill flex items-center justify-center font-mono text-sm font-bold text-white mb-5">
                  2
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">Add #Pigeon to Your Commit</h4>
                <p className="text-zinc-300 text-sm leading-relaxed mb-4">
                  When you build something you want to share, simply add <code className="text-white bg-white/10 px-1.5 py-0.5 rounded">#Pigeon</code> to the end of your commit message.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] font-mono text-xs text-zinc-300 flex items-center justify-between">
                <code>git commit -m "... #Pigeon"</code>
                <GitCommit className="w-4 h-4 text-white" />
              </div>
            </div>

            {/* Step 3 */}
            <div className="clean-liquid-glass p-7 rounded-3xl flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-xl clean-glass-pill flex items-center justify-center font-mono text-sm font-bold text-white mb-5">
                  3
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">Pigeon Writes & Posts</h4>
                <p className="text-zinc-300 text-sm leading-relaxed mb-4">
                  Pigeon reads what you changed and writes a clean, engaging post. Review it first or let it post automatically—your choice!
                </p>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] font-mono text-xs text-emerald-400 flex items-center justify-between">
                <span>Published to your network</span>
                <Share2 className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: Simple Interactive Demo (Crystal Clear & Relatable) */}
        <section id="demo" className="pt-8 pb-20">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-2">See It In Action</h2>
            <h3 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3">
              Click an example to see how simple it is
            </h3>
            <p className="text-zinc-400 text-sm sm:text-base">
              See what you type in git, and the authentic social post Pigeon creates for you.
            </p>
          </div>

          <div className="clean-liquid-glass p-6 sm:p-10 rounded-3xl max-w-4xl mx-auto">
            
            {/* Step 1: Click an everyday coding task */}
            <div className="mb-8">
              <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-3">
                1. Choose what you just built:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {interactiveExamples.map((ex, idx) => (
                  <button
                    key={ex.id}
                    onClick={() => setActiveExampleIndex(idx)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      activeExampleIndex === idx
                        ? 'bg-white/[0.09] border-white/40 shadow-sm'
                        : 'bg-black/40 border-white/[0.08] hover:border-white/20 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <div className="font-semibold text-sm text-white mb-1">{ex.label}</div>
                    <div className="text-xs text-zinc-400">{ex.subtitle}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: What you type in git */}
            <div className="mb-8">
              <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-2">
                2. What you type in your terminal:
              </label>
              <div className="p-4 rounded-2xl bg-black/70 border border-white/[0.1] font-mono text-xs sm:text-sm text-zinc-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 overflow-x-auto">
                  <span className="text-emerald-400 select-none">$</span>
                  <span className="font-semibold text-white">{activeExample.commitMessage}</span>
                </div>
                <span className="text-[11px] font-mono text-zinc-400 shrink-0 px-2 py-0.5 rounded-md bg-white/[0.06]">
                  git
                </span>
              </div>
            </div>

            {/* Step 3: Social Output Preview (Real LinkedIn Post Card) */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                  3. What Pigeon creates for you:
                </label>
                <button
                  onClick={handleCopyPost}
                  className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Text'}</span>
                </button>
              </div>

              {/* Realistic Social Card */}
              <div className="p-6 sm:p-7 rounded-2xl bg-black/80 border border-white/[0.14] text-left relative">
                {/* User Header */}
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/[0.08]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 border border-white/20 flex items-center justify-center font-bold text-white text-sm">
                      P
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white flex items-center gap-2">
                        <span>Alex Developer</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.08] text-zinc-300">
                          {activeExample.targetGroup || 'Personal + Network'}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-400">Software Engineer • Just now</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full clean-glass-pill text-[11px] font-mono text-zinc-300">
                    <LinkedinIcon className="w-3.5 h-3.5 text-white" />
                    <span>LinkedIn</span>
                  </div>
                </div>

                {/* Post Content */}
                <div className="space-y-3.5 text-sm sm:text-[15px] text-zinc-200 leading-relaxed font-normal">
                  <p className="font-semibold text-white text-base">
                    {activeExample.postHeading}
                  </p>
                  
                  <div className="space-y-1.5 pl-1">
                    {activeExample.bullets.map((b, i) => (
                      <div key={i} className="flex items-start gap-2 text-zinc-300 text-sm">
                        <span className="text-zinc-500">•</span>
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>

                  <p className="text-zinc-300 text-sm pt-1">
                    {activeExample.closing}
                  </p>

                  <p className="text-xs font-mono text-zinc-400 pt-2">
                    {activeExample.tags}
                  </p>
                </div>

                {/* Mode Footer Badge */}
                <div className="mt-6 pt-4 border-t border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSimulatorMode('GUIDED')}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                        simulatorMode === 'GUIDED'
                          ? 'bg-white text-black font-semibold'
                          : 'bg-white/[0.06] text-zinc-400 hover:text-white'
                      }`}
                    >
                      Review Mode (Draft)
                    </button>
                    <button
                      onClick={() => setSimulatorMode('AUTO')}
                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                        simulatorMode === 'AUTO'
                          ? 'bg-white text-black font-semibold'
                          : 'bg-white/[0.06] text-zinc-400 hover:text-white'
                      }`}
                    >
                      Auto Mode (Hands-free)
                    </button>
                  </div>

                  <div className="text-zinc-400 text-[11px]">
                    {simulatorMode === 'AUTO' ? (
                      <span className="text-emerald-400 font-medium">⚡ Publishes to LinkedIn the second you push!</span>
                    ) : (
                      <span>Saved as a draft for you to review anytime.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: Review vs Auto Mode (Clear & Plain English) */}
        <section id="modes" className="pt-8 pb-20 border-t border-white/[0.08]">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-2">You Are in Control</h2>
            <h3 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3">
              Review first, or let it post automatically
            </h3>
            <p className="text-zinc-400 text-sm sm:text-base">
              Choose the speed that fits how you like to ship. Switch between them whenever you want.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Review Mode */}
            <div className="clean-liquid-glass p-8 rounded-3xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2.5 rounded-2xl clean-glass-pill">
                    <Sliders className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white">Review Mode</h4>
                    <span className="text-xs font-mono text-zinc-400">Total Control</span>
                  </div>
                </div>

                <p className="text-zinc-300 text-sm leading-relaxed mb-6">
                  Great if you like to double-check everything before it goes out. Pigeon writes the draft and stores it on your dashboard. You can tweak the words, preview it, and hit publish with one click.
                </p>

                <ul className="space-y-2.5 text-xs text-zinc-300 font-mono mb-6">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>See drafts before anyone else</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Edit or rewrite with one click</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Publish when you are ready</span>
                  </li>
                </ul>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/50 border border-white/[0.08] text-xs font-mono text-zinc-400">
                Default mode for all new projects
              </div>
            </div>

            {/* Auto Mode */}
            <div className="clean-liquid-glass p-8 rounded-3xl flex flex-col justify-between border border-white/[0.18]">
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2.5 rounded-2xl clean-glass-pill">
                    <Zap className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white">Auto Mode</h4>
                    <span className="text-xs font-mono text-emerald-400">100% Hands-Free</span>
                  </div>
                </div>

                <p className="text-zinc-300 text-sm leading-relaxed mb-6">
                  For creators who move fast and want zero distractions. The moment you push code to GitHub, Pigeon synthesizes the update and publishes it straight to LinkedIn and X. Zero clicks needed.
                </p>

                <ul className="space-y-2.5 text-xs text-zinc-300 font-mono mb-6">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Instant publishing on git push</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Never forget to share an update</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Stay focused in your code editor</span>
                  </li>
                </ul>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/50 border border-white/[0.08] text-xs font-mono text-emerald-400">
                Turn on anytime with a single toggle
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: Social Groups (Personal vs Company) */}
        <section className="pt-8 pb-20">
          <div className="clean-liquid-glass p-8 sm:p-12 rounded-3xl max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-1">Targeted Sharing</h2>
                <h3 className="text-2xl sm:text-3xl font-bold text-white">
                  Post to personal or company profiles
                </h3>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full clean-glass-pill text-xs font-mono text-zinc-300">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                <span>Account Groups</span>
              </div>
            </div>

            <p className="text-zinc-300 text-sm sm:text-base leading-relaxed mb-8">
              Have both a personal profile and a company page? Pigeon lets you choose exactly where each post should go:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
              <div className="p-4 rounded-2xl bg-black/50 border border-white/[0.08]">
                <div className="text-zinc-400 mb-1.5">Post to all accounts:</div>
                <code className="text-white block bg-black/70 p-2.5 rounded-xl border border-white/[0.06] text-xs">
                  git commit -m "Shipped v2.0 #Pigeon"
                </code>
                <p className="text-zinc-400 text-[11px] mt-2">
                  Broadcasts to every profile you connected.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-black/50 border border-white/[0.08]">
                <div className="text-zinc-400 mb-1.5">Post only to your company page:</div>
                <code className="text-white block bg-black/70 p-2.5 rounded-xl border border-white/[0.06] text-xs">
                  git commit -m "Added dark mode #Pigeon-g-Company"
                </code>
                <p className="text-zinc-400 text-[11px] mt-2">
                  Goes strictly to your company LinkedIn page.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: Layman FAQ */}
        <section id="faq" className="pt-8 pb-24 border-t border-white/[0.08]">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-2">Got Questions?</h2>
            <h3 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3">
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
                    <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-zinc-300 leading-relaxed border-t border-white/[0.04]">
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
          <div className="clean-liquid-glass p-10 sm:p-14 rounded-3xl text-center max-w-3xl mx-auto relative overflow-hidden">
            <div className="relative z-10">
              <PigeonLogo className="w-10 h-10 mx-auto mb-5" />
              <h3 className="text-3xl sm:text-4xl font-bold text-white mb-3">
                Ready to put your build-in-public on cruise control?
              </h3>
              <p className="text-zinc-300 text-sm sm:text-base max-w-lg mx-auto mb-8">
                Connect your GitHub repo in 30 seconds and start sharing your hard work with zero friction.
              </p>

              <button
                onClick={onGetStarted}
                className="px-8 py-3.5 rounded-full liquid-bw-btn text-sm font-semibold inline-flex items-center gap-2 cursor-pointer shadow-xl shadow-white/10 hover:shadow-white/20 transition-all"
              >
                <GithubIcon className="w-4 h-4" />
                <span>Get Started with GitHub</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.08] py-10 px-4 sm:px-8 bg-black/60 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs font-mono text-zinc-500">
          <div className="flex items-center gap-3">
            <PigeonLogo withText={true} className="w-6 h-6" />
            <span>— Automatic developer changelog & social syndication</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#how-it-works" className="hover:text-zinc-300 transition-colors">How It Works</a>
            <a href="#demo" className="hover:text-zinc-300 transition-colors">Demo</a>
            <a href="#modes" className="hover:text-zinc-300 transition-colors">Modes</a>
            <a href="#faq" className="hover:text-zinc-300 transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-zinc-400">Ready to Connect</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

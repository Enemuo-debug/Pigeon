import React, { useState } from 'react';
import { PigeonLogo } from './PigeonTransition';
import { GlassLogosBackground } from './GlassLogosBackground';
import { GithubIcon, LinkedinIcon } from './icons';
import { 
  GitBranch, 
  GitCommit, 
  Terminal, 
  Cpu, 
  Layers, 
  ArrowRight, 
  Check, 
  Zap, 
  Sparkles, 
  Users, 
  Hash, 
  ChevronDown,
  Heart,
  MessageCircle,
  Share2,
  Menu,
  X as CloseIcon
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Simple, intuitive examples anyone can relate to
  const examples = [
    {
      id: 'speed',
      badge: '⚡ Performance',
      label: 'Made app 2x faster',
      commit: 'git commit -m "Cut page load time by 60% with smart caching #Pigeon"',
      title: 'Cut load times by 60%',
      post: `⚡ Shaved over 60% off our dashboard load times today!

We swapped out our heavy query pipeline for an instant memory cache. Pages that used to take 2.4 seconds now render in under 350ms.

Tiny changes, massive difference in feel. 🚀

#buildinpublic #performance #softwareengineering`,
      likes: '342',
      comments: '28',
    },
    {
      id: 'feature',
      badge: '💳 New Feature',
      label: 'Added Apple Pay checkout',
      commit: 'git commit -m "Added 1-tap Apple Pay and Google Pay checkout #Pigeon"',
      title: '1-tap payments are live',
      post: `🍏 1-tap checkout is officially live!

Added Apple Pay and Google Pay support so customers can complete purchases in literally two seconds without typing card numbers.

Smooth, frictionless, and mobile-friendly.

#productlaunch #webdev #startup`,
      likes: '519',
      comments: '46',
    },
    {
      id: 'bugfix',
      badge: '🛡️ Quality Fix',
      label: 'Squashed mobile login bug',
      commit: 'git commit -m "Fixed mobile session logout glitch #Pigeon"',
      title: 'Resolved mobile login glitch',
      post: `🛠️ Squashed a tricky session bug that was logging out iOS users on Safari when switching tabs.

Traced it down to a stale cookie expiration header. Cleaned up, tested across devices, and deployed to production.

Back to smooth sailing! 🙌

#devlife #coding #bugfix`,
      likes: '284',
      comments: '19',
    },
  ];

  const [activeExampleIndex, setActiveExampleIndex] = useState(0);
  const activeEx = examples[activeExampleIndex];

  // FAQ open/close state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Will Pigeon post every single commit I make?',
      a: 'Never! Your private work stays 100% private. Pigeon only creates a post when you explicitly add the word #Pigeon to your commit message.',
    },
    {
      q: 'Can I read and edit the post before it goes live?',
      a: 'Yes, absolutely! By default, Pigeon saves every post as a draft in your dashboard. You can review it, tweak any words you want, and click "Publish" whenever you are happy.',
    },
    {
      q: 'What if I just want it to post automatically without asking me?',
      a: 'Simply flip on "Auto Mode"! When Auto Mode is on, Pigeon automatically writes and publishes the post to your LinkedIn the very second you push your code. Zero clicks needed.',
    },
    {
      q: 'What happens if I push 3 or 4 commits at once?',
      a: 'Pigeon is smart: instead of spamming your followers with 4 separate posts, it neatly combines all your work into one exciting update so your timeline looks clean and professional.',
    },
    {
      q: 'Can I post to different LinkedIn accounts or team pages?',
      a: 'Yes! You can connect multiple LinkedIn profiles (like your personal profile and your company page) and group them. You can easily choose which account gets which post.',
    },
  ];

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.history.pushState(null, '', `#${id}`);
    }
  };

  return (
    <div className="relative min-h-screen bg-black text-white font-sans selection:bg-white/20 selection:text-white overflow-x-hidden">
      {/* Dynamic Polished Chrome Logos & Satellites Background */}
      <GlassLogosBackground />

      {/* Top Liquid Glass Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-8 py-3.5 sm:py-4 backdrop-blur-md bg-black/60 border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <PigeonLogo withText={true} className="w-8 h-8" />
            <nav className="hidden md:flex items-center gap-6 text-xs font-mono text-zinc-400">
              <a 
                href="#how-it-works" 
                onClick={(e) => scrollToSection(e, 'how-it-works')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                How It Works
              </a>
              <a 
                href="#magic" 
                onClick={(e) => scrollToSection(e, 'magic')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                See It In Action
              </a>
              <a 
                href="#benefits" 
                onClick={(e) => scrollToSection(e, 'benefits')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Why Pigeon
              </a>
              <a 
                href="#faq" 
                onClick={(e) => scrollToSection(e, 'faq')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                FAQ
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full clean-glass-pill text-[11px] font-mono text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Online & Ready</span>
            </div>

            {isAuthenticated ? (
              <button
                onClick={onOpenDashboard}
                className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 rounded-full liquid-bw-btn text-xs font-semibold cursor-pointer"
              >
                <span>Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={onGetStarted}
                className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 rounded-full liquid-bw-btn text-xs font-semibold cursor-pointer"
              >
                <span>Sign In</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Mobile Hamburger Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-full clean-glass-pill text-zinc-300 hover:text-white transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <CloseIcon className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 pt-3 border-t border-white/[0.08] flex flex-col gap-2 pb-2 text-xs font-mono text-zinc-300">
            <a
              href="#how-it-works"
              onClick={(e) => {
                setMobileMenuOpen(false);
                scrollToSection(e, 'how-it-works');
              }}
              className="px-3 py-2 rounded-xl hover:bg-white/[0.06] hover:text-white transition-colors"
            >
              How It Works
            </a>
            <a
              href="#magic"
              onClick={(e) => {
                setMobileMenuOpen(false);
                scrollToSection(e, 'magic');
              }}
              className="px-3 py-2 rounded-xl hover:bg-white/[0.06] hover:text-white transition-colors"
            >
              See It In Action
            </a>
            <a
              href="#benefits"
              onClick={(e) => {
                setMobileMenuOpen(false);
                scrollToSection(e, 'benefits');
              }}
              className="px-3 py-2 rounded-xl hover:bg-white/[0.06] hover:text-white transition-colors"
            >
              Why Pigeon
            </a>
            <a
              href="#faq"
              onClick={(e) => {
                setMobileMenuOpen(false);
                scrollToSection(e, 'faq');
              }}
              className="px-3 py-2 rounded-xl hover:bg-white/[0.06] hover:text-white transition-colors"
            >
              FAQ
            </a>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <main className="relative z-10 pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col items-center text-center">
          
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full clean-glass-pill mb-8 border border-white/[0.14] animate-float-gentle">
            <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
            <span className="text-xs font-mono tracking-wider text-zinc-300 uppercase">
              Automatic Social Posts for Developers
            </span>
          </div>

          {/* Punchy Hero Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white max-w-4xl leading-[1.08] mb-6">
            Write code.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-500">
              Get noticed.
            </span>
            <br />
            Zero effort.
          </h1>

          {/* Subtitle - Plain English, exciting, relatable */}
          <p className="text-base sm:text-lg md:text-xl text-zinc-300 max-w-2xl mx-auto leading-relaxed mb-10 font-normal">
            Every time you push code, Pigeon turns your hard work into smart, natural LinkedIn posts. Build your professional engineering brand on autopilot while you stay focused in your editor.
          </p>

          {/* Hero CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-14">
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full liquid-bw-btn text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-white/10 hover:shadow-white/20 transition-all"
            >
              <GithubIcon className="w-4 h-4" />
              <span>Get Started with GitHub</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href="#magic"
              onClick={(e) => scrollToSection(e, 'magic')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-full clean-glass-pill text-sm font-medium text-zinc-300 hover:text-white flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>See It In Action ↓</span>
            </a>
          </div>

          {/* 3D Concentric Orbiting Icons Visual Sculpture */}
          <div className="relative w-full max-w-3xl h-[360px] sm:h-[440px] my-4 flex items-center justify-center perspective-1000 select-none overflow-hidden sm:overflow-visible">
            <div className="relative flex items-center justify-center scale-[0.72] sm:scale-90 md:scale-100 transition-transform origin-center">
              {/* Outer Orbit Ring (Slow Clockwise) */}
              <div className="absolute w-[430px] h-[430px] rounded-full border border-dashed border-white/[0.12] animate-orbit-slow preserve-3d">
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
              <div className="absolute w-[290px] h-[290px] rounded-full border border-white/[0.14] animate-orbit-medium preserve-3d">
                {/* Middle Satellite 1: LinkedIn */}
                <div className="absolute top-1/4 left-0 -translate-x-1/2 -translate-y-1/2 p-2.5 rounded-xl clean-liquid-glass animate-counter-orbit-medium">
                  <LinkedinIcon className="w-5 h-5 text-white" />
                </div>

                {/* Middle Satellite 2: Terminal / Code */}
                <div className="absolute bottom-1/4 right-0 translate-x-1/2 translate-y-1/2 p-2.5 rounded-xl clean-liquid-glass animate-counter-orbit-medium">
                  <Terminal className="w-5 h-5 text-white" />
                </div>

                {/* Middle Satellite 3: Git Branch */}
                <div className="absolute top-0 right-1/4 translate-x-1/2 -translate-y-1/2 p-2.5 rounded-xl clean-liquid-glass animate-counter-orbit-medium">
                  <GitBranch className="w-5 h-5 text-white" />
                </div>
              </div>

              {/* Inner Orbit Ring (Fast Clockwise) */}
              <div className="absolute w-[170px] h-[170px] rounded-full border border-dotted border-white/[0.2] animate-orbit-fast preserve-3d">
                {/* Inner Satellite 1: Git Commit */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 p-2 rounded-lg clean-glass-pill animate-counter-orbit-fast">
                  <GitCommit className="w-4 h-4 text-white" />
                </div>

                {/* Inner Satellite 2: CPU */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 p-2 rounded-lg clean-glass-pill animate-counter-orbit-fast">
                  <Cpu className="w-4 h-4 text-white" />
                </div>
              </div>

              {/* Center Core: Frosted Liquid Glass Pigeon Emblem */}
              <div className="relative z-20 w-24 h-24 rounded-3xl clean-liquid-glass flex items-center justify-center p-5 shadow-[0_0_50px_rgba(255,255,255,0.15)] group hover:scale-105 transition-transform duration-500">
                <PigeonLogo className="w-12 h-12" />
              </div>
            </div>

            {/* Floating Highlights around the Orbit in Layman Terms */}
            <div className="absolute top-4 left-4 hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl clean-glass-pill text-xs font-mono text-zinc-300 animate-float-gentle">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>100% Automatic — Zero clicks</span>
            </div>

            <div className="absolute top-6 right-4 hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl clean-glass-pill text-xs font-mono text-zinc-300 animate-float-reverse">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span>Multi-Account Support</span>
            </div>

            <div className="absolute bottom-6 left-6 hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl clean-glass-pill text-xs font-mono text-zinc-300 animate-float-reverse">
              <Sparkles className="w-3.5 h-3.5 text-purple-300" />
              <span>Sounds human, never robotic</span>
            </div>

            <div className="absolute bottom-8 right-6 hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl clean-glass-pill text-xs font-mono text-zinc-300 animate-float-gentle">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>100% Private — You choose when to post</span>
            </div>
          </div>
        </div>

        {/* SECTION: Super Simple 3 Steps */}
        <section id="how-it-works" className="pt-20 pb-16">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-2">How It Works</h2>
            <h3 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
              Three simple steps. That's all.
            </h3>
            <p className="text-zinc-400 text-sm sm:text-base">
              You already write code. Pigeon does the rest behind the scenes.
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
                <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                  Sign in with GitHub and link your LinkedIn profile or company page. It takes under 30 seconds.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] text-xs font-mono text-zinc-400 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>One-click secure connection</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="clean-liquid-glass p-8 rounded-3xl flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-2xl clean-glass-pill flex items-center justify-center font-mono text-sm font-semibold text-white mb-6">
                  02
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">Just Add #Pigeon</h4>
                <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                  Whenever you build something you're proud of, simply tag your commit with <code className="text-white font-semibold">#Pigeon</code>.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] text-xs font-mono text-zinc-300 flex items-center justify-between">
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
                <h4 className="text-lg font-semibold text-white mb-2">Pigeon Writes & Posts</h4>
                <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                  Pigeon understands what you built and creates a crisp, readable post for your followers. Review it first or let it post automatically!
                </p>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] text-xs font-mono text-emerald-400 flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Live update posted to your feed</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: See The Magic (Crystal-clear interactive visual demonstration) */}
        <section id="magic" className="pt-16 pb-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-2">Live Demo</h2>
            <h3 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
              See the magic in action
            </h3>
            <p className="text-zinc-400 text-sm sm:text-base">
              Click any example below to see how a simple code change instantly becomes an engaging social post.
            </p>
          </div>

          <div className="clean-liquid-glass p-6 sm:p-10 rounded-3xl max-w-4xl mx-auto">
            
            {/* Easy Clickable Presets */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
              {examples.map((ex, idx) => (
                <button
                  key={ex.id}
                  onClick={() => setActiveExampleIndex(idx)}
                  className={`px-4 py-2.5 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-2 ${
                    activeExampleIndex === idx
                      ? 'liquid-bw-btn shadow-md'
                      : 'clean-glass-pill text-zinc-400 hover:text-white hover:bg-white/[0.08]'
                  }`}
                >
                  <span>{ex.label}</span>
                </button>
              ))}
            </div>

            {/* Before and After Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              
              {/* Left Side: What you type in Git */}
              <div className="p-6 rounded-2xl bg-black/60 border border-white/[0.1] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-mono uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-zinc-400" />
                      What you write in Git
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.08] text-zinc-300">
                      Step 1
                    </span>
                  </div>

                  <div className="bg-black/90 p-4 rounded-xl border border-white/[0.06] font-mono text-xs sm:text-sm text-zinc-200 mb-4 leading-relaxed">
                    <span className="text-emerald-400 font-bold">$ </span>
                    <span>{activeEx.commit}</span>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed">
                    You just do your normal job. Add <span className="text-white font-semibold">#Pigeon</span> at the end of your commit, and you're done.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center gap-2 text-xs font-mono text-zinc-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>Detected by Pigeon in &lt;1 second</span>
                </div>
              </div>

              {/* Right Side: What your network sees on LinkedIn */}
              <div className="p-6 rounded-2xl clean-liquid-glass border border-white/[0.2] flex flex-col justify-between shadow-lg">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] font-mono uppercase text-zinc-300 tracking-wider flex items-center gap-1.5">
                      <LinkedinIcon className="w-3.5 h-3.5 text-blue-400" />
                      What gets published for you
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Step 2: Done!
                    </span>
                  </div>

                  {/* Simulated Social Post Card */}
                  <div className="p-4 rounded-xl bg-black/60 border border-white/[0.08] text-xs leading-relaxed text-zinc-200">
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center text-[10px] font-bold text-white">
                        YOU
                      </div>
                      <div>
                        <div className="font-semibold text-white text-xs">Your Profile</div>
                        <div className="text-[10px] text-zinc-400">Software Engineer • Just now</div>
                      </div>
                    </div>

                    <p className="whitespace-pre-line text-zinc-300 text-xs">
                      {activeEx.post}
                    </p>
                  </div>
                </div>

                {/* Simulated Social Reactions */}
                <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-400 font-mono">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1 hover:text-white transition-colors">
                      <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                      <span>{activeEx.likes}</span>
                    </span>
                    <span className="flex items-center gap-1 hover:text-white transition-colors">
                      <MessageCircle className="w-3.5 h-3.5 text-blue-400" />
                      <span>{activeEx.comments}</span>
                    </span>
                  </div>
                  <Share2 className="w-3.5 h-3.5 text-zinc-400 hover:text-white cursor-pointer" />
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* SECTION: Why Developers Love It */}
        <section id="benefits" className="pt-16 pb-20">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-2">Why It Matters</h2>
            <h3 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
              Build your reputation without the hassle
            </h3>
            <p className="text-zinc-400 text-sm sm:text-base">
              The best developers aren't always the loudest. Pigeon gives you the credit you deserve while you stay focused on writing code.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Benefit 1 */}
            <div className="clean-liquid-glass p-8 rounded-3xl">
              <div className="w-10 h-10 rounded-2xl clean-glass-pill flex items-center justify-center mb-4">
                <Zap className="w-5 h-5 text-emerald-400" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Never Forget to Share</h4>
              <p className="text-zinc-300 text-sm leading-relaxed">
                You solve tough problems and ship cool updates every single day, but nobody has time to stop and craft a LinkedIn post. Pigeon handles the storytelling for you.
              </p>
            </div>

            {/* Benefit 2 */}
            <div className="clean-liquid-glass p-8 rounded-3xl">
              <div className="w-10 h-10 rounded-2xl clean-glass-pill flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5 text-purple-300" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Sounds Human, Not Cringe</h4>
              <p className="text-zinc-300 text-sm leading-relaxed">
                Nobody likes cheesy AI buzzwords like "I am thrilled and humbled". Pigeon writes clean, smart updates that sound like a real engineer talking to peers.
              </p>
            </div>

            {/* Benefit 3 */}
            <div className="clean-liquid-glass p-8 rounded-3xl">
              <div className="w-10 h-10 rounded-2xl clean-glass-pill flex items-center justify-center mb-4">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Manage Multiple Accounts</h4>
              <p className="text-zinc-300 text-sm leading-relaxed">
                Have both a personal LinkedIn and a company page? Connect both, group them, and easily choose which accounts receive each post.
              </p>
            </div>

            {/* Benefit 4 */}
            <div className="clean-liquid-glass p-8 rounded-3xl">
              <div className="w-10 h-10 rounded-2xl clean-glass-pill flex items-center justify-center mb-4">
                <Check className="w-5 h-5 text-white" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">You Have Complete Control</h4>
              <p className="text-zinc-300 text-sm leading-relaxed">
                Want to review every post first? Use Guided Mode to check drafts before they go live. Prefer hands-free? Turn on Auto Mode and let it ship automatically.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION: FAQ */}
        <section id="faq" className="pt-16 pb-20">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-2">Common Questions</h2>
            <h3 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
              Everything you need to know
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
          <div className="clean-liquid-glass p-10 sm:p-14 rounded-3xl text-center max-w-4xl mx-auto relative overflow-hidden">
            <div className="relative z-10">
              <PigeonLogo className="w-10 h-10 mx-auto mb-6" />
              <h3 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Ready to show the world what you're building?
              </h3>
              <p className="text-zinc-300 text-sm sm:text-base max-w-xl mx-auto mb-8">
                Connect your GitHub in 30 seconds. No credit card required.
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
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs font-mono text-zinc-500">
          <div className="flex items-center gap-3">
            <PigeonLogo withText={true} className="w-6 h-6" />
            <span>— Automatic Social Posts for Developers</span>
          </div>

          <div className="flex items-center gap-6">
            <a 
              href="#how-it-works" 
              onClick={(e) => scrollToSection(e, 'how-it-works')}
              className="hover:text-zinc-300 transition-colors cursor-pointer"
            >
              How It Works
            </a>
            <a 
              href="#magic" 
              onClick={(e) => scrollToSection(e, 'magic')}
              className="hover:text-zinc-300 transition-colors cursor-pointer"
            >
              Live Demo
            </a>
            <a 
              href="#benefits" 
              onClick={(e) => scrollToSection(e, 'benefits')}
              className="hover:text-zinc-300 transition-colors cursor-pointer"
            >
              Why Pigeon
            </a>
            <a 
              href="#faq" 
              onClick={(e) => scrollToSection(e, 'faq')}
              className="hover:text-zinc-300 transition-colors cursor-pointer"
            >
              FAQ
            </a>
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

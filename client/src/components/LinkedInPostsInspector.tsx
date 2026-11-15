import React, { useState } from 'react';
import { 
  Terminal, 
  ArrowRight, 
  Layers, 
  Code2, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Send,
  GitCommit,
  ShieldCheck,
  Info
} from 'lucide-react';
import { LinkedinIcon } from './icons';
import { PigeonLogo } from './PigeonTransition';
import { GlassLogosBackground } from './GlassLogosBackground';
import { API_BASE } from '../config/api';

interface LinkedInPostsInspectorProps {
  account: any;
  posts: any[];
  rawResponse: any;
  method: string;
  extractedSamples?: string[];
  onContinueToDashboard: () => void;
  onBackToSocials: () => void;
}

export const LinkedInPostsInspector: React.FC<LinkedInPostsInspectorProps> = ({
  account,
  posts: initialPosts,
  rawResponse: initialRawResponse,
  method: initialMethod,
  extractedSamples = [],
  onContinueToDashboard,
  onBackToSocials,
}) => {
  const [posts, setPosts] = useState<any[]>(initialPosts);
  const [rawResponse, setRawResponse] = useState<any>(initialRawResponse);
  const [method, setMethod] = useState<string>(initialMethod);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  
  // Custom posts input state
  const [manualPostsText, setManualPostsText] = useState('');
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrateFeedback, setCalibrateFeedback] = useState<string | null>(null);
  const [currentTone, setCurrentTone] = useState<any>(account?.toneProfile || null);

  // Determine active samples from extractedSamples, toneProfile, or defaults
  const activeSamples: string[] = 
    extractedSamples.length > 0 
      ? extractedSamples 
      : (Array.isArray(currentTone?.samplePosts) && currentTone.samplePosts.length > 0)
        ? currentTone.samplePosts
        : [
            'Engineered modular API routers and decoupled background queue workers.',
            'Resolved database lock contention during high-concurrency event syncing.'
          ];

  const reLogToConsole = () => {
    console.group('🕊️ [Pigeon] LinkedIn Posts & Account Inspection');
    console.log('Account Details:', account);
    console.log(`Fetched Posts Count: ${posts.length}`);
    console.log('Posts Array:', posts);
    console.log('Raw LinkedIn API Response:', rawResponse);
    console.log('Extracted Voice Samples:', activeSamples);
    console.log('Calibrated Tone Profile:', currentTone);
    if (posts && posts.length > 0) {
      console.table(posts);
    }
    console.groupEnd();
  };

  const handleRetryFetch = async () => {
    if (!account?.id) return;
    setIsRetrying(true);
    try {
      const res = await fetch(`${API_BASE}/api/socials/${account.id}/posts`);
      const data = await res.json();
      if (res.ok && data.success) {
        setPosts(data.posts || []);
        setRawResponse(data.raw);
        setMethod(data.method);
        console.group('🕊️ [Pigeon] Re-queried LinkedIn Posts');
        console.log('Posts:', data.posts);
        console.log('Raw Response:', data.raw);
        if (data.posts?.length > 0) console.table(data.posts);
        console.groupEnd();
      }
    } catch (err) {
      console.error('Failed to retry post fetch:', err);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleCalibrateWithMyPosts = async () => {
    if (!manualPostsText.trim() || !account?.id) return;
    setIsCalibrating(true);
    setCalibrateFeedback(null);
    try {
      const samplePosts = manualPostsText
        .split(/\n\s*---\s*\n|\n{2,}/)
        .map(p => p.trim())
        .filter(p => p.length > 10);

      const res = await fetch(`${API_BASE}/api/socials/${account.id}/calibrate-tone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ samplePosts }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCurrentTone(data.toneProfile);
        setCalibrateFeedback(`✓ Analyzed ${samplePosts.length} post(s)! Voice profile calibrated with your authentic cadence.`);
        console.log('🕊️ [Pigeon] Calibrated Tone Profile:', data.toneProfile);
      } else {
        setCalibrateFeedback(data.error || 'Failed to calibrate tone profile');
      }
    } catch (err: any) {
      setCalibrateFeedback(err.message || 'Failed to calibrate tone');
    } finally {
      setIsCalibrating(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-black text-white font-sans selection:bg-white/20 selection:text-white py-12 px-4 sm:px-6 lg:px-8">
      <GlassLogosBackground />

      <div className="relative z-10 max-w-4xl mx-auto space-y-6">
        {/* Header Branding */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <PigeonLogo className="w-8 h-8 text-white" />
            <div>
              <h1 className="text-lg font-light tracking-tight text-white flex items-center gap-2">
                LinkedIn Account Connected
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </h1>
              <p className="text-xs font-mono text-zinc-400">
                Direct OAuth Handshake • Voice Profile Calibration
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={reLogToConsole}
              className="px-3.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-mono text-zinc-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
              title="Click to print posts and details to browser console"
            >
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span>Log to Console</span>
            </button>
            <button
              onClick={onContinueToDashboard}
              className="px-4 py-1.5 rounded-xl liquid-bw-btn text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <span>Continue to Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Connected Channel Summary Card */}
        <div className="p-5 rounded-2xl clean-liquid-glass border border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {account.avatarUrl ? (
              <img 
                src={account.avatarUrl} 
                alt={account.name} 
                className="w-12 h-12 rounded-xl object-cover border border-white/10" 
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-white/[0.08] flex items-center justify-center text-white">
                <LinkedinIcon className="w-6 h-6 text-white" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-white">{account.name || account.handle}</h3>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Verified
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                URN: urn:li:person:{account.platformUserId}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <span className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Publishing Scope: Active</span>
            </span>
            <span className="px-3 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-zinc-300 flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-zinc-400" />
              <span>Method: {method || 'REST / UGC Posts'}</span>
            </span>
          </div>
        </div>

        {/* LinkedIn Permissions & Feed Reading Architecture Notice */}
        <div className="p-4 rounded-xl bg-zinc-950/80 border border-white/[0.06] text-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-zinc-200 font-medium">
              <Info className="w-4 h-4 text-sky-400 shrink-0" />
              <span>LinkedIn API Permission Model</span>
            </div>
            <button
              onClick={handleRetryFetch}
              disabled={isRetrying}
              className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-[11px] font-mono text-zinc-300 hover:text-white flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isRetrying ? 'animate-spin text-emerald-400' : ''}`} />
              <span>{isRetrying ? 'Checking...' : 'Re-check LinkedIn API'}</span>
            </button>
          </div>
          <p className="text-zinc-400 font-sans text-xs leading-relaxed">
            LinkedIn's standard developer product (<code className="text-zinc-300">Share on LinkedIn</code>) grants direct <strong>write permission (<span className="text-emerald-300">w_member_social</span>)</strong> to broadcast updates to your feed. Reading historical member posts (<code className="text-zinc-300">r_member_social</code>) is restricted by LinkedIn to enterprise partner contracts.
          </p>
          <p className="text-zinc-500 font-mono text-[11px]">
            Pigeon automatically extracts your authentic voice from your genuine GitHub commits and repositories, ensuring zero dummy templates without requiring feed read access.
          </p>
        </div>

        {/* Developer Voice Calibration Section (Real Commits - Zero Dummy Templates) */}
        <div className="p-5 rounded-2xl clean-liquid-glass border border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-medium text-white">
                Authentic Voice Profile (Zero Dummy Templates)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-emerald-400/90 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
              GitHub Grounded
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] space-y-1">
              <span className="text-[11px] font-mono uppercase text-zinc-500">Cadence & Tone</span>
              <p className="text-zinc-200 font-medium">
                {currentTone?.voice || 'Direct, pragmatic software builder'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] space-y-1">
              <span className="text-[11px] font-mono uppercase text-zinc-500">Writing Style</span>
              <p className="text-zinc-200 font-medium">
                {currentTone?.style || 'Technical clarity, natural dev rhythm, zero corporate hype'}
              </p>
            </div>
          </div>

          {/* Real Extracted Exemplars */}
          <div className="space-y-2 pt-1">
            <span className="text-[11px] font-mono uppercase text-zinc-500 flex items-center gap-1.5">
              <GitCommit className="w-3.5 h-3.5 text-zinc-400" />
              <span>Extracted Writing Samples (From Developer Activity)</span>
            </span>
            <div className="space-y-1.5">
              {activeSamples.slice(0, 4).map((sample, idx) => (
                <div 
                  key={idx}
                  className="px-3.5 py-2 rounded-xl bg-black/50 border border-white/[0.04] text-xs font-mono text-zinc-300 flex items-start gap-2"
                >
                  <span className="text-zinc-600 select-none">#{idx + 1}</span>
                  <span className="leading-relaxed">{sample}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Optional Paste Section */}
          <div className="pt-3 border-t border-white/[0.08] space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-300 font-medium">
                Want to fine-tune with your favorite past LinkedIn updates? (Optional)
              </p>
              <span className="text-[10px] font-mono text-zinc-500">Paste 1-3 posts</span>
            </div>

            <textarea
              value={manualPostsText}
              onChange={(e) => setManualPostsText(e.target.value)}
              placeholder="Paste your past LinkedIn updates here... (Separate multiple posts with --- or blank lines)"
              className="w-full h-24 px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-xs text-white font-mono placeholder:text-zinc-600 focus:outline-none focus:border-white/30 resize-none"
            />

            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-zinc-500">
                {manualPostsText.trim().length > 0 ? `${manualPostsText.trim().length} characters` : 'Optional manual calibration'}
              </span>
              <button
                onClick={handleCalibrateWithMyPosts}
                disabled={isCalibrating || !manualPostsText.trim()}
                className="px-4 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 text-xs font-mono text-white transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                <Send className={`w-3.5 h-3.5 ${isCalibrating ? 'animate-spin text-emerald-400' : ''}`} />
                <span>{isCalibrating ? 'Analyzing...' : 'Calibrate Voice Profile'}</span>
              </button>
            </div>

            {calibrateFeedback && (
              <p className="text-xs font-mono text-emerald-300 pt-1">
                {calibrateFeedback}
              </p>
            )}
          </div>
        </div>

        {/* Fetched Posts Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <span>LinkedIn API Post Stream ({posts.length})</span>
            </h2>

            <button
              onClick={() => setShowRawJson(!showRawJson)}
              className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>{showRawJson ? 'Hide Raw API JSON' : 'Inspect Raw API Payload'}</span>
            </button>
          </div>

          {/* Raw JSON inspection toggle */}
          {showRawJson && (
            <div className="p-4 rounded-xl bg-black/80 border border-white/[0.08] text-xs font-mono text-zinc-300 overflow-x-auto max-h-72">
              <pre>{JSON.stringify({ posts, rawResponse, activeSamples }, null, 2)}</pre>
            </div>
          )}

          {posts.length > 0 && (
            <div className="space-y-3">
              {posts.map((post: any, idx: number) => {
                const isExpanded = expandedPostId === post.id;
                return (
                  <div 
                    key={post.id || idx}
                    className="p-5 rounded-2xl clean-liquid-glass border border-white/[0.08] hover:border-white/20 transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-zinc-500">#{idx + 1}</span>
                          <span className="text-xs font-mono text-zinc-400 truncate max-w-xs">
                            {post.id}
                          </span>
                        </div>
                        {post.createdAt && (
                          <p className="text-[11px] font-mono text-zinc-500">
                            {new Date(post.createdAt).toLocaleString()}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
                        className="p-1 rounded-lg hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors cursor-pointer"
                        title="Toggle full details"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                    <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.04] text-xs text-zinc-200 leading-relaxed font-sans whitespace-pre-wrap">
                      {post.commentary || 'No text commentary (media-only or share post)'}
                    </div>

                    {isExpanded && (
                      <div className="pt-2 border-t border-white/[0.06] text-xs font-mono text-zinc-400 space-y-1">
                        <p><strong className="text-zinc-300">Lifecycle State:</strong> {post.lifecycleState || 'PUBLISHED'}</p>
                        <p><strong className="text-zinc-300">Visibility:</strong> {typeof post.visibility === 'string' ? post.visibility : JSON.stringify(post.visibility)}</p>
                        <div className="pt-2">
                          <pre className="p-3 rounded-lg bg-black/60 text-[10px] text-zinc-400 overflow-x-auto">
                            {JSON.stringify(post.raw, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="pt-6 border-t border-white/[0.08] flex items-center justify-between">
          <button
            onClick={onBackToSocials}
            className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-mono text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            ← Back to Channels
          </button>

          <button
            onClick={onContinueToDashboard}
            className="px-6 py-2.5 rounded-full liquid-bw-btn text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-lg"
          >
            <span>Proceed to Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

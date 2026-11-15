import React, { useState } from 'react';
import { 
  Terminal, 
  ArrowRight, 
  Layers, 
  Code2, 
  ChevronDown, 
  ChevronUp, 
  Database
} from 'lucide-react';
import { LinkedinIcon } from './icons';
import { PigeonLogo } from './PigeonTransition';
import { GlassLogosBackground } from './GlassLogosBackground';

interface LinkedInPostsInspectorProps {
  account: any;
  posts: any[];
  rawResponse: any;
  method: string;
  onContinueToDashboard: () => void;
  onBackToSocials: () => void;
}

export const LinkedInPostsInspector: React.FC<LinkedInPostsInspectorProps> = ({
  account,
  posts,
  rawResponse,
  method,
  onContinueToDashboard,
  onBackToSocials,
}) => {
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);

  const reLogToConsole = () => {
    console.group('🕊️ [Pigeon] LinkedIn Posts (Manual Trigger)');
    console.log('Account Details:', account);
    console.log(`Count: ${posts.length}`);
    console.log('Posts Array:', posts);
    console.log('Raw LinkedIn API Response:', rawResponse);
    if (posts && posts.length > 0) {
      console.table(posts);
    }
    console.groupEnd();
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
                LinkedIn Account Linked
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </h1>
              <p className="text-xs font-mono text-zinc-400">
                Posts fetched live from LinkedIn API • Browser Console Inspection
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={reLogToConsole}
              className="px-3.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-mono text-zinc-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
              title="Click to print posts to browser console again"
            >
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span>Log to Console</span>
            </button>
            <button
              onClick={onContinueToDashboard}
              className="px-4 py-1.5 rounded-xl liquid-bw-btn text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <span>Continue to Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Connected Channel Summary */}
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
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  Verified
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                URN: urn:li:person:{account.platformUserId}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <span className="px-3 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-zinc-300 flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-zinc-400" />
              <span>Method: {method || 'REST Posts'}</span>
            </span>
            <span className="px-3 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-zinc-300 flex items-center gap-1.5">
              <Database className="w-3 h-3 text-amber-400" />
              <span>DB Status: 0 Saved (Safe Inspection)</span>
            </span>
          </div>
        </div>

        {/* Notice Banner explaining console output */}
        <div className="p-4 rounded-xl bg-zinc-950/80 border border-white/[0.06] text-xs space-y-1.5">
          <div className="flex items-center gap-2 text-zinc-200 font-medium">
            <Terminal className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Browser Console Output Ready</span>
          </div>
          <p className="text-zinc-400 font-mono text-[11px] leading-relaxed">
            All retrieved post objects have been printed to your browser console via <code className="text-emerald-300">console.log</code> and <code className="text-emerald-300">console.table</code>.
            Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">F12</kbd> or right-click anywhere and select <strong className="text-white">Inspect &gt; Console</strong> to view the structured objects.
          </p>
        </div>

        {/* Fetched Posts Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-mono text-zinc-300 uppercase tracking-wider flex items-center gap-2">
              <span>Fetched Posts ({posts.length})</span>
            </h2>

            <button
              onClick={() => setShowRawJson(!showRawJson)}
              className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>{showRawJson ? 'Hide Raw API JSON' : 'Show Raw API JSON'}</span>
            </button>
          </div>

          {/* Raw JSON inspection toggle */}
          {showRawJson && (
            <div className="p-4 rounded-xl bg-black/80 border border-white/[0.08] text-xs font-mono text-zinc-300 overflow-x-auto max-h-72">
              <pre>{JSON.stringify({ posts, rawResponse }, null, 2)}</pre>
            </div>
          )}

          {/* Post Items */}
          {posts.length === 0 ? (
            <div className="p-8 rounded-2xl clean-liquid-glass border border-white/[0.08] text-center space-y-2">
              <p className="text-sm text-zinc-300 font-medium">
                No published posts returned by LinkedIn API for this account
              </p>
              <p className="text-xs font-mono text-zinc-500 max-w-md mx-auto">
                Either this LinkedIn account has no previous posts, or LinkedIn's API returned 0 elements for current permissions. The raw response is logged in your browser console.
              </p>
            </div>
          ) : (
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

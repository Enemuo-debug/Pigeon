import React, { useState, useEffect } from 'react';
import { Plus, ArrowRight, ShieldCheck, RefreshCw, KeyRound, X, ExternalLink, LogOut, Trash2, Bird, Feather } from 'lucide-react';
import { LinkedinIcon } from './icons';
import { GlassLogosBackground } from './GlassLogosBackground';
import { LiquidInkCanvas } from './LiquidInkCanvas';
import { PigeonLogo } from './PigeonTransition';
import { API_BASE } from '../config/api';

interface SocialAccount {
  id: string;
  platform: 'LINKEDIN';
  handle: string;
  name: string;
  toneProfile?: {
    voice: string;
    style: string;
    emojiUsage: string;
    samplePhrases: string[];
  };
}

interface ConnectSocialsProps {
  user: any;
  onComplete: (connectedAccounts: SocialAccount[]) => void;
  onLogout?: () => void;
  initialAccounts?: SocialAccount[];
}

export const ConnectSocials: React.FC<ConnectSocialsProps> = ({ 
  user, 
  onComplete, 
  onLogout,
  initialAccounts = [] 
}) => {
  const [accounts, setAccounts] = useState<SocialAccount[]>(initialAccounts);
  const [analyzingPlatform, setAnalyzingPlatform] = useState<boolean>(false);
  const [injectingPlatform, setInjectingPlatform] = useState<boolean>(false);

  // Platform Setup Modal State
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [clientIdInput, setClientIdInput] = useState('');
  const [clientSecretInput, setClientSecretInput] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const handleDisconnectAccount = async (accountId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/socials/${accountId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setAccounts((prev) => prev.filter((a) => a.id !== accountId));
      }
    } catch (err) {
      console.warn('Failed to disconnect account:', err);
    }
  };

  // Sync initial accounts passed from parent
  useEffect(() => {
    if (initialAccounts) {
      setAccounts(initialAccounts);
    }
  }, [initialAccounts]);

  // Initiate real OAuth for LinkedIn in a dedicated popup window
  const handleConnectClick = async () => {
    setAnalyzingPlatform(true);
    setModalError(null);

    // Open popup synchronously on user click to prevent popup blockers
    const width = 600;
    const height = 750;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      'https://www.linkedin.com/m/logout/',
      'pigeon_linkedin_auth',
      `width=${width},height=${height},left=${left},top=${top},status=no,menubar=no,toolbar=no`
    );

    try {
      const res = await fetch(`${API_BASE}/api/socials/auth-url/linkedin?userId=${user?.id || 'default'}`);
      const data = await res.json();

      if (data.configured && data.url) {
        sessionStorage.setItem('pigeon_oauth_source', 'socials');

        if (popup && !popup.closed) {
          // Allow logout cookies (li_at, liap) to fully purge on LinkedIn domain, then transition popup to OAuth login
          setTimeout(() => {
            try {
              if (popup && !popup.closed) {
                popup.location.href = data.url;
              }
            } catch (navErr) {
              console.warn('Popup navigation deferred:', navErr);
            }
          }, 2500);
        } else {
          // Fallback only if popup blocker prevented window from opening
          window.location.href = data.url;
        }
        return;
      }

      // Not configured in server/.env yet -> close popup and open setup modal
      if (popup && !popup.closed) popup.close();
      setShowConfigModal(true);
      setClientIdInput('');
      setClientSecretInput('');
    } catch (err: any) {
      console.warn('Error contacting LinkedIn auth URL:', err);
      if (popup && !popup.closed) popup.close();
      setShowConfigModal(true);
    } finally {
      setAnalyzingPlatform(false);
    }
  };

  // Save credentials and immediately initiate OAuth redirect
  const handleSaveAndConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientIdInput.trim() || !clientSecretInput.trim()) {
      setModalError('Both Client ID and Client Secret are required.');
      return;
    }

    setModalLoading(true);
    setModalError(null);

    try {
      // 1. Save credentials to server/.env
      const configRes = await fetch(`${API_BASE}/api/socials/configure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: 'LINKEDIN',
          clientId: clientIdInput.trim(),
          clientSecret: clientSecretInput.trim(),
        }),
      });

      const configData = await configRes.json();
      if (!configRes.ok || !configData.success) {
        throw new Error(configData.error || 'Failed to configure LinkedIn credentials');
      }

      // 2. Fetch fresh OAuth URL and redirect
      const urlRes = await fetch(`${API_BASE}/api/socials/auth-url/linkedin?userId=${user?.id || 'default'}`);
      const urlData = await urlRes.json();

      if (urlData.url) {
        setInjectingPlatform(true);
        sessionStorage.setItem('pigeon_oauth_source', 'socials');
        const width = 600;
        const height = 750;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        const popup = window.open(
          'https://www.linkedin.com/m/logout/',
          'pigeon_linkedin_auth',
          `width=${width},height=${height},left=${left},top=${top},status=no,menubar=no,toolbar=no`
        );
        if (popup && !popup.closed) {
          setTimeout(() => {
            try {
              if (popup && !popup.closed) {
                popup.location.href = urlData.url;
              }
            } catch (navErr) {
              console.warn('Popup navigation deferred:', navErr);
            }
          }, 2500);
        } else {
          window.location.href = urlData.url;
        }
      } else {
        throw new Error('Failed to obtain LinkedIn authorization URL');
      }
    } catch (err: any) {
      setModalError(err.message || 'Error configuring LinkedIn credentials');
      setModalLoading(false);
    }
  };

  const isLinkedInConnected = accounts.some(a => a.platform === 'LINKEDIN');

  return (
    <div className="relative min-h-screen w-full bg-black text-slate-100 flex flex-col justify-between overflow-x-hidden select-none font-sans">
      
      {/* 3D Polished Metal Platform Logos Floating in Background */}
      <GlassLogosBackground />

      {/* Top Header */}
      <header className="relative z-20 w-full px-4 sm:px-10 py-4 sm:py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
        <PigeonLogo withText={true} className="w-8 h-8" />
        
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 text-xs text-zinc-300 font-mono px-3 py-1.5 rounded-full clean-glass-pill truncate max-w-[200px] sm:max-w-none">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span className="truncate">GitHub: {user?.username || 'user'}</span>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 text-xs font-mono text-zinc-300 hover:text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full clean-glass-pill hover:bg-white/[0.1] transition-all cursor-pointer shrink-0"
            >
              <LogOut className="w-3.5 h-3.5 text-zinc-400" />
              <span>Log out</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Channel Configuration Panel */}
      <main className="relative z-20 max-w-3xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-6 my-auto">
        
        <div className="text-center max-w-xl mx-auto mb-8 pt-4 sm:pt-6">
          <h2 className="text-3xl sm:text-4xl font-light text-white tracking-tight">
            Connect Your LinkedIn Channels
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-zinc-400 font-light leading-relaxed">
            Link your personal profile or company pages. Pigeon extracts your authentic engineering voice to craft high-impact, professional updates on every git push.
          </p>
        </div>

        {/* Dedicated LinkedIn Card with Liquid Ink Contamination */}
        <div 
          className={`relative p-8 sm:p-10 rounded-[32px] flex flex-col justify-between overflow-hidden transition-all duration-700 ${
            isLinkedInConnected ? 'pale-green-water-glass' : 'clean-liquid-glass'
          }`}
        >
          {/* Live Fluid Ink Injection Canvas */}
          <LiquidInkCanvas 
            isInjecting={injectingPlatform}
            isContaminated={isLinkedInConnected}
            color="52, 211, 153"
          />

          <div className="relative z-10">
            {/* Top Bar with Icon */}
            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-12 h-12 rounded-2xl clean-glass-pill flex items-center justify-center text-white">
                <LinkedinIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-white tracking-tight">LinkedIn</h3>
                <p className="text-xs text-zinc-400 font-light">
                  Your professional engineering presence on autopilot
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 font-light leading-relaxed">
              Ideal for career milestones, architectural breakthroughs, engineering culture, and recruiter visibility. 
              Supports multiple accounts so you can publish to both your personal feed and company page.
            </p>

            {/* Connected LinkedIn accounts list */}
            {accounts.length > 0 && (
              <div className="mt-6 space-y-3">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block">
                  Connected Channel(s)
                </span>
                {accounts.map(acc => (
                  <div 
                    key={acc.id} 
                    className="p-4 rounded-2xl bg-white/[0.02] border border-emerald-400/20 backdrop-blur-md transition-all duration-500"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400/80 animate-pulse"></span>
                        <div>
                          <span className="text-sm font-medium text-white">{acc.name || acc.handle}</span>
                          {acc.handle && acc.handle !== acc.name && (
                            <span className="ml-2 text-[11px] text-zinc-400 font-mono">({acc.handle})</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-emerald-300/80 font-mono uppercase tracking-wider">
                          Connected
                        </span>
                        <button
                          onClick={() => handleDisconnectAccount(acc.id)}
                          className="text-zinc-500 hover:text-red-400 p-1 cursor-pointer transition-colors"
                          title="Disconnect account"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {acc.toneProfile && (
                      <div className="mt-2.5 pt-2 border-t border-emerald-500/10 text-[11px] text-zinc-300">
                        <span className="text-emerald-400 font-mono">Extracted Voice: </span>
                        {acc.toneProfile.voice}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Fun Pigeon Facts */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-white/[0.06]">
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-left">
                <div className="flex items-center gap-2 text-white text-xs font-medium mb-1">
                  <Bird className="w-3.5 h-3.5 text-zinc-300" />
                  <span>Carrier Bird Speed</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed font-light">
                  Pigeons flew 60 mph to deliver messages across continents. Ours delivers your git wins to LinkedIn the second you push.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-left">
                <div className="flex items-center gap-2 text-white text-xs font-medium mb-1">
                  <Feather className="w-3.5 h-3.5 text-zinc-300" />
                  <span>Zero Cringe Posts</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed font-light">
                  No fake thought leadership or marketing essays. Just honest updates about real code you actually wrote.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 relative z-10 space-y-2">
            <button
              onClick={handleConnectClick}
              disabled={analyzingPlatform}
              className={`w-full py-3.5 px-6 rounded-2xl text-xs font-medium transition-all cursor-pointer ${
                isLinkedInConnected 
                  ? 'bg-emerald-500/10 text-emerald-200 border border-emerald-500/20 hover:bg-emerald-500/15'
                  : 'clean-glass-pill hover:bg-white/[0.08] text-white'
              } flex items-center justify-center gap-2 disabled:opacity-60`}
            >
              {analyzingPlatform ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>Contacting LinkedIn...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isLinkedInConnected ? 'Connect Another LinkedIn Account' : 'Connect LinkedIn Account'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Enter Dashboard Action Bar */}
        <div className="mt-8 p-5 sm:p-6 rounded-[28px] clean-liquid-glass flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <ShieldCheck className={`w-5 h-5 shrink-0 ${accounts.length > 0 ? 'text-white' : 'text-zinc-600'}`} />
            <div>
              <p className="text-xs font-medium text-white">
                {accounts.length > 0
                  ? `${accounts.length} LinkedIn Channel(s) Connected & Profiled`
                  : 'Connect at least 1 LinkedIn channel to proceed'}
              </p>
              <p className="text-[11px] text-zinc-500">
                You can configure routing tags, precision groups, or add more profiles anytime in dashboard settings.
              </p>
            </div>
          </div>

          <button
            onClick={() => onComplete(accounts)}
            disabled={accounts.length === 0}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <span>Enter Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-20 w-full px-10 py-6 text-center text-[11px] text-zinc-600 font-mono pointer-events-none">
        Pigeon • Commit to your socials
      </footer>

      {/* LinkedIn Developer Credentials Setup Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-lg clean-liquid-glass p-8 space-y-6">
            
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">
                    Connect LinkedIn Developer App
                  </h4>
                  <p className="text-[11px] text-zinc-400">OAuth 2.0 Client Credentials (Free)</p>
                </div>
              </div>
              <button 
                data-testid="close-modal"
                onClick={() => setShowConfigModal(false)}
                className="text-zinc-400 hover:text-white cursor-pointer p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-2.5 text-xs text-zinc-300">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white text-[11px] uppercase tracking-wider">
                  How to get your free credentials:
                </span>
                <a
                  href="https://www.linkedin.com/developers/apps"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-zinc-200 hover:text-white underline cursor-pointer"
                >
                  <span>Open LinkedIn Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-zinc-400 font-light leading-relaxed">
                <li>Create or select an App in the <strong className="text-white">LinkedIn Developer Portal</strong>.</li>
                <li>Under the <span className="text-white">Products</span> tab, request: <strong className="text-white">Sign In with LinkedIn using OpenID Connect</strong> & <strong className="text-white">Share on LinkedIn</strong> (both free).</li>
                <li>Under the <span className="text-white">Auth</span> tab, add Authorized Redirect URL:</li>
                <li><code className="text-white font-mono bg-white/[0.06] px-1 rounded">http://localhost:5173/auth/callback/linkedin</code></li>
                <li>Copy your <span className="text-white font-semibold">Client ID</span> and <span className="text-white font-semibold">Client Secret</span> below.</li>
              </ol>
            </div>

            {/* Credential Inputs */}
            <form onSubmit={handleSaveAndConnect} className="space-y-4">
              {modalError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                  {modalError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-[11px] text-zinc-400 font-mono">
                  LinkedIn Client ID:
                </label>
                <input
                  type="text"
                  value={clientIdInput}
                  onChange={(e) => setClientIdInput(e.target.value)}
                  placeholder="Paste LinkedIn Client ID"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] text-zinc-400 font-mono">
                  LinkedIn Client Secret:
                </label>
                <input
                  type="password"
                  value={clientSecretInput}
                  onChange={(e) => setClientSecretInput(e.target.value)}
                  placeholder="••••••••••••••••••••••••"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none font-mono"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
                  Saved locally to server/.env
                </span>

                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-6 py-2.5 rounded-xl liquid-bw-btn text-xs font-semibold cursor-pointer flex items-center gap-2"
                >
                  {modalLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving & Authorizing...</span>
                    </>
                  ) : (
                    <>
                      <span>Save & Authorize LinkedIn</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

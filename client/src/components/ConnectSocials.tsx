import React, { useState, useEffect } from 'react';
import { Plus, ArrowRight, ShieldCheck, RefreshCw, KeyRound, X, ExternalLink, LogOut, Edit2, Check } from 'lucide-react';
import { XIcon, LinkedinIcon } from './icons';
import { GlassLogosBackground } from './GlassLogosBackground';
import { LiquidInkCanvas } from './LiquidInkCanvas';
import { PigeonLogo } from './PigeonTransition';

interface SocialAccount {
  id: string;
  platform: 'X' | 'LINKEDIN';
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
  const [analyzingPlatform, setAnalyzingPlatform] = useState<'X' | 'LINKEDIN' | null>(null);
  const [injectingPlatform, setInjectingPlatform] = useState<'X' | 'LINKEDIN' | null>(null);

  // Platform Setup Modal State
  const [modalPlatform, setModalPlatform] = useState<'X' | 'LINKEDIN' | null>(null);
  const [clientIdInput, setClientIdInput] = useState('');
  const [clientSecretInput, setClientSecretInput] = useState('');
  const [sandboxHandle, setSandboxHandle] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // X Coming Soon Notice
  const [xNotice, setXNotice] = useState(false);

  const handleConnectSandboxX = async () => {
    if (!sandboxHandle.trim()) {
      setModalError('Please enter your real X handle (e.g. @your_x_handle)');
      return;
    }
    setModalLoading(true);
    setModalError(null);
    try {
      const res = await fetch('http://localhost:5000/api/socials/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          platform: 'X',
          handle: sandboxHandle.trim(),
          name: user?.name || user?.username,
        }),
      });
      const data = await res.json();
      if (res.ok && data.account) {
        setInjectingPlatform('X');
        setAccounts((prev) => [...prev.filter((a) => a.id !== data.account.id), data.account]);
        setModalPlatform(null);
        setTimeout(() => setInjectingPlatform(null), 2400);
      } else {
        throw new Error(data.error || 'Failed to connect X account');
      }
    } catch (err: any) {
      setModalError(err.message || 'Connection error');
    } finally {
      setModalLoading(false);
    }
  };

  // Edit Handle State
  const [editingHandleId, setEditingHandleId] = useState<string | null>(null);
  const [editingHandleVal, setEditingHandleVal] = useState('');

  const handleSaveCustomHandle = async (accountId: string) => {
    if (!editingHandleVal.trim()) return;
    try {
      const res = await fetch(`http://localhost:5000/api/socials/${accountId}/handle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: editingHandleVal.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAccounts((prev) =>
          prev.map((a) => (a.id === accountId ? { ...a, handle: data.account.handle } : a))
        );
      }
    } catch (err) {
      console.warn('Failed to update handle:', err);
    } finally {
      setEditingHandleId(null);
    }
  };

  // Sync initial accounts passed from parent
  useEffect(() => {
    if (initialAccounts && initialAccounts.length > 0) {
      setAccounts(initialAccounts);
    }
  }, [initialAccounts]);

  // Listen for popup auth completion
  useEffect(() => {
    const handleAuthMessage = (e: MessageEvent) => {
      if (e.data?.type === 'PIGEON_LINKEDIN_CONNECTED' && e.data.account) {
        setAccounts((prev) => [...prev.filter((a) => a.id !== e.data.account.id), e.data.account]);
        setAnalyzingPlatform(null);
      }
    };
    window.addEventListener('message', handleAuthMessage);
    return () => window.removeEventListener('message', handleAuthMessage);
  }, []);

  // Initiate real OAuth for platform
  const handleConnectClick = async (platform: 'X' | 'LINKEDIN') => {
    setAnalyzingPlatform(platform);
    setModalError(null);

    // If LinkedIn: By default, sign out of LinkedIn session first so user can choose ANY account
    let authWin: Window | null = null;
    if (platform === 'LINKEDIN') {
      authWin = window.open(
        'https://www.linkedin.com/m/logout',
        'PigeonLinkedInAuth',
        'width=620,height=750,menubar=no,toolbar=no'
      );
    }

    try {
      const res = await fetch(`http://localhost:5000/api/socials/auth-url/${platform.toLowerCase()}?userId=${user?.id || 'default'}`);
      const data = await res.json();

      if (data.configured && data.url) {
        setInjectingPlatform(platform);

        if (platform === 'LINKEDIN' && authWin) {
          // Allow 1.1s for LinkedIn logout to clear the session cookie, then navigate to OAuth login
          setTimeout(() => {
            try {
              authWin!.location.href = data.url;
            } catch {
              authWin!.location.assign(data.url);
            }
          }, 1100);

          // Monitor for popup close to refresh accounts
          const checkTimer = setInterval(async () => {
            if (authWin!.closed) {
              clearInterval(checkTimer);
              setAnalyzingPlatform(null);
              if (user?.id) {
                const accRes = await fetch(`http://localhost:5000/api/socials/accounts?userId=${user.id}`);
                const accData = await accRes.json();
                if (accData.success && accData.accounts) {
                  setAccounts(accData.accounts);
                }
              }
            }
          }, 1000);
          return;
        }

        // Standard direct redirect for X
        window.location.href = data.url;
        return;
      }

      if (authWin) authWin.close();
      // Not configured in server/.env yet -> open setup modal
      setModalPlatform(platform);
      setClientIdInput('');
      setClientSecretInput('');
    } catch (err: any) {
      if (authWin) authWin.close();
      console.warn(`Error contacting auth URL for ${platform}:`, err);
      setModalPlatform(platform);
    } finally {
      if (platform !== 'LINKEDIN') {
        setAnalyzingPlatform(null);
      }
    }
  };

  // Save credentials and immediately initiate OAuth redirect
  const handleSaveAndConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalPlatform || !clientIdInput.trim() || !clientSecretInput.trim()) {
      setModalError('Both Client ID and Client Secret are required.');
      return;
    }

    setModalLoading(true);
    setModalError(null);

    try {
      // 1. Save credentials to server/.env
      const configRes = await fetch('http://localhost:5000/api/socials/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: modalPlatform,
          clientId: clientIdInput.trim(),
          clientSecret: clientSecretInput.trim(),
        }),
      });

      const configData = await configRes.json();
      if (!configRes.ok || !configData.success) {
        throw new Error(configData.error || `Failed to configure ${modalPlatform}`);
      }

      // 2. Fetch fresh OAuth URL and redirect
      const urlRes = await fetch(`http://localhost:5000/api/socials/auth-url/${modalPlatform.toLowerCase()}?userId=${user?.id || 'default'}`);
      const urlData = await urlRes.json();

      if (urlData.url) {
        window.location.href = urlData.url;
      } else {
        throw new Error('Failed to obtain authorization URL');
      }
    } catch (err: any) {
      setModalError(err.message || 'Error configuring platform credentials');
      setModalLoading(false);
    }
  };

  const isXConnected = accounts.some(a => a.platform === 'X');
  const isLinkedInConnected = accounts.some(a => a.platform === 'LINKEDIN');

  return (
    <div className="relative min-h-screen w-full bg-black text-slate-100 flex flex-col justify-between overflow-x-hidden select-none font-sans">
      
      {/* 3D Polished Metal Platform Logos Floating in Background */}
      <GlassLogosBackground />

      {/* Header with Official Pigeon Logo */}
      <header className="relative z-20 w-full px-10 py-8 flex items-center justify-between">
        <PigeonLogo withText={true} className="w-8 h-8" />
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 text-xs text-zinc-300 font-mono px-3.5 py-1.5 rounded-full clean-glass-pill">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>GitHub: {user?.username || 'dev'}</span>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-2 text-xs font-mono text-zinc-300 hover:text-white px-4 py-2 rounded-full clean-glass-pill hover:bg-white/[0.1] transition-all cursor-pointer"
              title="Log out and return to Sign In"
            >
              <LogOut className="w-3.5 h-3.5 text-zinc-400" />
              <span>Log Out</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Liquid Glass Container */}
      <main className="relative z-20 max-w-4xl mx-auto w-full px-6 py-6 my-auto">
        
        {/* Title & Stage */}
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium clean-glass-pill text-zinc-300 uppercase tracking-wider mb-3">
            Step 2 of 2: Connect Socials
          </span>
          <h2 className="text-3xl sm:text-4xl font-light text-white tracking-tight">
            Connect your developer channels
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-zinc-400 font-light leading-relaxed">
            Connect at least <strong className="text-zinc-200 font-medium">one account</strong>. Pigeon extracts your unique writing style to match your voice on every post.
          </p>
        </div>

        {/* 2 Sheer Liquid Glass Cards for X and LinkedIn */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Connect X (Twitter) Card with Liquid Ink Contamination */}
          <div 
            className={`relative p-8 rounded-[32px] flex flex-col justify-between overflow-hidden transition-all duration-700 ${
              isXConnected ? 'pale-green-water-glass' : 'clean-liquid-glass'
            }`}
          >
            {/* Live Fluid Ink Injection Canvas (spreading green liquid in water) */}
            <LiquidInkCanvas 
              isInjecting={injectingPlatform === 'X'}
              isContaminated={isXConnected}
              color="52, 211, 153"
            />

            <div className="relative z-10">
              {/* Polished Chrome Badge for X */}
              <div className="w-12 h-12 rounded-2xl clean-glass-pill flex items-center justify-center text-white mb-5">
                <XIcon className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-medium text-white tracking-tight">X (Twitter)</h3>
              <p className="mt-1 text-xs text-zinc-400 font-light leading-relaxed">
                Best for rapid #buildinpublic updates, code snippet cards, and engineering threads.
              </p>

              {/* Connected X accounts list */}
              <div className="mt-6 space-y-3">
                {accounts.filter(a => a.platform === 'X').map(acc => (
                  <div 
                    key={acc.id} 
                    className="p-4 rounded-2xl bg-white/[0.02] border border-emerald-400/20 backdrop-blur-md transition-all duration-500"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400/80 animate-pulse"></span>
                        {editingHandleId === acc.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={editingHandleVal}
                              onChange={(e) => setEditingHandleVal(e.target.value)}
                              className="bg-black/60 border border-emerald-400/40 rounded px-2 py-0.5 text-xs text-white focus:outline-none font-mono"
                              placeholder="@handle"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveCustomHandle(acc.id)}
                              className="text-emerald-300 hover:text-white p-1 cursor-pointer"
                              title="Save handle"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white">{acc.handle}</span>
                            <button
                              onClick={() => {
                                setEditingHandleId(acc.id);
                                setEditingHandleVal(acc.handle);
                              }}
                              className="text-zinc-500 hover:text-zinc-200 p-0.5 cursor-pointer"
                              title="Edit handle display"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-emerald-300/80 font-mono uppercase tracking-wider">
                        Connected
                      </span>
                    </div>

                    {acc.toneProfile && (
                      <div className="mt-2.5 pt-2 border-t border-emerald-500/10 text-[11px] text-zinc-300">
                        <span className="text-emerald-400 font-mono">Tone: </span>
                        {acc.toneProfile.voice}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 relative z-10">
              <button
                onClick={() => setXNotice(true)}
                className="w-full py-3 px-5 rounded-2xl text-xs font-medium clean-glass-pill hover:bg-white/[0.08] text-zinc-300 hover:text-white transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Connect X Account</span>
              </button>

              {xNotice && (
                <div className="mt-3 p-3 rounded-2xl bg-white/[0.03] border border-white/10 text-center text-[11px] text-zinc-300 font-mono transition-all animate-fadeIn">
                  X integration has not been implemented yet.
                </div>
              )}
            </div>
          </div>

          {/* Connect LinkedIn Card with Liquid Ink Contamination */}
          <div 
            className={`relative p-8 rounded-[32px] flex flex-col justify-between overflow-hidden transition-all duration-700 ${
              isLinkedInConnected ? 'pale-green-water-glass' : 'clean-liquid-glass'
            }`}
          >
            {/* Live Fluid Ink Injection Canvas */}
            <LiquidInkCanvas 
              isInjecting={injectingPlatform === 'LINKEDIN'}
              isContaminated={isLinkedInConnected}
              color="52, 211, 153"
            />

            <div className="relative z-10">
              {/* Polished Chrome Badge for LinkedIn */}
              <div className="w-12 h-12 rounded-2xl clean-glass-pill flex items-center justify-center text-white mb-5">
                <LinkedinIcon className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-medium text-white tracking-tight">LinkedIn</h3>
              <p className="mt-1 text-xs text-zinc-400 font-light leading-relaxed">
                Ideal for career milestones, architectural breakdowns, and tech leadership stories.
              </p>

              {/* Connected LinkedIn accounts list */}
              <div className="mt-6 space-y-3">
                {accounts.filter(a => a.platform === 'LINKEDIN').map(acc => (
                  <div 
                    key={acc.id} 
                    className="p-4 rounded-2xl bg-white/[0.02] border border-emerald-400/20 backdrop-blur-md transition-all duration-500"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400/80 animate-pulse"></span>
                        <span className="text-sm font-medium text-white">{acc.name}</span>
                      </div>
                      <span className="text-[10px] text-emerald-300/80 font-mono uppercase tracking-wider">
                        Connected
                      </span>
                    </div>

                    {acc.toneProfile && (
                      <div className="mt-2.5 pt-2 border-t border-emerald-500/10 text-[11px] text-zinc-300">
                        <span className="text-emerald-400 font-mono">Tone: </span>
                        {acc.toneProfile.voice}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 relative z-10 space-y-2">
              <button
                onClick={() => handleConnectClick('LINKEDIN')}
                disabled={analyzingPlatform !== null}
                className={`w-full py-3 px-5 rounded-2xl text-xs font-medium transition-all cursor-pointer ${
                  isLinkedInConnected 
                    ? 'bg-emerald-500/10 text-emerald-200 border border-emerald-500/20 hover:bg-emerald-500/15'
                    : 'clean-glass-pill hover:bg-white/[0.08] text-white'
                } flex items-center justify-center gap-2 disabled:opacity-60`}
              >
                {analyzingPlatform === 'LINKEDIN' ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>Connecting to LinkedIn...</span>
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

        </div>

        {/* Enter Dashboard Liquid Glass Action Bar */}
        <div className="mt-8 p-5 sm:p-6 rounded-[28px] clean-liquid-glass flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <ShieldCheck className={`w-5 h-5 shrink-0 ${accounts.length > 0 ? 'text-white' : 'text-zinc-600'}`} />
            <div>
              <p className="text-xs font-medium text-white">
                {accounts.length > 0
                  ? `${accounts.length} Social Channel(s) Connected & Profiled`
                  : 'Connect at least 1 social channel to proceed'}
              </p>
              <p className="text-[11px] text-zinc-500">
                You can configure groups, tags, or add more accounts anytime from dashboard settings.
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

      {/* Platform OAuth Credentials Setup Modal */}
      {modalPlatform && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-lg clean-liquid-glass p-8 space-y-6">
            
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">
                    Connect {modalPlatform === 'X' ? 'X (Twitter)' : 'LinkedIn'} Developer App
                  </h4>
                  <p className="text-[11px] text-zinc-400">OAuth 2.0 Client Credentials</p>
                </div>
              </div>
              <button 
                onClick={() => setModalPlatform(null)}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-2.5 text-xs text-zinc-300">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white text-[11px] uppercase tracking-wider">
                  How to get your {modalPlatform} credentials:
                </span>
                <a
                  href={modalPlatform === 'X' ? 'https://developer.x.com/en/portal/dashboard' : 'https://www.linkedin.com/developers/apps'}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-zinc-200 hover:text-white underline cursor-pointer"
                >
                  <span>Open {modalPlatform} Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {modalPlatform === 'X' ? (
                <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-zinc-400 font-light leading-relaxed">
                  <li>In your Project & App, click <strong className="text-white">User authentication settings &rarr; Set up</strong>.</li>
                  <li>Permissions: Select <strong className="text-white">Read and write</strong>.</li>
                  <li>Type of App: Select <strong className="text-white">Web App, Automated App or Bot</strong>.</li>
                  <li>Callback URI: <code className="text-white font-mono bg-white/[0.06] px-1 rounded">http://localhost:5173/auth/callback/x</code></li>
                  <li>Website URL: <code className="text-white font-mono bg-white/[0.06] px-1 rounded">https://github.com</code> (X requires a public https:// URL here)</li>
                  <li>Save and copy your <span className="text-white font-semibold">OAuth 2.0 Client ID</span> and <span className="text-white font-semibold">Client Secret</span>.</li>
                </ol>
              ) : (
                <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-zinc-400 font-light leading-relaxed">
                  <li>Create or select an App in the <strong className="text-white">LinkedIn Developer Portal</strong>.</li>
                  <li>Under the <span className="text-white">Products</span> tab, request: <strong className="text-white">Sign In with LinkedIn using OpenID Connect</strong> & <strong className="text-white">Share on LinkedIn</strong>.</li>
                  <li>Under the <span className="text-white">Auth</span> tab, add Authorized Redirect URL:</li>
                  <li><code className="text-white font-mono bg-white/[0.06] px-1 rounded">http://localhost:5173/auth/callback/linkedin</code></li>
                  <li>Copy your <span className="text-white font-semibold">Client ID</span> and <span className="text-white font-semibold">Client Secret</span>.</li>
                </ol>
              )}
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
                  {modalPlatform} Client ID:
                </label>
                <input
                  type="text"
                  value={clientIdInput}
                  onChange={(e) => setClientIdInput(e.target.value)}
                  placeholder={`Paste ${modalPlatform} Client ID`}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] text-zinc-400 font-mono">
                  {modalPlatform} Client Secret:
                </label>
                <input
                  type="password"
                  value={clientSecretInput}
                  onChange={(e) => setClientSecretInput(e.target.value)}
                  placeholder={`••••••••••••••••••••••••`}
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
                      <span>Save & Authorize {modalPlatform}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Sandbox Mode for X (Free Testing without X Pay-Per-Use fees) */}
            {modalPlatform === 'X' && (
              <div className="pt-4 border-t border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-zinc-300 font-medium">
                    Or Connect Real Handle (Free Sandbox Mode):
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">No X API fees</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={sandboxHandle}
                    onChange={(e) => setSandboxHandle(e.target.value)}
                    placeholder="e.g. @your_real_x_handle"
                    className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleConnectSandboxX}
                    disabled={modalLoading}
                    className="px-4 py-2 rounded-xl liquid-bw-btn text-xs font-semibold cursor-pointer shrink-0 flex items-center gap-1.5"
                  >
                    <span>Connect Handle</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[10px] text-zinc-500 leading-relaxed font-light">
                  X recently retired its free API tier in favor of pay-per-use credits. Free Sandbox mode allows you to link your actual handle, run Gemini tone profiling, and test the full #Pigeon commit automation without paying X fees.
                </p>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

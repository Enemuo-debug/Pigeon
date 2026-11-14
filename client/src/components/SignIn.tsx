import React, { useState } from 'react';
import { GlassLogosBackground } from './GlassLogosBackground';
import { GithubIcon } from './icons';
import { KeyRound, X, ArrowRight, RefreshCw, ExternalLink, ShieldCheck } from 'lucide-react';
import { PigeonLogo } from './PigeonTransition';
import { API_BASE } from '../config/api';

interface SignInProps {
  onLoginSuccess: (userData: any) => void;
  onBackToHome?: () => void;
}

export const SignIn: React.FC<SignInProps> = ({ onLoginSuccess: _onLoginSuccess, onBackToHome }) => {
  const [loading, setLoading] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [clientIdInput, setClientIdInput] = useState('');
  const [clientSecretInput, setClientSecretInput] = useState('');
  const [configError, setConfigError] = useState<string | null>(null);

  const handleGitHubButtonClick = async () => {
    setLoading(true);
    setConfigError(null);

    try {
      const res = await fetch(`${API_BASE}/api/auth/github/url`);
      const data = await res.json();

      if (data.configured && data.url) {
        // Redirect directly to GitHub OAuth
        window.location.href = data.url;
        return;
      }

      // If credentials aren't set in server/.env, open the OAuth Setup modal
      setShowConfigModal(true);
    } catch (err: any) {
      console.warn('Auth check failed:', err);
      setShowConfigModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAndAuthorize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientIdInput.trim() || !clientSecretInput.trim()) {
      setConfigError('Please enter both Client ID and Client Secret.');
      return;
    }

    setLoading(true);
    setConfigError(null);

    try {
      const res = await fetch(`${API_BASE}/api/auth/github/configure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: clientIdInput.trim(),
          clientSecret: clientSecretInput.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save GitHub credentials');
      }

      if (data.url) {
        // Redirect directly to GitHub OAuth!
        window.location.href = data.url;
      }
    } catch (err: any) {
      setConfigError(err.message || 'Error configuring GitHub OAuth');
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-y-auto overflow-x-hidden bg-black flex flex-col justify-between items-center select-none font-sans">
      
      {/* Big Polished Metal 3D Logos (GitHub, X, LinkedIn) Floating at the Back */}
      <GlassLogosBackground />

      {/* Top Header with Official Pigeon Logo */}
      <header className="relative z-20 w-full px-4 sm:px-10 py-4 sm:py-8 flex items-center justify-between">
        <PigeonLogo withText={true} className="w-8 h-8" />
        {onBackToHome && (
          <button
            onClick={onBackToHome}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full clean-glass-pill hover:bg-white/[0.08] text-xs font-mono text-zinc-300 hover:text-white transition-all cursor-pointer"
          >
            ← Back to Overview
          </button>
        )}
      </header>

      {/* Center Liquid Glass Card (Crisp & Sheer, Zero Ambient Glow) */}
      <div className="relative z-20 my-auto w-full max-w-[560px] px-4 sm:px-6 py-6">
        <div className="relative p-7 sm:p-12 md:p-14 clean-liquid-glass flex flex-col items-center text-center transition-all duration-300">
          
          {/* Header Title */}
          <div className="flex flex-col items-center mb-4">
            <h1 className="text-2xl sm:text-4xl font-light tracking-tight text-white">
              Sign In
            </h1>
            <span className="mt-1.5 text-xs font-mono text-zinc-400">
              Commit to your socials
            </span>
          </div>

          {/* Subtext */}
          <p className="text-xs sm:text-sm text-zinc-400 font-light leading-relaxed max-w-sm mb-7 sm:mb-10">
            Turn your GitHub commits into authentic, high-impact updates on X and LinkedIn—with zero context switching.
          </p>

          {/* Circular GitHub Action Button (No borders, no glow, pure crisp surface) */}
          <div className="relative flex flex-col items-center justify-center">
            <button
              onClick={handleGitHubButtonClick}
              disabled={loading}
              className="w-20 h-20 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer group disabled:opacity-75"
              title="Sign in with GitHub"
            >
              {loading ? (
                <RefreshCw className="w-8 h-8 animate-spin text-black" />
              ) : (
                <GithubIcon className="w-9 h-9 transition-transform duration-200 group-hover:scale-110" />
              )}
            </button>

            <span className="mt-4 text-[11px] text-zinc-400 font-medium tracking-wide uppercase">
              {loading ? 'Connecting to GitHub...' : 'Sign in with GitHub'}
            </span>
          </div>

        </div>
      </div>

      {/* Bottom Footer */}
      <footer className="relative z-20 w-full px-10 py-6 flex items-center justify-center pointer-events-none">
        <span className="text-[11px] text-zinc-600 font-mono">
          Pigeon • Commit to your socials
        </span>
      </footer>

      {/* GitHub OAuth Setup Dialog (No mock bypass - authentic GitHub credentials only) */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-lg clean-liquid-glass p-8 space-y-6">
            
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">GitHub OAuth Setup</h4>
                  <p className="text-[11px] text-zinc-400">Connect your real GitHub developer account</p>
                </div>
              </div>
              <button 
                onClick={() => setShowConfigModal(false)}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-2.5 text-xs text-zinc-300">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white text-[11px] uppercase tracking-wider">
                  How to get your credentials (2 minutes):
                </span>
                <a
                  href="https://github.com/settings/developers"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-zinc-200 hover:text-white underline cursor-pointer"
                >
                  <span>Open GitHub</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-zinc-400 font-light leading-relaxed">
                <li>Click <strong className="text-white">New OAuth App</strong>.</li>
                <li>Set <span className="text-zinc-200 font-mono">Application Name:</span> <strong className="text-white">Pigeon</strong></li>
                <li>Set <span className="text-zinc-200 font-mono">Homepage URL:</span> <code className="text-white font-mono bg-white/[0.06] px-1 rounded">http://localhost:5173</code></li>
                <li>Set <span className="text-zinc-200 font-mono">Authorization callback URL:</span> <code className="text-white font-mono bg-white/[0.06] px-1 rounded">http://localhost:5173</code></li>
                <li>Click <strong className="text-white">Register application</strong>, then copy your <span className="text-white">Client ID</span> and generate a <span className="text-white">Client Secret</span>.</li>
              </ol>
            </div>

            {/* Credential Inputs */}
            <form onSubmit={handleSaveAndAuthorize} className="space-y-4">
              {configError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                  {configError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-[11px] text-zinc-400 font-mono">
                  GitHub Client ID:
                </label>
                <input
                  type="text"
                  value={clientIdInput}
                  onChange={(e) => setClientIdInput(e.target.value)}
                  placeholder="e.g. Ov23li..."
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] text-zinc-400 font-mono">
                  GitHub Client Secret:
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
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl liquid-bw-btn text-xs font-semibold cursor-pointer flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving & Connecting...</span>
                    </>
                  ) : (
                    <>
                      <span>Save & Sign In</span>
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

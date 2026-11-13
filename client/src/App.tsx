import { useState, useEffect } from 'react';
import { SignIn } from './components/SignIn';
import { ConnectSocials } from './components/ConnectSocials';
import { Dashboard } from './components/Dashboard';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { GlassLogosBackground } from './components/GlassLogosBackground';
import { PigeonTransition } from './components/PigeonTransition';
import { API_BASE } from './config/api';

// Module-level deduplication cache to prevent React StrictMode from re-exchanging single-use OAuth codes
const processedOAuthCodes = new Set<string>();

export function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [socialAccounts, setSocialAccounts] = useState<any[]>([]);
  const [stage, setStage] = useState<'signin' | 'socials' | 'dashboard'>('signin');
  const [oauthExchanging, setOauthExchanging] = useState(false);
  const [oauthMessage, setOauthMessage] = useState('Authenticating...');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isEnteringDashboard, setIsEnteringDashboard] = useState(false);

  // Listen for popup auth completion
  useEffect(() => {
    const handleAuthMessage = (e: MessageEvent) => {
      if (e.data?.type === 'PIGEON_LINKEDIN_CONNECTED' && e.data.account) {
        setSocialAccounts((prev) => [...prev.filter((a) => a.id !== e.data.account.id), e.data.account]);
        setStage('dashboard');
      }
    };
    window.addEventListener('message', handleAuthMessage);
    return () => window.removeEventListener('message', handleAuthMessage);
  }, []);

  useEffect(() => {
    const handleAuthInit = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const pathname = window.location.pathname;
      const forceLogout = urlParams.get('logout') || urlParams.get('reset');

      // Deduplicate single-use authorization codes across React StrictMode / double renders
      if (code) {
        if (processedOAuthCodes.has(code)) {
          console.warn('OAuth code already in-flight or exchanged, skipping duplicate execution');
          return;
        }
        processedOAuthCodes.add(code);
      }

      // If user navigated with ?logout or ?reset, clear local token immediately
      if (forceLogout) {
        localStorage.removeItem('pigeon_token');
        window.history.replaceState({}, document.title, '/');
        setStage('signin');
        return;
      }

      // Check for persisted token first
      const storedToken = localStorage.getItem('pigeon_token');
      let activeUser: any = null;

      if (storedToken) {
        try {
          const res = await fetch(`${API_BASE}/api/auth/me`, {
            headers: { Authorization: `Bearer ${storedToken}` },
          });

          if (res.ok) {
            const data = await res.json();
            if (data.user) {
              activeUser = data.user;
              setCurrentUser(data.user);
              if (data.user.socialAccounts) {
                setSocialAccounts(data.user.socialAccounts);
              }
            }
          } else {
            localStorage.removeItem('pigeon_token');
          }
        } catch (err) {
          console.warn('Session verification error:', err);
          localStorage.removeItem('pigeon_token');
        }
      }

      // 1. Social Callback: X (Twitter)
      if (pathname.includes('/auth/callback/x') && code && state) {
        setOauthExchanging(true);
        setOauthMessage('Connecting X account & profiling developer tone...');
        window.history.replaceState({}, document.title, '/');

        try {
          const res = await fetch(`${API_BASE}/api/socials/callback/x`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, state }),
          });

          const data = await res.json();
          if (!res.ok || !data.success) {
            throw new Error(data.error || 'Failed to connect X account');
          }

          setSocialAccounts((prev) => [...prev.filter((a) => a.id !== data.account.id), data.account]);
          setStage(activeUser || currentUser ? 'dashboard' : 'socials');
          return;
        } catch (err: any) {
          setAuthError(err.message || 'X OAuth connection failed');
          return;
        } finally {
          setOauthExchanging(false);
        }
      }

      // 2. Social Callback: LinkedIn
      if (pathname.includes('/auth/callback/linkedin') && code && state) {
        setOauthExchanging(true);
        setOauthMessage('Connecting LinkedIn account & extracting leadership voice...');
        window.history.replaceState({}, document.title, '/');

        try {
          const res = await fetch(`${API_BASE}/api/socials/callback/linkedin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, state }),
          });

          const data = await res.json();
          if (!res.ok || !data.success) {
            throw new Error(data.error || 'Failed to connect LinkedIn account');
          }

          setSocialAccounts((prev) => [...prev.filter((a) => a.id !== data.account.id), data.account]);
          setStage(activeUser || currentUser ? 'dashboard' : 'socials');
          return;
        } catch (err: any) {
          setAuthError(err.message || 'LinkedIn OAuth connection failed');
          return;
        } finally {
          setOauthExchanging(false);
        }
      }

      // 3. GitHub OAuth Callback
      if (code) {
        setOauthExchanging(true);
        setOauthMessage('Authenticating with GitHub & syncing repositories...');
        window.history.replaceState({}, document.title, '/');

        try {
          const res = await fetch(`${API_BASE}/api/auth/github/callback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code }),
          });

          const data = await res.json();
          if (!res.ok || !data.success) {
            throw new Error(data.error || 'GitHub authentication failed');
          }

          localStorage.setItem('pigeon_token', data.token);
          handleLoginSuccess(data.user);
          return;
        } catch (err: any) {
          console.error('OAuth callback error:', err);
          setAuthError(err.message || 'Failed to complete GitHub authorization');
          return;
        } finally {
          setOauthExchanging(false);
        }
      }

      // 4. Default stage resolution from verified user
      if (activeUser) {
        if (activeUser.socialAccounts && activeUser.socialAccounts.length > 0) {
          setStage('dashboard');
        } else {
          setStage('socials');
        }
      } else {
        setStage('signin');
      }
    };

    handleAuthInit();
  }, []);

  const handleLoginSuccess = (user: any) => {
    setCurrentUser(user);
    if (user.socialAccounts && user.socialAccounts.length > 0) {
      setSocialAccounts(user.socialAccounts);
      setIsEnteringDashboard(true);
    } else {
      setStage('socials');
    }
  };

  const handleSocialsComplete = (accounts: any[]) => {
    setSocialAccounts(accounts);
    setIsEnteringDashboard(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('pigeon_token');
    processedOAuthCodes.clear();
    setCurrentUser(null);
    setSocialAccounts([]);
    window.location.href = '/?reset=true';
  };

  // Only show when actively exchanging a real OAuth code
  if (oauthExchanging) {
    return (
      <div className="relative w-screen h-screen overflow-hidden bg-black flex flex-col justify-center items-center font-sans select-none">
        <GlassLogosBackground />
        
        <div className="relative z-20 p-10 rounded-[32px] clean-liquid-glass max-w-md w-full mx-4 flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl clean-glass-pill flex items-center justify-center text-white">
            <RefreshCw className="w-6 h-6 animate-spin" />
          </div>
          <div>
            <h3 className="text-lg font-light text-white tracking-tight">{oauthMessage}</h3>
            <p className="mt-1 text-xs text-zinc-400 font-light">
              Securing connection & establishing cryptographic tokens...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error screen if any OAuth flow encounters an issue
  if (authError) {
    return (
      <div className="relative w-screen h-screen overflow-hidden bg-black flex flex-col justify-center items-center font-sans select-none">
        <GlassLogosBackground />
        
        <div className="relative z-20 p-10 rounded-[32px] clean-liquid-glass max-w-md w-full mx-4 flex flex-col items-center text-center space-y-5">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/20 flex items-center justify-center text-white">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-light text-white tracking-tight">Connection Issue</h3>
            <p className="mt-2 text-xs text-zinc-400 font-light leading-relaxed">
              {authError}
            </p>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={() => {
                setAuthError(null);
                handleLogout();
              }}
              className="px-5 py-2.5 rounded-full clean-glass-pill hover:bg-white/[0.08] text-xs font-medium text-zinc-300 hover:text-white transition-all cursor-pointer"
            >
              Log Out
            </button>
            <button
              onClick={() => {
                setAuthError(null);
                if (!currentUser) {
                  handleLogout();
                } else {
                  setStage('socials');
                }
              }}
              className="px-6 py-2.5 rounded-full liquid-bw-btn text-xs font-semibold cursor-pointer"
            >
              {currentUser ? 'Return to Channels' : 'Back to Sign In'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Pure Pigeon drawing animation (zero text, zero loading bars)
  if (isEnteringDashboard) {
    return (
      <PigeonTransition
        onComplete={() => {
          setIsEnteringDashboard(false);
          setStage('dashboard');
        }}
      />
    );
  }

  if (stage === 'signin') {
    return <SignIn onLoginSuccess={handleLoginSuccess} />;
  }

  if (stage === 'socials') {
    return (
      <ConnectSocials 
        user={currentUser} 
        onComplete={handleSocialsComplete} 
        onLogout={handleLogout}
        initialAccounts={socialAccounts}
      />
    );
  }

  return (
    <Dashboard
      user={currentUser}
      accounts={socialAccounts}
      onLogout={handleLogout}
    />
  );
}

export default App;

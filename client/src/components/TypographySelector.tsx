import React, { useState, useEffect } from 'react';
import { Check, X, SlidersHorizontal } from 'lucide-react';

export type TypographyTheme = 
  | 'default'
  | 'tactile-hardware'
  | 'leica-optical'
  | 'aerodynamic-slipstream'
  | 'satoshi-modern';

interface ThemeOption {
  id: TypographyTheme;
  name: string;
  badge?: string;
  tagline: string;
  headingFont: string;
  bodyFont: string;
  monoFont: string;
  storyFont: string;
  description: string;
  vibe: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'default',
    name: 'Current System',
    badge: 'Baseline',
    tagline: 'Inter + JetBrains Mono',
    headingFont: 'Inter',
    bodyFont: 'Inter',
    monoFont: 'JetBrains Mono',
    storyFont: 'Inter',
    description: 'The baseline geometric sans and code monospace foundation.',
    vibe: 'Neutral, clean Web2 SaaS precision',
  },
  {
    id: 'tactile-hardware',
    name: '1. Tactile Hardware & Terminal',
    badge: 'Recommended',
    tagline: 'Geist Sans + Geist Mono + Instrument Serif',
    headingFont: 'Geist Sans',
    bodyFont: 'Geist Sans',
    monoFont: 'Geist Mono',
    storyFont: 'Instrument Serif',
    description: 'Inspired by Teenage Engineering, Vercel, and Swiss industrial design. Laser-etched optical clarity with tight tracking.',
    vibe: 'Dark matte aluminum, hardware chassis, midnight flow states',
  },
  {
    id: 'leica-optical',
    name: '2. Leica Optical & Editorial',
    tagline: 'Newsreader + Plus Jakarta Sans + JetBrains',
    headingFont: 'Newsreader',
    bodyFont: 'Plus Jakarta Sans',
    monoFont: 'JetBrains Mono',
    storyFont: 'Newsreader',
    description: 'Cold optical glass and literary craft. Sharp triangular serifs echoing the aerodynamic feathers of the Pigeon mark.',
    vibe: 'Quiet authority, Leica lens barrels, literary proof of work',
  },
  {
    id: 'aerodynamic-slipstream',
    name: '3. Aerodynamic Slipstream',
    tagline: 'Space Grotesk + IBM Plex Sans + IBM Plex Mono',
    headingFont: 'Space Grotesk',
    bodyFont: 'IBM Plex Sans',
    monoFont: 'IBM Plex Mono',
    storyFont: 'IBM Plex Sans',
    description: 'Engineered man-and-machine harmony with mechanical ink traps and angular aerodynamic curves.',
    vibe: 'Stealth aircraft, brutalist apertures, tactile terminal keys',
  },
  {
    id: 'satoshi-modern',
    name: '4. Satoshi Modernist',
    badge: 'Swiss Modern',
    tagline: 'Satoshi + Geist Mono',
    headingFont: 'Satoshi',
    bodyFont: 'Satoshi',
    monoFont: 'Geist Mono',
    storyFont: 'Satoshi',
    description: 'Neo-grotesque modernist geometry with sharp terminals, clean optical weight, and Swiss architectural balance.',
    vibe: 'Modernist craft, crisp geometric punch, high-contrast legibility',
  },
];

export const TypographySelector: React.FC = () => {
  const [activeTheme, setActiveTheme] = useState<TypographyTheme>('default');
  const [isOpen, setIsOpen] = useState(false);

  // Apply theme to <body> and persist
  const applyTheme = (theme: TypographyTheme) => {
    setActiveTheme(theme);
    localStorage.setItem('pigeon_typography_theme', theme);

    // Remove all previous theme classes
    document.body.classList.remove(
      'theme-default',
      'theme-tactile-hardware',
      'theme-leica-optical',
      'theme-aerodynamic-slipstream',
      'theme-satoshi-modern'
    );

    // Add selected class
    document.body.classList.add(`theme-${theme}`);
  };

  // Initial load
  useEffect(() => {
    const saved = (localStorage.getItem('pigeon_typography_theme') as TypographyTheme) || 'default';
    if (THEME_OPTIONS.some(t => t.id === saved)) {
      applyTheme(saved);
    } else {
      applyTheme('default');
    }
  }, []);

  const currentTheme = THEME_OPTIONS.find(t => t.id === activeTheme) || THEME_OPTIONS[0];

  return (
    <>
      {/* Floating Compact Toggle Pill (Fixed at Bottom-Right) */}
      <div className="fixed bottom-5 right-5 z-50 select-none">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="group flex items-center gap-2.5 px-4 py-2.5 rounded-full clean-glass-pill hover:bg-white/[0.12] transition-all duration-300 shadow-2xl border border-white/20 text-white cursor-pointer hover:scale-105 active:scale-95"
          title="Toggle Typography System"
        >
          <div className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center font-bold text-[10px] font-mono">
            Aa
          </div>
          <div className="text-left hidden sm:block">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-300 block leading-tight">
              Type Lab
            </span>
            <span className="text-[10px] text-zinc-400 font-mono block leading-tight">
              {currentTheme.name.split('.')[0]}
            </span>
          </div>
          <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white transition-colors" />
        </button>
      </div>

      {/* Interactive Typography Selection Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-2xl clean-liquid-glass p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto border border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.95)]">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-white/[0.08]">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-white text-black flex items-center justify-center font-bold text-xs font-mono">
                    Aa
                  </div>
                  <h3 className="text-base sm:text-lg font-medium text-white tracking-tight">
                    Typography Engine // Design Systems
                  </h3>
                </div>
                <p className="mt-1 text-xs text-zinc-400 font-light leading-relaxed">
                  Switch between typographic variations in real-time. Notice how headings, telemetry, and story dispatches respond across the entire interface.
                </p>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-3"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* The 4 Font Options Grid */}
            <div className="space-y-3">
              {THEME_OPTIONS.map((theme) => {
                const isSelected = theme.id === activeTheme;
                return (
                  <div
                    key={theme.id}
                    onClick={() => applyTheme(theme.id)}
                    className={`p-4 sm:p-5 rounded-2xl cursor-pointer transition-all duration-300 border text-left relative group ${
                      isSelected
                        ? 'bg-white/[0.08] border-white/40 shadow-lg shadow-white/5'
                        : 'bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.05] hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <h4 className="text-sm font-semibold text-white tracking-tight">
                            {theme.name}
                          </h4>
                          {theme.badge && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-wider bg-white text-black font-bold">
                              {theme.badge}
                            </span>
                          )}
                          {isSelected && (
                            <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              <Check className="w-3 h-3" />
                              Active
                            </span>
                          )}
                        </div>

                        <p className="mt-0.5 text-xs text-zinc-300 font-mono">
                          {theme.tagline}
                        </p>
                      </div>

                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        isSelected 
                          ? 'border-emerald-400 bg-emerald-400 text-black' 
                          : 'border-white/20 group-hover:border-white/50'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>

                    <p className="mt-2.5 text-xs text-zinc-400 font-light leading-relaxed">
                      {theme.description}
                    </p>

                    {/* Quick Live Specimen Strip */}
                    <div className="mt-3 pt-3 border-t border-white/[0.06] flex flex-wrap items-center gap-3 text-[11px]">
                      <span className="text-zinc-500 font-mono text-[10px] uppercase">
                        Specimen:
                      </span>
                      <span className="text-zinc-300 px-2 py-0.5 rounded bg-black/40 border border-white/[0.06] font-mono text-[10px]">
                        Headings: {theme.headingFont}
                      </span>
                      <span className="text-zinc-300 px-2 py-0.5 rounded bg-black/40 border border-white/[0.06] font-mono text-[10px]">
                        Body: {theme.bodyFont}
                      </span>
                      <span className="text-zinc-300 px-2 py-0.5 rounded bg-black/40 border border-white/[0.06] font-mono text-[10px]">
                        Logs: {theme.monoFont}
                      </span>
                      {theme.storyFont !== theme.headingFont && (
                        <span className="text-zinc-300 px-2 py-0.5 rounded bg-black/40 border border-white/[0.06] font-mono text-[10px]">
                          Dispatch: {theme.storyFont}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Live Specimen Preview Section */}
            <div className="p-4 sm:p-5 rounded-2xl bg-black/60 border border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 border-b border-white/[0.06] pb-2">
                <span>LIVE PREVIEW & METRICS // {currentTheme.id.toUpperCase()}</span>
                <span className="text-emerald-400">font-variant-numeric: tabular-nums</span>
              </div>

              <div className="space-y-2">
                <div className="text-lg sm:text-xl font-bold tracking-tight text-white font-heading">
                  Write code. Get noticed. Zero effort.
                </div>
                <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                  Every time you push code, Pigeon turns your hard work into smart, natural LinkedIn posts. Build your professional engineering brand on autopilot.
                </p>
                <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] font-mono text-[11px] text-zinc-400 flex items-center justify-between">
                  <span>[DISPATCHED] SHA: 681163d // 12ms</span>
                  <span className="text-zinc-500">100% TABULAR NUMS: 1,482 IMPRESSIONS</span>
                </div>
              </div>
            </div>

            {/* Footer action */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] font-mono text-zinc-500">
                Selection auto-persists in localStorage
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="px-6 py-2 rounded-xl liquid-bw-btn text-xs font-semibold cursor-pointer"
              >
                Apply & Close
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

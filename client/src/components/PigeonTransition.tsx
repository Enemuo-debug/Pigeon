import React, { useEffect, useState } from 'react';
import { pigeonPath0, pigeonPath1, pigeonPath2, pigeonPath3 } from './pigeonPaths';

interface PigeonTransitionProps {
  onComplete: () => void;
  duration?: number; // total ms, default 8500ms (7-10s range for full appreciation)
}

export const PigeonTransition: React.FC<PigeonTransitionProps> = ({
  onComplete,
  duration = 8500,
}) => {
  const [phase, setPhase] = useState<'drawing' | 'filled' | 'fadeout'>('drawing');

  useEffect(() => {
    // Phase 1: Deliberate vector contour drawing (0s - 7.3s)
    
    // Phase 2: Silhouette fills in with liquid metallic specular bloom (7.3s - 8.1s)
    const fillTimer = setTimeout(() => {
      setPhase('filled');
    }, duration - 1200);

    // Phase 3: Dissolve transition into Dashboard (8.1s - 8.5s)
    const exitTimer = setTimeout(() => {
      setPhase('fadeout');
    }, duration - 350);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, duration);

    return () => {
      clearTimeout(fillTimer);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [duration, onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 bg-black flex flex-col items-center justify-center font-sans select-none transition-opacity duration-500 ${
        phase === 'fadeout' ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{ transition: 'opacity 0.4s ease-out, transform 0.4s ease-out' }}
    >
      {/* Atmospheric Liquid Glass Portal Sheen */}
      <div className="absolute w-[520px] h-[520px] rounded-full bg-white/[0.02] border border-white/[0.08] backdrop-blur-3xl pointer-events-none shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.25),0_30px_80px_rgba(0,0,0,0.95)] animate-pulse" />

      {/* Main Drawing Canvas Container (Zero text, zero loading bars) */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        
        {/* Animated SVG (Pure majestic drawing) */}
        <div className="w-72 h-72 sm:w-96 sm:h-96 relative flex items-center justify-center">
          <svg
            viewBox="0 0 700 700"
            className="w-full h-full drop-shadow-[0_10px_40px_rgba(255,255,255,0.25)]"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="pigeonStrokeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="45%" stopColor="#f1f5f9" />
                <stop offset="100%" stopColor="#94a3b8" />
              </linearGradient>

              <linearGradient id="pigeonFillGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="60%" stopColor="#f8fafc" />
                <stop offset="100%" stopColor="#cbd5e1" />
              </linearGradient>
            </defs>

            {/* Path 1: Top Crest Feather (Draws gracefully over 4.8s) */}
            <path
              d={pigeonPath1}
              pathLength="1"
              stroke="url(#pigeonStrokeGrad)"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill={phase === 'filled' || phase === 'fadeout' ? 'url(#pigeonFillGrad)' : 'transparent'}
              style={{
                strokeDasharray: 1,
                strokeDashoffset: 0,
                animation: 'pigeonDrawStroke 4.8s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                transition: 'fill 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            />

            {/* Path 2: Middle Wing Feather (Begins at 1.2s, draws over 4.8s) */}
            <path
              d={pigeonPath2}
              pathLength="1"
              stroke="url(#pigeonStrokeGrad)"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill={phase === 'filled' || phase === 'fadeout' ? 'url(#pigeonFillGrad)' : 'transparent'}
              style={{
                strokeDasharray: 1,
                strokeDashoffset: 0,
                animation: 'pigeonDrawStroke 4.8s cubic-bezier(0.4, 0, 0.2, 1) 1.2s forwards',
                transition: 'fill 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            />

            {/* Path 0: Lower Body & Tail Feathers (Begins at 2.2s, draws over 5.0s) */}
            <path
              d={pigeonPath0}
              pathLength="1"
              stroke="url(#pigeonStrokeGrad)"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill={phase === 'filled' || phase === 'fadeout' ? 'url(#pigeonFillGrad)' : 'transparent'}
              style={{
                strokeDasharray: 1,
                strokeDashoffset: 0,
                animation: 'pigeonDrawStroke 5.0s cubic-bezier(0.4, 0, 0.2, 1) 2.2s forwards',
                transition: 'fill 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            />

            {/* Path 3: Eye Pupil (Reveals cleanly once silhouette completes) */}
            <path
              d={pigeonPath3}
              fill="#000000"
              style={{
                opacity: phase === 'filled' || phase === 'fadeout' ? 1 : 0,
                transformOrigin: '505px 278px',
                transform: phase === 'filled' || phase === 'fadeout' ? 'scale(1)' : 'scale(0)',
                transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s',
              }}
            />
          </svg>
        </div>

      </div>
    </div>
  );
};

// Reusable Static / Hover Logo component for headers & navbar slots
export const PigeonLogo: React.FC<{ className?: string; withText?: boolean }> = ({ 
  className = 'w-7 h-7',
  withText = false 
}) => {
  return (
    <div className="flex items-center gap-2.5 group cursor-pointer select-none">
      <div className={`${className} relative flex items-center justify-center shrink-0`}>
        <svg
          viewBox="0 0 700 700"
          className="w-full h-full fill-white transition-transform duration-300 group-hover:scale-105"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d={pigeonPath1} fill="#ffffff" />
          <path d={pigeonPath2} fill="#ffffff" />
          <path d={pigeonPath0} fill="#ffffff" />
          <path d={pigeonPath3} fill="#000000" />
        </svg>
      </div>

      {withText && (
        <span className="text-sm font-semibold tracking-tight text-white font-sans">
          Pigeon
        </span>
      )}
    </div>
  );
};

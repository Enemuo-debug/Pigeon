import React, { useEffect, useRef } from 'react';

interface LiquidInkCanvasProps {
  isInjecting: boolean;
  isContaminated: boolean;
  color?: string; // rgb components, e.g. "52, 211, 153"
}

export const LiquidInkCanvas: React.FC<LiquidInkCanvasProps> = ({ 
  isInjecting, 
  isContaminated,
  color = '52, 211, 153'
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const injectionStartTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 400);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 450);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || 400;
      height = canvas.height = canvas.parentElement?.clientHeight || 450;
    };
    window.addEventListener('resize', handleResize);

    if (isInjecting) {
      injectionStartTimeRef.current = performance.now();
    }

    // Organic tendril harmonics (frequencies and phases for smooth smoke plume)
    const harmonicRings = [
      { baseScale: 1.0, speed: 1.1, numLobes: 5, seed: 1.2, alpha: 0.35, blur: 24 },
      { baseScale: 0.85, speed: 0.9, numLobes: 7, seed: 2.8, alpha: 0.45, blur: 18 },
      { baseScale: 0.65, speed: 1.3, numLobes: 6, seed: 4.1, alpha: 0.55, blur: 12 },
      { baseScale: 0.4, speed: 0.8, numLobes: 4, seed: 0.5, alpha: 0.65, blur: 8 },
    ];

    const render = (now: number) => {
      ctx.clearRect(0, 0, width, height);

      // Calculate injection bloom progress (0 to 1 with smooth cubic ease)
      let bloomProgress = 0;
      if (injectionStartTimeRef.current !== null) {
        const elapsed = (now - injectionStartTimeRef.current) / 2200; // 2.2s silky duration
        if (elapsed >= 1) {
          bloomProgress = 1;
        } else {
          // Smooth fluid expansion curve: fast initial bloom, gentle decelerating spread
          bloomProgress = 1 - Math.pow(1 - elapsed, 3.2);
        }
      } else if (isContaminated) {
        bloomProgress = 1;
      }

      // Max diagonal reach to adapt perfectly to the card's dimensions
      const maxRadius = Math.hypot(width, height) * 0.72;
      const currentSpreadRadius = maxRadius * bloomProgress;

      const originX = width * 0.5;
      const originY = height * 0.42;

      // 1. Base Contaminated Water Tint (cross-fades in as ink spreads)
      if (bloomProgress > 0) {
        const washAlpha = Math.min(1, bloomProgress * 1.2);
        const washGrad = ctx.createRadialGradient(
          originX,
          originY,
          10,
          originX,
          originY,
          maxRadius
        );
        washGrad.addColorStop(0, `rgba(${color}, ${0.08 * washAlpha})`);
        washGrad.addColorStop(0.55, `rgba(${color}, ${0.045 * washAlpha})`);
        washGrad.addColorStop(1, `rgba(${color}, ${0.015 * washAlpha})`);

        ctx.fillStyle = washGrad;
        ctx.fillRect(0, 0, width, height);

        // Watery internal undulations (slow-moving caustics inside the liquid)
        const t = now * 0.0008;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let j = 0; j < 3; j++) {
          const cx = originX + Math.sin(t + j * 2.1) * (width * 0.22);
          const cy = originY + Math.cos(t * 0.85 + j * 1.8) * (height * 0.18);
          const rad = 140 + Math.sin(t * 1.5 + j) * 20;

          const shimmer = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
          shimmer.addColorStop(0, `rgba(${color}, ${0.03 * washAlpha})`);
          shimmer.addColorStop(1, 'transparent');

          ctx.fillStyle = shimmer;
          ctx.beginPath();
          ctx.arc(cx, cy, rad, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 2. Continuous Organic Ink Drop Diffusion Wave (while injecting)
      if (injectionStartTimeRef.current !== null && bloomProgress < 1) {
        const dispersionFade = Math.max(0, 1 - Math.pow(bloomProgress, 2));

        harmonicRings.forEach((ring) => {
          const rBase = currentSpreadRadius * ring.baseScale;
          if (rBase < 2) return;

          ctx.save();
          // Use canvas filter for realistic smooth fluid blur
          ctx.filter = `blur(${ring.blur}px)`;

          ctx.beginPath();
          const steps = 72; // High resolution smooth curve
          for (let i = 0; i <= steps; i++) {
            const angle = (i / steps) * Math.PI * 2;
            
            // Harmonic fluid waviness simulating curling ink vortices
            const curl1 = Math.sin(angle * ring.numLobes + ring.seed + now * 0.002 * ring.speed) * (rBase * 0.18);
            const curl2 = Math.cos(angle * (ring.numLobes - 2) - ring.seed + now * 0.0015) * (rBase * 0.1);
            
            // Adaptive aspect ratio stretch so ink flows to corners
            const aspectMod = 1 + (Math.abs(Math.sin(angle)) * (height / width - 1) * 0.25);
            const r = (rBase + curl1 + curl2) * aspectMod;

            const px = originX + Math.cos(angle) * r;
            const py = originY + Math.sin(angle) * r;

            if (i === 0) {
              ctx.moveTo(px, py);
            } else {
              ctx.lineTo(px, py);
            }
          }
          ctx.closePath();

          // Soft watercolor gradient from center to edge of plume
          const plumeGrad = ctx.createRadialGradient(
            originX,
            originY,
            0,
            originX,
            originY,
            rBase * 1.25
          );
          plumeGrad.addColorStop(0, `rgba(${color}, ${ring.alpha * dispersionFade * 0.6})`);
          plumeGrad.addColorStop(0.45, `rgba(${color}, ${ring.alpha * dispersionFade * 0.35})`);
          plumeGrad.addColorStop(0.85, `rgba(${color}, ${ring.alpha * dispersionFade * 0.12})`);
          plumeGrad.addColorStop(1, 'transparent');

          ctx.fillStyle = plumeGrad;
          ctx.fill();
          ctx.restore();
        });
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, [isInjecting, isContaminated, color]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none rounded-[32px] z-0 overflow-hidden"
    />
  );
};

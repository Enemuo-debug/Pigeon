import React, { useEffect, useRef } from 'react';

interface LiquidChromeProps {
  isPlaying: boolean;
}

export const LiquidChromeBackground: React.FC<LiquidChromeProps> = ({ isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = e.clientX / window.innerWidth;
      mouseRef.current.targetY = e.clientY / window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    // Chrome liquid blob entities
    const blobs = [
      {
        baseX: 0.82,
        baseY: 0.22,
        radius: 260,
        speed: 0.0008,
        angle: 0,
        type: 'torus',
      },
      {
        baseX: 0.16,
        baseY: 0.68,
        radius: 290,
        speed: 0.0006,
        angle: Math.PI,
        type: 'blob',
      },
      {
        baseX: 0.5,
        baseY: 0.45,
        radius: 220,
        speed: 0.001,
        angle: Math.PI / 2,
        type: 'central',
      },
      {
        baseX: 0.88,
        baseY: 0.85,
        radius: 180,
        speed: 0.0009,
        angle: Math.PI * 1.5,
        type: 'torus',
      },
    ];

    let time = 0;

    const render = () => {
      if (isPlaying) {
        time += 0.012;
      }

      // Smooth mouse interpolation
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.04;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.04;

      // Dark obsidian background
      ctx.fillStyle = '#060709';
      ctx.fillRect(0, 0, width, height);

      // Render each liquid chrome object
      blobs.forEach((b, index) => {
        const floatX = Math.sin(time * 0.8 + index * 2) * 55;
        const floatY = Math.cos(time * 0.7 + index * 1.5) * 45;
        const mouseShiftX = (mouseRef.current.x - 0.5) * 60;
        const mouseShiftY = (mouseRef.current.y - 0.5) * 60;

        const cx = b.baseX * width + floatX + mouseShiftX;
        const cy = b.baseY * height + floatY + mouseShiftY;
        const r = b.radius * (width < 768 ? 0.7 : 1);

        ctx.save();

        if (b.type === 'torus') {
          // Draw metallic liquid torus / donut ring with liquid chrome reflection
          const grad = ctx.createRadialGradient(
            cx - r * 0.35,
            cy - r * 0.35,
            r * 0.05,
            cx,
            cy,
            r
          );
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(0.18, '#f1f5f9');
          grad.addColorStop(0.35, '#94a3b8');
          grad.addColorStop(0.55, '#334155');
          grad.addColorStop(0.75, '#0f172a');
          grad.addColorStop(0.92, '#64748b');
          grad.addColorStop(1, '#020617');

          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.shadowColor = 'rgba(255, 255, 255, 0.25)';
          ctx.shadowBlur = 40;
          ctx.fill();

          // Cutout center with inner chrome shadow to create liquid torus
          ctx.globalCompositeOperation = 'destination-out';
          ctx.beginPath();
          ctx.arc(cx, cy, r * 0.42, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalCompositeOperation = 'source-over';

          // Inner ring specular highlight
          const innerGrad = ctx.createRadialGradient(
            cx + r * 0.2,
            cy + r * 0.2,
            r * 0.3,
            cx,
            cy,
            r * 0.45
          );
          innerGrad.addColorStop(0, 'rgba(255,255,255,0.7)');
          innerGrad.addColorStop(0.4, 'rgba(148,163,184,0.3)');
          innerGrad.addColorStop(1, 'transparent');
          ctx.beginPath();
          ctx.arc(cx, cy, r * 0.45, 0, Math.PI * 2);
          ctx.strokeStyle = innerGrad;
          ctx.lineWidth = 14;
          ctx.stroke();

        } else {
          // Liquid mercury organic blob
          const morphRadiusX = r + Math.sin(time + index) * 22;
          const morphRadiusY = r + Math.cos(time * 1.2 + index) * 22;

          const grad = ctx.createRadialGradient(
            cx - r * 0.38,
            cy - r * 0.38,
            r * 0.08,
            cx,
            cy,
            r * 1.1
          );
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(0.15, '#e2e8f0');
          grad.addColorStop(0.38, '#64748b');
          grad.addColorStop(0.65, '#1e293b');
          grad.addColorStop(0.85, '#0b0f19');
          grad.addColorStop(0.95, '#475569');
          grad.addColorStop(1, '#020617');

          ctx.beginPath();
          ctx.ellipse(cx, cy, morphRadiusX, morphRadiusY, (time * 0.2) % (Math.PI * 2), 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.shadowColor = 'rgba(255, 255, 255, 0.2)';
          ctx.shadowBlur = 45;
          ctx.fill();

          // Liquid chrome specular sweep
          const sweepGrad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
          sweepGrad.addColorStop(0, 'transparent');
          sweepGrad.addColorStop(0.45, 'rgba(255, 255, 255, 0.85)');
          sweepGrad.addColorStop(0.55, 'rgba(255, 255, 255, 0.95)');
          sweepGrad.addColorStop(0.65, 'rgba(255, 255, 255, 0.4)');
          sweepGrad.addColorStop(1, 'transparent');

          ctx.beginPath();
          ctx.arc(cx - r * 0.25, cy - r * 0.25, r * 0.35, 0, Math.PI * 2);
          ctx.fillStyle = sweepGrad;
          ctx.fill();
        }

        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
    />
  );
};

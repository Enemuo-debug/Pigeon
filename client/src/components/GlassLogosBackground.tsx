import React, { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

export const GlassLogosBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 });
  const { theme } = useTheme();
  const themeRef = useRef(theme);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

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

    // Precise SVG Path definitions (viewBox 0 0 24 24, centered at 12, 12)
    const githubPath = new Path2D(
      'M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z'
    );

    const linkedinPath = new Path2D(
      'M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z'
    );

    // Large Crisp Polished Metal Sculptures (Pure solid black, zero wiping trails, zero blur ghosting)
    const logos = [
      {
        name: 'GitHub',
        path: githubPath,
        baseX: 0.22,
        baseY: 0.42,
        targetSize: 290,
        rotation: 0.08,
        phase: 0,
      },
      {
        name: 'LinkedIn',
        path: linkedinPath,
        baseX: 0.78,
        baseY: 0.46,
        targetSize: 280,
        rotation: -0.07,
        phase: Math.PI,
      },
    ];

    let time = 0;

    const render = () => {
      time += 0.012;

      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.04;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.04;

      // Ensure 100% opacity clear on every single frame - ZERO motion trails, ZERO ghosting
      const isLight = themeRef.current === 'light';
      ctx.globalAlpha = 1.0;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = isLight ? '#f4f4f5' : '#000000';
      ctx.fillRect(0, 0, width, height);

      // Render each crisp polished metal sculpture
      logos.forEach((logo) => {
        const floatX = Math.sin(time * 0.75 + logo.phase) * 120;
        const floatY = Math.cos(time * 0.65 + logo.phase) * 90;
        const parallaxX = (mouseRef.current.x - 0.5) * 70;
        const parallaxY = (mouseRef.current.y - 0.5) * 70;

        const x = logo.baseX * width + floatX + parallaxX;
        const y = logo.baseY * height + floatY + parallaxY;
        const rot = logo.rotation + Math.sin(time * 0.5 + logo.phase) * 0.12;
        const scale = (logo.targetSize * (width < 768 ? 0.7 : 1)) / 24;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);

        // 1. Crisp Metallic Extrusion Shadow
        ctx.save();
        ctx.translate(4, 6);
        ctx.scale(scale, scale);
        ctx.translate(-12, -12);
        ctx.fillStyle = isLight ? 'rgba(0, 0, 0, 0.08)' : '#090d14';
        ctx.fill(logo.path);
        ctx.restore();

        // 2. Crisp Polished Chrome Face
        ctx.save();
        ctx.scale(scale, scale);
        ctx.translate(-12, -12);

        const metalGrad = ctx.createLinearGradient(0, 0, 24, 24);
        if (isLight) {
          metalGrad.addColorStop(0, '#09090b');
          metalGrad.addColorStop(0.2, '#18181b');
          metalGrad.addColorStop(0.5, '#3f3f46');
          metalGrad.addColorStop(0.8, '#18181b');
          metalGrad.addColorStop(1, '#09090b');
        } else {
          metalGrad.addColorStop(0, '#ffffff');
          metalGrad.addColorStop(0.12, '#f1f5f9');
          metalGrad.addColorStop(0.28, '#94a3b8');
          metalGrad.addColorStop(0.48, '#334155');
          metalGrad.addColorStop(0.68, '#0f172a');
          metalGrad.addColorStop(0.82, '#64748b');
          metalGrad.addColorStop(0.92, '#e2e8f0');
          metalGrad.addColorStop(1, '#ffffff');
        }

        ctx.fillStyle = metalGrad;
        ctx.fill(logo.path);

        // 3. Razor-sharp chrome beveled edge
        const edgeGrad = ctx.createLinearGradient(0, 24, 24, 0);
        if (isLight) {
          edgeGrad.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
          edgeGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.6)');
          edgeGrad.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
        } else {
          edgeGrad.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
          edgeGrad.addColorStop(0.3, 'rgba(200, 225, 255, 0.3)');
          edgeGrad.addColorStop(0.7, 'rgba(50, 70, 100, 0.2)');
          edgeGrad.addColorStop(1, 'rgba(255, 255, 255, 0.9)');
        }

        ctx.strokeStyle = edgeGrad;
        ctx.lineWidth = 0.5;
        ctx.stroke(logo.path);

        // 4. Specular highlight sweep
        const glossGrad = ctx.createRadialGradient(8, 6, 1, 12, 12, 14);
        if (isLight) {
          glossGrad.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
          glossGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.05)');
          glossGrad.addColorStop(1, 'transparent');
        } else {
          glossGrad.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
          glossGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.1)');
          glossGrad.addColorStop(1, 'transparent');
        }

        ctx.fillStyle = glossGrad;
        ctx.fill(logo.path);

        ctx.restore();
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
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
    />
  );
};

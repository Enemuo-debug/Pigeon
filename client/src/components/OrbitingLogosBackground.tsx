import React, { useEffect, useRef } from 'react';

export const OrbitingLogosBackground: React.FC = () => {
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

    // Precise SVG Paths (24x24 centered at 12,12)
    const githubPath = new Path2D(
      'M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z'
    );

    const xPath = new Path2D(
      'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z'
    );

    const linkedinPath = new Path2D(
      'M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z'
    );

    const gitBranchPath = new Path2D(
      'M18 4a3 3 0 1 0-3 3v2a3 3 0 0 1-3 3H9.8A3 3 0 0 0 7 10a3 3 0 1 0 0 4 3 3 0 0 0 2.8-2H12a5 5 0 0 0 5-5V7a3 3 0 0 0 1-3zM7 13a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm11-8a1 1 0 1 1 0-2 1 1 0 0 1 0 2z'
    );

    const terminalPath = new Path2D(
      'M4 17l6-6-6-6M12 19h8'
    );

    const pigeonPath = new Path2D(
      'M12 3c-4.97 0-9 4.03-9 9 0 3.12 1.58 5.87 4 7.48V16l3-2 3 2v3.48c2.42-1.61 4-4.36 4-7.48 0-4.97-4.03-9-9-9zm0 4a5 5 0 0 1 5 5c0 1.38-.56 2.63-1.46 3.54L12 13.5l-3.54 2.04C7.56 14.63 7 13.38 7 12a5 5 0 0 1 5-5z'
    );

    const layersPath = new Path2D(
      'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'
    );

    // Orbit Ring 1 items (Close orbit)
    const ring1Icons = [
      { path: githubPath, size: 70, baseAngle: 0 },
      { path: linkedinPath, size: 65, baseAngle: Math.PI * 0.5 },
      { path: xPath, size: 60, baseAngle: Math.PI },
      { path: pigeonPath, size: 65, baseAngle: Math.PI * 1.5 },
    ];

    // Orbit Ring 2 items (Outer wider orbit)
    const ring2Icons = [
      { path: gitBranchPath, size: 55, baseAngle: 0.2 },
      { path: terminalPath, size: 50, baseAngle: 0.2 + (Math.PI * 2) / 5 },
      { path: layersPath, size: 55, baseAngle: 0.2 + (Math.PI * 4) / 5 },
      { path: githubPath, size: 50, baseAngle: 0.2 + (Math.PI * 6) / 5 },
      { path: linkedinPath, size: 52, baseAngle: 0.2 + (Math.PI * 8) / 5 },
    ];

    // Ambient floating drifters (deep background anchors)
    const floatingAnchors = [
      { path: githubPath, baseX: 0.12, baseY: 0.25, size: 190, speed: 0.008, phase: 0 },
      { path: xPath, baseX: 0.88, baseY: 0.35, size: 180, speed: 0.007, phase: 2.1 },
      { path: linkedinPath, baseX: 0.15, baseY: 0.78, size: 170, speed: 0.009, phase: 4.2 },
      { path: pigeonPath, baseX: 0.85, baseY: 0.80, size: 160, speed: 0.006, phase: 1.5 },
    ];

    let time = 0;

    const render = () => {
      time += 0.015;

      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      // Pure solid obsidian black
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      const centerX = width * 0.5 + (mouseRef.current.x - 0.5) * 60;
      const centerY = height * 0.38 + (mouseRef.current.y - 0.5) * 50;

      // Draw faint glass orbit tracks
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 8]);

      // Track 1
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, 290, 160, -0.08, 0, Math.PI * 2);
      ctx.stroke();

      // Track 2
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, 470, 260, 0.12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Helper function to render a liquid glass icon
      const drawGlassIcon = (path: Path2D, x: number, y: number, size: number, rot: number, alpha = 1) => {
        const scale = size / 24;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);

        // 1. Specular extrusion shadow
        ctx.save();
        ctx.translate(2, 4);
        ctx.scale(scale, scale);
        ctx.translate(-12, -12);
        ctx.fillStyle = `rgba(5, 7, 10, ${0.9 * alpha})`;
        ctx.fill(path);
        ctx.restore();

        // 2. Liquid Chrome Face Gradient
        ctx.save();
        ctx.scale(scale, scale);
        ctx.translate(-12, -12);

        const metalGrad = ctx.createLinearGradient(0, 0, 24, 24);
        metalGrad.addColorStop(0, `rgba(255, 255, 255, ${0.95 * alpha})`);
        metalGrad.addColorStop(0.18, `rgba(226, 232, 240, ${0.85 * alpha})`);
        metalGrad.addColorStop(0.42, `rgba(100, 116, 139, ${0.65 * alpha})`);
        metalGrad.addColorStop(0.68, `rgba(30, 41, 59, ${0.85 * alpha})`);
        metalGrad.addColorStop(0.85, `rgba(148, 163, 184, ${0.9 * alpha})`);
        metalGrad.addColorStop(1, `rgba(255, 255, 255, ${0.95 * alpha})`);

        ctx.fillStyle = metalGrad;
        ctx.fill(path);

        // 3. Crisp Beveled Glass Outline
        const edgeGrad = ctx.createLinearGradient(0, 24, 24, 0);
        edgeGrad.addColorStop(0, `rgba(255, 255, 255, ${0.85 * alpha})`);
        edgeGrad.addColorStop(0.5, `rgba(150, 180, 220, ${0.3 * alpha})`);
        edgeGrad.addColorStop(1, `rgba(255, 255, 255, ${0.9 * alpha})`);

        ctx.strokeStyle = edgeGrad;
        ctx.lineWidth = 0.6;
        ctx.stroke(path);

        // 4. Subtle Radial Glass Caustic
        const glossGrad = ctx.createRadialGradient(8, 8, 1, 12, 12, 12);
        glossGrad.addColorStop(0, `rgba(255, 255, 255, ${0.5 * alpha})`);
        glossGrad.addColorStop(0.4, `rgba(255, 255, 255, ${0.1 * alpha})`);
        glossGrad.addColorStop(1, 'transparent');

        ctx.fillStyle = glossGrad;
        ctx.fill(path);

        ctx.restore();
        ctx.restore();
      };

      // 1. Render ambient floating background drifters
      floatingAnchors.forEach((f) => {
        const floatX = Math.sin(time * 0.6 + f.phase) * 80;
        const floatY = Math.cos(time * 0.5 + f.phase) * 60;
        const x = f.baseX * width + floatX + (mouseRef.current.x - 0.5) * 80;
        const y = f.baseY * height + floatY + (mouseRef.current.y - 0.5) * 80;
        const rot = Math.sin(time * 0.3 + f.phase) * 0.15;
        drawGlassIcon(f.path, x, y, f.size, rot, 0.45);
      });

      // 2. Render Outer Orbit Ring 2 (Counter-Clockwise)
      const ring2Speed = -0.3;
      ring2Icons.forEach((item) => {
        const angle = time * ring2Speed + item.baseAngle;
        const rx = 470;
        const ry = 260;
        const tilt = 0.12;

        const rawX = rx * Math.cos(angle);
        const rawY = ry * Math.sin(angle);

        // Apply orbit tilt rotation
        const x = centerX + rawX * Math.cos(tilt) - rawY * Math.sin(tilt);
        const y = centerY + rawX * Math.sin(tilt) + rawY * Math.cos(tilt);

        // Z-depth illusion: size and opacity vary slightly by orbital height
        const zDepth = (Math.sin(angle) + 1) * 0.5; // 0 to 1
        const scaleMod = 0.85 + zDepth * 0.3;
        const alpha = 0.55 + zDepth * 0.45;
        const rot = angle * 0.5 + Math.sin(time) * 0.1;

        drawGlassIcon(item.path, x, y, item.size * scaleMod, rot, alpha);
      });

      // 3. Render Inner Orbit Ring 1 (Clockwise)
      const ring1Speed = 0.45;
      ring1Icons.forEach((item) => {
        const angle = time * ring1Speed + item.baseAngle;
        const rx = 290;
        const ry = 160;
        const tilt = -0.08;

        const rawX = rx * Math.cos(angle);
        const rawY = ry * Math.sin(angle);

        const x = centerX + rawX * Math.cos(tilt) - rawY * Math.sin(tilt);
        const y = centerY + rawX * Math.sin(tilt) + rawY * Math.cos(tilt);

        const zDepth = (Math.sin(angle) + 1) * 0.5;
        const scaleMod = 0.88 + zDepth * 0.28;
        const alpha = 0.7 + zDepth * 0.3;
        const rot = angle * 0.4 + Math.cos(time * 0.8) * 0.15;

        drawGlassIcon(item.path, x, y, item.size * scaleMod, rot, alpha);
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

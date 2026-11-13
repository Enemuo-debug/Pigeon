import React, { useEffect, useRef } from 'react';

export const GlassLogosBackground: React.FC = () => {
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

    // Precise SVG Path definitions (viewBox 0 0 24 24, centered at 12, 12)
    const githubPath = new Path2D(
      'M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z'
    );

    const xPath = new Path2D(
      'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z'
    );

    const linkedinPath = new Path2D(
      'M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z'
    );

    // Git Branch Satellite
    const gitBranchPath = new Path2D(
      'M6 3a3 3 0 0 0-2.83 2H3a1 1 0 0 0 0 2h.17A3.001 3.001 0 0 0 6 9a3 3 0 0 0 2-2.83V6h3a3 3 0 0 1 3 3v6.17A3.001 3.001 0 0 0 12 18a3 3 0 1 0 3-3V9a5 5 0 0 0-5-5H8V3.17A3 3 0 0 0 6 3zm0 2a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm9 12a1 1 0 1 1 0 2 1 1 0 0 1 0-2z'
    );

    // Terminal Satellite
    const terminalPath = new Path2D(
      'M4 17l6-6-6-6 1.4-1.4L12.8 11l-7.4 7.4L4 17zm8 2h8v-2h-8v2z'
    );

    // Hash Tag Satellite
    const hashPath = new Path2D(
      'M10 3h-2l-.6 4H4v2h3.1l-.8 6H3v2h3.1l-.7 4h2l.7-4h6l-.7 4h2l.7-4H20v-2h-3.4l.8-6H21V7h-3.9l.6-4h-2l-.6 4h-6l.5-4zm-.2 6h6l-.8 6h-6l.8-6z'
    );

    // CPU / Microchip Satellite
    const cpuPath = new Path2D(
      'M6 4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6zm0 2h12v12H6V6zm3 3h6v6H9V9zm-5 1H2v2h2v-2zm0 4H2v2h2v-2zm18-4h2v2h-2v-2zm0 4h2v2h-2v-2zM9 2h2v2H9V2zm4 0h2v2h-2V2zm-4 18h2v2H9v-2zm4 0h2v2h-2v-2z'
    );

    // Primary Large Floating Chrome Sculptures
    const primaryLogos = [
      {
        name: 'GitHub',
        path: githubPath,
        baseX: 0.16,
        baseY: 0.38,
        targetSize: 260,
        rotation: 0.08,
        phase: 0,
        floatSpeed: 0.7,
      },
      {
        name: 'X',
        path: xPath,
        baseX: 0.84,
        baseY: 0.28,
        targetSize: 240,
        rotation: -0.12,
        phase: Math.PI / 1.4,
        floatSpeed: 0.65,
      },
      {
        name: 'LinkedIn',
        path: linkedinPath,
        baseX: 0.52,
        baseY: 0.78,
        targetSize: 250,
        rotation: 0.06,
        phase: Math.PI * 1.35,
        floatSpeed: 0.8,
      },
    ];

    // Orbiting Satellites (Circling around space)
    const satellites = [
      {
        name: 'GitBranch',
        path: gitBranchPath,
        centerX: 0.22,
        centerY: 0.42,
        orbitRadiusX: 180,
        orbitRadiusY: 110,
        tilt: 0.4,
        speed: 0.9,
        size: 42,
        phase: 0.5,
      },
      {
        name: 'Terminal',
        path: terminalPath,
        centerX: 0.82,
        centerY: 0.32,
        orbitRadiusX: 190,
        orbitRadiusY: 120,
        tilt: -0.35,
        speed: -0.75,
        size: 38,
        phase: 2.1,
      },
      {
        name: 'CPU',
        path: cpuPath,
        centerX: 0.5,
        centerY: 0.5,
        orbitRadiusX: 340,
        orbitRadiusY: 200,
        tilt: 0.25,
        speed: 0.5,
        size: 44,
        phase: 4.2,
      },
      {
        name: 'Hash',
        path: hashPath,
        centerX: 0.54,
        centerY: 0.76,
        orbitRadiusX: 200,
        orbitRadiusY: 130,
        tilt: -0.2,
        speed: -0.85,
        size: 36,
        phase: 1.2,
      },
    ];

    let time = 0;

    const render = () => {
      time += 0.012;

      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.04;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.04;

      // Pure solid black base
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      // Subtle metallic orbital rings in background
      ctx.save();
      satellites.forEach((sat) => {
        const cx = sat.centerX * width;
        const cy = sat.centerY * height;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(sat.tilt);
        ctx.beginPath();
        ctx.ellipse(0, 0, sat.orbitRadiusX, sat.orbitRadiusY, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 12]);
        ctx.stroke();
        ctx.restore();
      });
      ctx.restore();

      // Render Primary Large Chrome Sculptures
      primaryLogos.forEach((logo) => {
        const floatX = Math.sin(time * logo.floatSpeed + logo.phase) * 110;
        const floatY = Math.cos(time * (logo.floatSpeed * 0.9) + logo.phase) * 80;
        const parallaxX = (mouseRef.current.x - 0.5) * 60;
        const parallaxY = (mouseRef.current.y - 0.5) * 60;

        const x = logo.baseX * width + floatX + parallaxX;
        const y = logo.baseY * height + floatY + parallaxY;
        const rot = logo.rotation + Math.sin(time * 0.5 + logo.phase) * 0.12;
        const scale = (logo.targetSize * (width < 768 ? 0.65 : 1)) / 24;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);

        // 1. Crisp Metallic Extrusion Shadow
        ctx.save();
        ctx.translate(4, 6);
        ctx.scale(scale, scale);
        ctx.translate(-12, -12);
        ctx.fillStyle = '#0a0e17';
        ctx.fill(logo.path);
        ctx.restore();

        // 2. Crisp Polished Chrome Face
        ctx.save();
        ctx.scale(scale, scale);
        ctx.translate(-12, -12);

        const metalGrad = ctx.createLinearGradient(0, 0, 24, 24);
        metalGrad.addColorStop(0, '#ffffff');
        metalGrad.addColorStop(0.12, '#f1f5f9');
        metalGrad.addColorStop(0.28, '#94a3b8');
        metalGrad.addColorStop(0.48, '#334155');
        metalGrad.addColorStop(0.68, '#0f172a');
        metalGrad.addColorStop(0.82, '#64748b');
        metalGrad.addColorStop(0.92, '#e2e8f0');
        metalGrad.addColorStop(1, '#ffffff');

        ctx.fillStyle = metalGrad;
        ctx.fill(logo.path);

        // 3. Razor-sharp chrome beveled edge
        const edgeGrad = ctx.createLinearGradient(0, 24, 24, 0);
        edgeGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
        edgeGrad.addColorStop(0.3, 'rgba(200, 225, 255, 0.3)');
        edgeGrad.addColorStop(0.7, 'rgba(50, 70, 100, 0.2)');
        edgeGrad.addColorStop(1, 'rgba(255, 255, 255, 0.95)');

        ctx.strokeStyle = edgeGrad;
        ctx.lineWidth = 0.5;
        ctx.stroke(logo.path);

        // 4. Subtle specular highlight sweep
        const glossGrad = ctx.createRadialGradient(8, 6, 1, 12, 12, 14);
        glossGrad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
        glossGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.08)');
        glossGrad.addColorStop(1, 'transparent');

        ctx.fillStyle = glossGrad;
        ctx.fill(logo.path);

        ctx.restore();
        ctx.restore();
      });

      // Render Orbiting Circling Satellites
      satellites.forEach((sat) => {
        const orbitAngle = time * sat.speed + sat.phase;
        // Parametric ellipse in local coordinates
        const localX = Math.cos(orbitAngle) * sat.orbitRadiusX;
        const localY = Math.sin(orbitAngle) * sat.orbitRadiusY;

        // Apply tilt rotation
        const cosT = Math.cos(sat.tilt);
        const sinT = Math.sin(sat.tilt);
        const rotatedX = localX * cosT - localY * sinT;
        const rotatedY = localX * sinT + localY * cosT;

        const cx = sat.centerX * width;
        const cy = sat.centerY * height;
        const parallaxX = (mouseRef.current.x - 0.5) * 40;
        const parallaxY = (mouseRef.current.y - 0.5) * 40;

        const x = cx + rotatedX + parallaxX;
        const y = cy + rotatedY + parallaxY;
        const scale = sat.size / 24;

        ctx.save();
        ctx.translate(x, y);
        // Face follows orbit or remains upright
        ctx.rotate(Math.sin(orbitAngle) * 0.15);

        // Subtle shadow
        ctx.save();
        ctx.translate(2, 3);
        ctx.scale(scale, scale);
        ctx.translate(-12, -12);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fill(sat.path);
        ctx.restore();

        // Chrome face
        ctx.save();
        ctx.scale(scale, scale);
        ctx.translate(-12, -12);

        const satMetalGrad = ctx.createLinearGradient(0, 0, 24, 24);
        satMetalGrad.addColorStop(0, '#ffffff');
        satMetalGrad.addColorStop(0.3, '#cbd5e1');
        satMetalGrad.addColorStop(0.6, '#475569');
        satMetalGrad.addColorStop(1, '#94a3b8');

        ctx.fillStyle = satMetalGrad;
        ctx.fill(sat.path);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 0.5;
        ctx.stroke(sat.path);

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

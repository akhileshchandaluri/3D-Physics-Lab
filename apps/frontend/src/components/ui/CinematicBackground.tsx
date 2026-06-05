import { useEffect, useRef } from 'react';
import { useTheme } from '@mui/material';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  depth: number; // 0: background, 1: midground, 2: foreground
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
}

export function CinematicBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const theme = useTheme();
  const prefersReducedMotion = usePrefersReducedMotion();
  const isDark = theme.palette.mode === 'dark';

  // Keep tracking mouse coordinates
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });
  const ripplesRef = useRef<Ripple[]>([]);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Dynamic particle density based on screen size
    const getParticleCount = () => {
      const area = width * height;
      const baseCount = Math.floor(area / 12000); // 1 particle per 12000 px
      return Math.min(Math.max(baseCount, 25), 100); // capped between 25 and 100
    };

    // Initialize particles
    const initParticles = () => {
      const count = getParticleCount();
      const temp: Particle[] = [];
      for (let i = 0; i < count; i++) {
        const depth = Math.floor(Math.random() * 3); // 0, 1, or 2
        // Background particles are smaller, slower, and dimmer
        // Foreground particles are larger, faster, and brighter
        const speedMultiplier = depth === 2 ? 0.8 : depth === 1 ? 0.4 : 0.15;
        const radius = depth === 2 ? 2.5 : depth === 1 ? 1.5 : 0.8;
        const alpha = depth === 2 ? 0.5 : depth === 1 ? 0.3 : 0.15;

        temp.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * speedMultiplier,
          vy: (Math.random() - 0.5) * speedMultiplier,
          radius,
          alpha,
          depth,
        });
      }
      particlesRef.current = temp;
    };

    initParticles();

    // Resize handler
    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initParticles();
    };

    // Mouse movement tracker
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.active = true;
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    // Create ripple on click
    const handleClick = (e: MouseEvent) => {
      ripplesRef.current.push({
        x: e.clientX,
        y: e.clientY,
        radius: 0,
        maxRadius: 180,
        alpha: 0.8,
      });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('click', handleClick);

    // Particle color base values
    const primaryColor = isDark ? '99, 102, 241' : '79, 70, 229'; // Indigo
    const accentColor = isDark ? '6, 182, 212' : '13, 148, 136'; // Cyan / Teal

    const tick = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw and update ripples
      const activeRipples = ripplesRef.current;
      for (let r = activeRipples.length - 1; r >= 0; r--) {
        const rip = activeRipples[r];
        rip.radius += 3.5;
        rip.alpha -= 0.015;

        if (rip.alpha <= 0) {
          activeRipples.splice(r, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${accentColor}, ${rip.alpha * 0.15})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // 2. Draw and update particles
      const particles = particlesRef.current;
      const mouse = mouseRef.current;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (!prefersReducedMotion) {
          // Physics: Mouse attraction / interactive field
          if (mouse.active) {
            const dx = mouse.x - p.x;
            const dy = mouse.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Attract particles within proximity, but don't pull too strongly
            if (dist < 250) {
              const force = (250 - dist) / 250;
              const angle = Math.atan2(dy, dx);
              const accel = force * 0.04 * (p.depth + 1); // stronger attraction for closer layers
              p.vx += Math.cos(angle) * accel;
              p.vy += Math.sin(angle) * accel;
            }
          }

          // Physics: Interaction with active ripples
          for (let r = 0; r < activeRipples.length; r++) {
            const rip = activeRipples[r];
            const dx = p.x - rip.x;
            const dy = p.y - rip.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Particles are accelerated outward when the ripple hits them
            if (Math.abs(dist - rip.radius) < 20) {
              const angle = Math.atan2(dy, dx);
              const force = rip.alpha * 0.3;
              p.vx += Math.cos(angle) * force;
              p.vy += Math.sin(angle) * force;
            }
          }

          // Apply friction/drag to prevent infinite acceleration
          p.vx *= 0.95;
          p.vy *= 0.95;

          // Limit max velocity based on depth
          const maxVel = p.depth === 2 ? 1.5 : p.depth === 1 ? 0.8 : 0.4;
          const currentVel = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
          if (currentVel > maxVel) {
            p.vx = (p.vx / currentVel) * maxVel;
            p.vy = (p.vy / currentVel) * maxVel;
          }

          // Move particle
          p.x += p.vx;
          p.y += p.vy;

          // Border wrapping
          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.depth === 2 ? accentColor : primaryColor}, ${p.alpha})`;
        ctx.fill();

        // 3. Draw connection lines (in the same depth layer to make parallax obvious)
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          if (p.depth !== p2.depth) continue;

          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          const maxDist = p.depth === 2 ? 120 : p.depth === 1 ? 90 : 60;
          if (dist < maxDist) {
            const lineAlpha = (1 - dist / maxDist) * 0.12 * p.alpha;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(${primaryColor}, ${lineAlpha})`;
            ctx.lineWidth = p.depth === 2 ? 1 : 0.6;
            ctx.stroke();
          }
        }
      }

      animationId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('click', handleClick);
    };
  }, [isDark, prefersReducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        pointerEvents: 'none',
        background: 'transparent',
      }}
    />
  );
}

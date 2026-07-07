import { useEffect, useRef } from "react";

const COLORS = {
  particle: "31, 86, 112", // clay.DEFAULT (darker ocean blue) in rgb
  accent: "206, 138, 46", // sage.DEFAULT (darker amber) in rgb
};

/**
 * Canvas-based particle network background: small dots drift slowly and
 * draw a faint connecting line to nearby particles, evoking a network of
 * connections -- fitting for a relationship-tracking app. Replaces the
 * previous static FloatingOrbs blur-blob background.
 */
export default function ParticleNetwork({ variant = "default" }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationId;
    let width, height;
    let particles = [];

    const density = variant === "minimal" ? 45 : 70;
    const linkDistance = variant === "minimal" ? 110 : 140;

    function resize() {
      width = canvas.width = canvas.offsetWidth * devicePixelRatio;
      height = canvas.height = canvas.offsetHeight * devicePixelRatio;
      canvas.style.width = "100%";
      canvas.style.height = "100%";
    }

    function initParticles() {
      const count = Math.min(density, Math.floor((width * height) / 45000));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.25 * devicePixelRatio,
        vy: (Math.random() - 0.5) * 0.25 * devicePixelRatio,
        r: (Math.random() * 1.5 + 1) * devicePixelRatio,
        isAccent: Math.random() < 0.12,
      }));
    }

    function step() {
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.isAccent ? COLORS.accent : COLORS.particle}, 0.5)`;
        ctx.fill();
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = linkDistance * devicePixelRatio;
          if (dist < maxDist) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(${COLORS.particle}, ${0.15 * (1 - dist / maxDist)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      animationId = requestAnimationFrame(step);
    }

    resize();
    initParticles();
    step();

    const handleResize = () => {
      resize();
      initParticles();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, [variant]);

  // Subtle scroll-linked parallax: background drifts slightly slower than the page.
  useEffect(() => {
    if (variant !== "default") return;
    const handleScroll = () => {
      if (containerRef.current) {
        containerRef.current.style.transform = `translateY(${window.scrollY * 0.15}px)`;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [variant]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
    >
      <div className="absolute inset-0 bg-bg-deep" />
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
}
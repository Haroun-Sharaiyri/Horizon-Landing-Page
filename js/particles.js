/* ================================================================
   PARTICLES.JS — Lightweight High-Performance Particle System
   ================================================================
   Optimized for mobile & desktop with zero memory leaks:
   • Uses setTransform to prevent compounding scale on resize
   • Pure canvas 2D arc drawing without expensive shadowBlur
   • Touch-aware & visibility-aware pausing
   • DPR capped for mobile stability
   ================================================================ */

export class ParticleSystem {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d', { alpha: true });
    if (!this.ctx) return;

    this.particles = [];
    this.mouse = { x: -9999, y: -9999 };
    this.isActive = true;

    // Cap DPR to 1.5 on mobile to avoid giant canvas memory usage
    const rawDpr = window.devicePixelRatio || 1;
    this.isMobile = window.innerWidth < 768;
    this.dpr = this.isMobile ? Math.min(rawDpr, 1.5) : Math.min(rawDpr, 2);

    this.maxParticles = this.isMobile ? 35 : 90;

    this.resize();
    this.createParticles();
    this.bindEvents();
    this.animate();
  }

  /* ── Canvas sizing with matrix reset ─────────────────────────── */
  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.isMobile = this.width < 768;
    this.dpr = this.isMobile ? Math.min(window.devicePixelRatio || 1, 1.5) : Math.min(window.devicePixelRatio || 1, 2);

    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';

    // Reset transform matrix cleanly
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  /* ── Particle factory ──────────────────────────────────────── */
  createParticle(startRandom = true) {
    const depth = Math.random();
    const isSparkle = Math.random() > 0.4;

    let color;
    if (isSparkle) {
      const roll = Math.random();
      if (roll < 0.6)       color = { r: 255, g: 255, b: 255 }; // white
      else if (roll < 0.9)  color = { r: 0,   g: 229, b: 255 }; // cyan
      else                  color = { r: 0,   g: 140, b: 255 }; // light blue
    } else {
      color = { r: 160, g: 190, b: 230 }; // muted dust
    }

    return {
      x: startRandom ? Math.random() * this.width : Math.random() * this.width,
      y: startRandom ? Math.random() * this.height : -10,
      vx: (Math.random() - 0.5) * 0.2 * (0.3 + depth * 0.7),
      vy: (Math.random() * 0.12 + 0.04) * (0.4 + depth * 0.6),
      size: isSparkle ? (0.7 + depth * 1.5) : (1.2 + depth * 2.0),
      baseOpacity: isSparkle ? (0.25 + depth * 0.65) : (0.05 + depth * 0.1),
      opacity: 0.1,
      twinklePhase: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.012 + Math.random() * 0.025,
      depth: depth,
      isSparkle: isSparkle,
      color: color,
    };
  }

  createParticles() {
    this.particles = [];
    const count = this.isMobile ? 35 : 90;
    for (let i = 0; i < count; i++) {
      this.particles.push(this.createParticle(true));
    }
  }

  /* ── Event bindings ─────────────────────────────────────────── */
  bindEvents() {
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        this.resize();
      }, 150);
    }, { passive: true });

    // Only track mouse movement on non-touch desktop devices
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      window.addEventListener('mousemove', (e) => {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
      }, { passive: true });

      window.addEventListener('mouseout', () => {
        this.mouse.x = -9999;
        this.mouse.y = -9999;
      }, { passive: true });
    }

    // Pause animation when tab is not active
    document.addEventListener('visibilitychange', () => {
      this.isActive = !document.hidden;
    });
  }

  /* ── Update loop ────────────────────────────────────────────── */
  update() {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      p.x += p.vx;
      p.y += p.vy;

      if (p.isSparkle) {
        p.twinklePhase += p.twinkleSpeed;
        p.opacity = p.baseOpacity * (0.35 + 0.65 * Math.sin(p.twinklePhase));
      } else {
        p.opacity = p.baseOpacity;
      }

      // Gentle mouse interaction (desktop only)
      if (this.mouse.x > -1000) {
        const dx = p.x - this.mouse.x;
        const dy = p.y - this.mouse.y;
        const distSq = dx * dx + dy * dy;
        const repelRadius = 110;
        if (distSq < repelRadius * repelRadius && distSq > 0) {
          const dist = Math.sqrt(distSq);
          const force = ((repelRadius - dist) / repelRadius) * 0.4 * p.depth;
          p.x += (dx / dist) * force;
          p.y += (dy / dist) * force;
        }
      }

      // Wrap around screen edges
      if (p.y > this.height + 15) {
        p.y = -15;
        p.x = Math.random() * this.width;
      }
      if (p.x < -15) p.x = this.width + 15;
      if (p.x > this.width + 15) p.x = -15;
    }
  }

  /* ── Draw loop (zero shadowBlur for buttery 60fps) ──────────── */
  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (p.opacity <= 0.01) continue;

      const { r, g, b } = p.color;

      // Outer faint halo for glowing sparkles (zero GPU blur overhead)
      if (p.isSparkle && p.depth > 0.5 && p.opacity > 0.35) {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size * 2.2, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.opacity * 0.15})`;
        this.ctx.fill();
      }

      // Core particle
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.opacity})`;
      this.ctx.fill();
    }
  }

  /* ── Animation frame ────────────────────────────────────────── */
  animate() {
    if (this.isActive) {
      this.update();
      this.draw();
    }
    requestAnimationFrame(() => this.animate());
  }

  /* ── Cleanup ────────────────────────────────────────────────── */
  destroy() {
    this.isActive = false;
    this.particles = [];
  }
}

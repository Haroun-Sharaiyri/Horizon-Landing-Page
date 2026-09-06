/* ================================================================
   PARTICLES.JS — Sparkle & Dust Canvas Overlay
   ================================================================
   Creates a full-viewport canvas with two types of particles:
   • Sparkles — small, bright, twinkling (white / cyan)
   • Dust     — larger, dimmer, blurred, for depth
   
   Mouse interaction: particles gently repel from the cursor.
   3 depth layers for parallax illusion.
   ================================================================ */

export class ParticleSystem {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.mouse = { x: -9999, y: -9999 };
    this.isActive = true;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Particle counts (reduced on mobile for performance)
    this.isMobile = window.innerWidth < 768;
    this.maxParticles = this.isMobile ? 70 : 160;

    this.resize();
    this.createParticles();
    this.bindEvents();
    this.animate();
  }

  /* ── Canvas sizing ──────────────────────────────────────────── */
  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';
    this.ctx.scale(this.dpr, this.dpr);
  }

  /* ── Particle factory ──────────────────────────────────────── */
  createParticle(startRandom = true) {
    const depth = Math.random();                    // 0 = far, 1 = close
    const isSparkle = Math.random() > 0.35;         // ~65% sparkles

    // Pick a color palette
    let color;
    if (isSparkle) {
      const roll = Math.random();
      if (roll < 0.55)      color = { r: 255, g: 255, b: 255 }; // white
      else if (roll < 0.85) color = { r: 0,   g: 229, b: 255 }; // cyan
      else                  color = { r: 0,   g: 140, b: 255 }; // light blue
    } else {
      color = { r: 180, g: 200, b: 230 }; // muted blue-gray for dust
    }

    return {
      x: startRandom ? Math.random() * this.width : Math.random() * this.width,
      y: startRandom ? Math.random() * this.height : -10,
      vx: (Math.random() - 0.5) * 0.25 * (0.3 + depth * 0.7),
      vy: (Math.random() * 0.15 + 0.05) * (0.4 + depth * 0.6),
      size: isSparkle
        ? 0.8 + depth * 1.8
        : 1.5 + depth * 2.5,
      baseOpacity: isSparkle
        ? 0.25 + depth * 0.65
        : 0.06 + depth * 0.12,
      opacity: 0,
      twinklePhase: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.015 + Math.random() * 0.035,
      depth: depth,
      isSparkle: isSparkle,
      color: color,
    };
  }

  createParticles() {
    this.particles = [];
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push(this.createParticle(true));
    }
  }

  /* ── Event bindings ─────────────────────────────────────────── */
  bindEvents() {
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        this.isMobile = window.innerWidth < 768;
        this.resize();
      }, 200);
    });

    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });

    window.addEventListener('mouseout', () => {
      this.mouse.x = -9999;
      this.mouse.y = -9999;
    });

    // Pause when tab is hidden
    document.addEventListener('visibilitychange', () => {
      this.isActive = !document.hidden;
    });
  }

  /* ── Update loop ────────────────────────────────────────────── */
  update() {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // Movement
      p.x += p.vx;
      p.y += p.vy;

      // Twinkle (sparkles only)
      if (p.isSparkle) {
        p.twinklePhase += p.twinkleSpeed;
        p.opacity = p.baseOpacity * (0.35 + 0.65 * Math.sin(p.twinklePhase));
      } else {
        p.opacity = p.baseOpacity;
      }

      // Mouse repulsion (subtle magnetic effect)
      const dx = p.x - this.mouse.x;
      const dy = p.y - this.mouse.y;
      const distSq = dx * dx + dy * dy;
      const repelRadius = 130;
      if (distSq < repelRadius * repelRadius && distSq > 0) {
        const dist = Math.sqrt(distSq);
        const force = ((repelRadius - dist) / repelRadius) * 0.6 * p.depth;
        p.x += (dx / dist) * force;
        p.y += (dy / dist) * force;
      }

      // Wrap around edges
      if (p.y > this.height + 15) {
        p.y = -15;
        p.x = Math.random() * this.width;
      }
      if (p.x < -15) p.x = this.width + 15;
      if (p.x > this.width + 15) p.x = -15;
    }
  }

  /* ── Draw loop ──────────────────────────────────────────────── */
  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (p.opacity <= 0.01) continue;

      const { r, g, b } = p.color;

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.opacity})`;

      // Glow on close, bright sparkles
      if (p.isSparkle && p.depth > 0.6 && p.opacity > 0.4) {
        this.ctx.shadowBlur = 8 + p.depth * 6;
        this.ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${p.opacity * 0.5})`;
      } else {
        this.ctx.shadowBlur = 0;
      }

      this.ctx.fill();
    }

    // Reset shadow state
    this.ctx.shadowBlur = 0;
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

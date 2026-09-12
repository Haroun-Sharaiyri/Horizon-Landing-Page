/* ================================================================
   MAIN.JS — Orchestration & Initialization
   ================================================================
   Boots the particle system, GSAP animations, and desktop mouse-parallax.
   Optimized for mobile & desktop stability.
   ================================================================ */

import { ParticleSystem } from './particles.js';
import { initPreloader, initScrollAnimations, showAllImmediately, gsap } from './animations.js';

function boot() {
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  /* ── Particle System ────────────────────────────────────────── */
  let particleSystem = null;
  if (!prefersReducedMotion) {
    particleSystem = new ParticleSystem('particles-canvas');
  }

  /* ── GSAP Animations ────────────────────────────────────────── */
  if (!prefersReducedMotion) {
    initPreloader(() => {
      initScrollAnimations();
    });
  } else {
    showAllImmediately();
  }

  /* ── Hero Mouse Parallax (Desktop / Pointer Only) ─────────────── */
  const isDesktopPointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (!prefersReducedMotion && isDesktopPointer) {
    const heroSection = document.getElementById('hero');
    const heroContent = document.querySelector('.hero-content');
    const heroSpotlight = document.querySelector('.hero-spotlight');
    const orbs = document.querySelectorAll('.gradient-orb');

    if (heroSection && heroContent) {
      heroSection.addEventListener('mousemove', (e) => {
        const rect = heroSection.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        const cx = x - 0.5;
        const cy = y - 0.5;

        // Content parallax
        gsap.to(heroContent, {
          x: cx * 18,
          y: cy * 12,
          duration: 1.2,
          ease: 'power2.out',
          overwrite: 'auto',
        });

        // Orb parallax
        orbs.forEach((orb, i) => {
          const depth = (i + 1) * 0.22;
          gsap.to(orb, {
            x: cx * 25 * depth,
            y: cy * 16 * depth,
            duration: 1.4 + i * 0.15,
            ease: 'power2.out',
            overwrite: 'auto',
          });
        });

        // Update spotlight CSS variables
        if (heroSpotlight) {
          heroSection.style.setProperty('--mouse-x', e.clientX + 'px');
          heroSection.style.setProperty('--mouse-y', e.clientY + 'px');
        }
      }, { passive: true });

      heroSection.addEventListener('mouseleave', () => {
        gsap.to(heroContent, {
          x: 0,
          y: 0,
          duration: 1.2,
          ease: 'power2.out',
          overwrite: 'auto',
        });
        orbs.forEach((orb) => {
          gsap.to(orb, {
            x: 0,
            y: 0,
            duration: 1.5,
            ease: 'power2.out',
            overwrite: 'auto',
          });
        });
      });
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

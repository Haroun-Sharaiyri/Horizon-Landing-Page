/* ================================================================
   ANIMATIONS.JS — GSAP Scroll-Triggered Animations
   ================================================================
   Handles:
   1. Preloader reveal sequence
   2. Hero entrance (logo, tagline, scroll indicator)
   3. Video scroll-scale (card → full-screen pinned)
   4. Brand statement word-by-word reveal
   5. Footer fade-in
   ================================================================ */

/* Register GSAP plugin */
gsap.registerPlugin(ScrollTrigger);

/* ── Preloader + Hero Reveal ──────────────────────────────────── */
function initPreloader(onComplete) {
  const tl = gsap.timeline({
    onComplete: () => {
      const preloader = document.getElementById('preloader');
      preloader.style.display = 'none';
      document.body.style.overflow = '';
      if (onComplete) onComplete();
    }
  });

  // Lock scroll during preloader
  document.body.style.overflow = 'hidden';

  tl
    // Expand the gradient line
    .to('.preloader-line', {
      width: '180px',
      duration: 1.6,
      ease: 'expo.out',
    }, 0.4)
    // Pause for a beat
    .to({}, { duration: 0.6 })
    // Fade out preloader
    .to('#preloader', {
      opacity: 0,
      duration: 0.9,
      ease: 'power2.inOut',
    })
    // Simultaneously start hero reveal
    .call(() => revealHero(), null, '-=0.5');
}

function revealHero() {
  const heroTl = gsap.timeline();

  // Logo: scale up from 0.7, un-blur, fade in
  heroTl.fromTo('.hero-logo',
    {
      opacity: 0,
      scale: 0.7,
      filter: 'blur(25px)',
    },
    {
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
      duration: 1.8,
      ease: 'expo.out',
    }
  );

  // Tagline: fade + slide up
  heroTl.fromTo('.hero-tagline',
    { opacity: 0, y: 25 },
    {
      opacity: 1,
      y: 0,
      duration: 1.1,
      ease: 'power3.out',
    },
    '-=1.0'
  );

  // Scroll indicator: fade in
  heroTl.fromTo('.scroll-indicator',
    { opacity: 0, y: -15 },
    {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: 'power2.out',
    },
    '-=0.4'
  );
}

/* ── Scroll Animations ────────────────────────────────────────── */
function initScrollAnimations() {
  /* ·· Scroll indicator: fade out on scroll ·· */
  gsap.to('.scroll-indicator', {
    opacity: 0,
    y: 10,
    scrollTrigger: {
      trigger: '#hero',
      start: 'top top',
      end: '+=250',
      scrub: true,
    }
  });

  /* ·· Video: entrance and auto-play on view (fixed size, no scale) ·· */
  const videoContainer = document.getElementById('video-container');
  const heroVideo = document.getElementById('hero-video');

  const videoHeader = document.querySelector('.video-header');
  if (videoHeader) {
    gsap.fromTo(videoHeader,
      { opacity: 0, y: 25 },
      {
        opacity: 1,
        y: 0,
        duration: 1.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '#video-section',
          start: 'top 82%',
          once: true,
        }
      }
    );
  }

  if (videoContainer) {
    gsap.fromTo(videoContainer,
      { opacity: 0, y: 35 },
      {
        opacity: 1,
        y: 0,
        duration: 1.2,
        delay: 0.15,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '#video-section',
          start: 'top 80%',
          once: true,
          onEnter: () => {
            if (heroVideo && heroVideo.paused) {
              heroVideo.play().catch(() => {});
            }
          }
        }
      }
    );

    // Auto play/pause when video section enters/leaves viewport
    ScrollTrigger.create({
      trigger: '#video-section',
      start: 'top 85%',
      end: 'bottom 15%',
      onEnter: () => {
        if (heroVideo && heroVideo.paused) {
          heroVideo.play().catch(() => {});
        }
      },
      onLeave: () => {
        if (heroVideo && !heroVideo.paused) {
          heroVideo.pause();
        }
      },
      onEnterBack: () => {
        if (heroVideo && heroVideo.paused) {
          heroVideo.play().catch(() => {});
        }
      },
      onLeaveBack: () => {
        if (heroVideo && !heroVideo.paused) {
          heroVideo.pause();
        }
      }
    });
  }

  /* ·· Brand Statement: word-by-word reveal ·· */
  const statementEl = document.querySelector('.statement-text');
  if (statementEl) {
    const rawText = statementEl.textContent.trim();
    const words = rawText.split(/\s+/);

    // Wrap each word in a span
    statementEl.innerHTML = words.map(
      word => `<span class="word">${word}</span>`
    ).join(' ');

    gsap.to('.statement-text .word', {
      opacity: 1,
      y: 0,
      duration: 0.7,
      stagger: 0.1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '#brand-statement',
        start: 'top 72%',
        end: 'top 35%',
        toggleActions: 'play none none reverse',
      }
    });
  }

  /* ·· Footer: fade in ·· */
  gsap.fromTo('#footer',
    { opacity: 0, y: 25 },
    {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '#footer',
        start: 'top 92%',
        toggleActions: 'play none none reverse',
      }
    }
  );
}

/* ── Reduced motion variant ───────────────────────────────────── */
function showAllImmediately() {
  document.getElementById('preloader').style.display = 'none';
  document.body.style.overflow = '';

  gsap.set([
    '.hero-logo',
    '.hero-tagline',
    '.scroll-indicator',
    '#footer',
  ], { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' });

  // Reveal brand statement words
  const statementEl = document.querySelector('.statement-text');
  if (statementEl) {
    const rawText = statementEl.textContent.trim();
    const words = rawText.split(/\s+/);
    statementEl.innerHTML = words.map(
      word => `<span class="word" style="opacity:1;transform:none">${word}</span>`
    ).join(' ');
  }

  // Video & Header: keep normal styling
  const vh = document.querySelector('.video-header');
  if (vh) {
    gsap.set(vh, { opacity: 1, y: 0 });
  }
  const vc = document.getElementById('video-container');
  if (vc) {
    gsap.set(vc, { opacity: 1, y: 0 });
  }
}

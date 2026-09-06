/* ================================================================
   MAIN.JS — Orchestration & Initialization
   ================================================================
   Boots the particle system, GSAP animations, video sound toggle,
   and hero mouse-parallax. Respects prefers-reduced-motion.
   ================================================================ */

document.addEventListener('DOMContentLoaded', () => {
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

  /* ── Video Playback, Controls & Scrubber ────────────────────── */
  const video = document.getElementById('hero-video');
  const videoContainer = document.getElementById('video-container');
  const controlsBar = document.getElementById('video-controls-bar');
  const playPauseBtn = document.getElementById('play-pause-btn');
  const playHint = document.getElementById('video-play-hint');
  const soundToggle = document.getElementById('sound-toggle');
  const fullscreenBtn = document.getElementById('fullscreen-btn');
  const progressContainer = document.getElementById('video-progress-container');
  const progressFill = document.getElementById('video-progress-fill');
  const currentTimeEl = document.getElementById('video-current-time');
  const durationEl = document.getElementById('video-duration');
  const timeRemainingEl = document.getElementById('video-time-remaining');

  if (video && videoContainer) {
    // Format seconds as mm:ss
    const formatTime = (seconds) => {
      if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) return '0:00';
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    // Update time indicators and progress fill
    const updateProgress = () => {
      const current = video.currentTime || 0;
      const duration = video.duration || 0;

      if (currentTimeEl) currentTimeEl.textContent = formatTime(current);
      if (durationEl && duration > 0) durationEl.textContent = formatTime(duration);

      if (timeRemainingEl && duration > 0) {
        const remaining = Math.max(0, duration - current);
        timeRemainingEl.textContent = `(-${formatTime(remaining)} left)`;
      }

      if (progressFill && duration > 0) {
        const percent = (current / duration) * 100;
        progressFill.style.width = `${percent}%`;
      }
    };

    video.addEventListener('timeupdate', updateProgress);
    video.addEventListener('loadedmetadata', updateProgress);
    video.addEventListener('durationchange', updateProgress);
    video.addEventListener('canplay', updateProgress);

    // Initial check in case metadata is already cached
    if (video.readyState >= 1) {
      updateProgress();
    }

    // Attempt autoplay immediately (muted)
    const attemptAutoplay = () => {
      video.muted = true;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          if (playHint) playHint.classList.remove('visible');
          if (playPauseBtn) playPauseBtn.classList.remove('paused');
        }).catch(() => {
          // Autoplay blocked by browser policy
          if (playHint) playHint.classList.add('visible');
          if (playPauseBtn) playPauseBtn.classList.add('paused');
        });
      }
    };

    attemptAutoplay();

    // Toggle Play/Pause
    const togglePlay = () => {
      if (video.paused) {
        video.play().catch(console.error);
      } else {
        video.pause();
      }
    };

    video.addEventListener('play', () => {
      if (playHint) playHint.classList.remove('visible');
      if (playPauseBtn) playPauseBtn.classList.remove('paused');
    });

    video.addEventListener('pause', () => {
      if (playHint) playHint.classList.add('visible');
      if (playPauseBtn) playPauseBtn.classList.add('paused');
    });

    if (playPauseBtn) {
      playPauseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePlay();
      });
    }

    // Toggle Sound
    const toggleMute = (e) => {
      if (e) e.stopPropagation();
      video.muted = !video.muted;
      if (soundToggle) {
        if (video.muted) {
          soundToggle.classList.remove('unmuted');
        } else {
          soundToggle.classList.add('unmuted');
        }
      }
    };

    if (soundToggle) {
      soundToggle.addEventListener('click', toggleMute);
    }

    // Toggle Fullscreen
    const isFullscreen = () => {
      return !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
    };

    const updateFullscreenState = () => {
      const fs = isFullscreen();
      if (fullscreenBtn) {
        if (fs) {
          fullscreenBtn.classList.add('is-fullscreen');
        } else {
          fullscreenBtn.classList.remove('is-fullscreen');
        }
      }
    };

    const toggleFullscreen = (e) => {
      if (e) e.stopPropagation();

      if (!isFullscreen()) {
        const target = videoContainer.requestFullscreen
          ? videoContainer
          : (video.webkitEnterFullscreen ? video : videoContainer);

        if (target.requestFullscreen) {
          target.requestFullscreen().catch(console.error);
        } else if (target.webkitRequestFullscreen) {
          target.webkitRequestFullscreen();
        } else if (target.mozRequestFullScreen) {
          target.mozRequestFullScreen();
        } else if (target.msRequestFullscreen) {
          target.msRequestFullscreen();
        } else if (video.webkitEnterFullscreen) {
          // iOS Safari fallback
          video.webkitEnterFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(console.error);
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
      }
    };

    if (fullscreenBtn) {
      fullscreenBtn.addEventListener('click', toggleFullscreen);
    }

    document.addEventListener('fullscreenchange', updateFullscreenState);
    document.addEventListener('webkitfullscreenchange', updateFullscreenState);
    document.addEventListener('mozfullscreenchange', updateFullscreenState);
    document.addEventListener('MSFullscreenChange', updateFullscreenState);

    // Double click video to toggle fullscreen
    videoContainer.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      toggleFullscreen(e);
    });

    // Click anywhere on video container (outside controls bar) toggles play
    videoContainer.addEventListener('click', () => {
      togglePlay();
    });

    if (controlsBar) {
      controlsBar.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }

    // Scrubbing / Seeking on progress bar
    let isSeeking = false;

    const seekTo = (e) => {
      if (!video.duration || !progressContainer) return;
      const rect = progressContainer.getBoundingClientRect();
      const clientX = (e.touches && e.touches.length) ? e.touches[0].clientX : e.clientX;
      const clickX = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const percent = clickX / rect.width;
      video.currentTime = percent * video.duration;
      updateProgress();
    };

    if (progressContainer) {
      progressContainer.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        isSeeking = true;
        seekTo(e);
      });

      window.addEventListener('mousemove', (e) => {
        if (isSeeking) {
          seekTo(e);
        }
      });

      window.addEventListener('mouseup', () => {
        if (isSeeking) {
          isSeeking = false;
        }
      });

      // Mobile touch seeking
      progressContainer.addEventListener('touchstart', (e) => {
        e.stopPropagation();
        seekTo(e);
      }, { passive: true });

      progressContainer.addEventListener('touchmove', (e) => {
        e.stopPropagation();
        seekTo(e);
      }, { passive: true });
    }
  }

  /* ── Hero Mouse Parallax + Spotlight ─────────────────────────── */
  if (!prefersReducedMotion) {
    const heroSection = document.getElementById('hero');
    const heroContent = document.querySelector('.hero-content');
    const heroSpotlight = document.querySelector('.hero-spotlight');
    const orbs = document.querySelectorAll('.gradient-orb');

    if (heroSection && heroContent) {
      heroSection.addEventListener('mousemove', (e) => {
        const rect = heroSection.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;   // 0–1
        const y = (e.clientY - rect.top) / rect.height;    // 0–1
        const cx = x - 0.5; // -0.5 to 0.5
        const cy = y - 0.5;

        // Content parallax (subtle)
        gsap.to(heroContent, {
          x: cx * 22,
          y: cy * 16,
          duration: 1.2,
          ease: 'power2.out',
        });

        // Orb parallax (each orb moves slightly based on depth)
        orbs.forEach((orb, i) => {
          const depth = (i + 1) * 0.25; // 0.25, 0.5, 0.75, 1.0
          gsap.to(orb, {
            x: cx * 30 * depth,
            y: cy * 20 * depth,
            duration: 1.5 + i * 0.2,
            ease: 'power2.out',
          });
        });

        // Update spotlight CSS custom properties
        if (heroSpotlight) {
          heroSection.style.setProperty('--mouse-x', e.clientX + 'px');
          heroSection.style.setProperty('--mouse-y', e.clientY + 'px');
        }
      });

      // Reset parallax when mouse leaves hero
      heroSection.addEventListener('mouseleave', () => {
        gsap.to(heroContent, {
          x: 0,
          y: 0,
          duration: 1.5,
          ease: 'power2.out',
        });
        orbs.forEach((orb) => {
          gsap.to(orb, {
            x: 0,
            y: 0,
            duration: 2,
            ease: 'power2.out',
          });
        });
      });
    }
  }

  /* ── Smooth page-level backdrop for video section ───────────── */
  // Darken background slightly as user scrolls into video section
  if (!prefersReducedMotion && typeof ScrollTrigger !== 'undefined') {
    ScrollTrigger.create({
      trigger: '#video-section',
      start: 'top 80%',
      end: 'top 20%',
      onUpdate: (self) => {
        const progress = self.progress;
        document.body.style.background =
          `rgb(${5 - progress * 5}, ${10 - progress * 10}, ${26 - progress * 26})`;
      },
      onLeaveBack: () => {
        document.body.style.background = '';
      },
    });
  }
});

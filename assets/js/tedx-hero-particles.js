(function () {
  'use strict';

  var PARTICLE_ID = 'tedx-hero-particles';
  var TEDX_RED = '#eb0028';
  var MAX_WAIT_MS = 15000;
  var initialized = false;

  function getParticleOptions() {
    var isMobile = window.innerWidth < 768;

    return {
      fullScreen: { enable: false },
      fpsLimit: isMobile ? 60 : 90,
      detectRetina: true,
      background: {
        color: { value: 'transparent' }
      },
      particles: {
        number: {
          value: isMobile ? 70 : 120,
          density: { enable: true, width: 1200, height: 800 }
        },
        color: { value: [TEDX_RED, '#ff3355', '#ff1a3d'] },
        shape: { type: 'circle' },
        opacity: {
          value: { min: 0.65, max: 1 },
          animation: {
            enable: true,
            speed: 0.8,
            sync: false
          }
        },
        size: {
          value: { min: 2.5, max: 5.5 }
        },
        links: {
          enable: true,
          color: TEDX_RED,
          distance: 150,
          opacity: 0.6,
          width: 1.2
        },
        move: {
          enable: true,
          speed: 1.2,
          direction: 'none',
          random: true,
          straight: false,
          outModes: { default: 'bounce' }
        }
      },
      interactivity: {
        detectsOn: 'canvas',
        events: {
          onHover: {
            enable: true,
            mode: 'grab'
          },
          onClick: {
            enable: true,
            mode: 'push'
          },
          resize: true
        },
        modes: {
          grab: {
            distance: 170,
            links: {
              opacity: 0.9,
              color: TEDX_RED
            }
          },
          push: {
            quantity: 6
          }
        }
      }
    };
  }

  function waitFor(condition, timeoutMs) {
    return new Promise(function (resolve, reject) {
      var started = Date.now();

      function tick() {
        if (condition()) {
          resolve();
          return;
        }
        if (Date.now() - started > timeoutMs) {
          reject(new Error('Timed out waiting for hero particles prerequisites.'));
          return;
        }
        window.requestAnimationFrame(tick);
      }

      tick();
    });
  }

  function initHeroParticles() {
    if (initialized) {
      return Promise.resolve();
    }

    return waitFor(function () {
      return typeof tsParticles !== 'undefined';
    }, MAX_WAIT_MS)
      .then(function () {
        return waitFor(function () {
          var container = document.getElementById(PARTICLE_ID);
          return container && container.offsetWidth > 0 && container.offsetHeight > 0;
        }, MAX_WAIT_MS);
      })
      .then(function () {
        return tsParticles.load({
          id: PARTICLE_ID,
          options: getParticleOptions()
        });
      })
      .then(function () {
        initialized = true;
      })
      .catch(function (err) {
        console.warn('[tedx-hero-particles]', err);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeroParticles);
  } else {
    initHeroParticles();
  }

  window.addEventListener('load', initHeroParticles);
})();

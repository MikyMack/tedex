(function () {
  'use strict';

  var API = window.location.origin;
  var DISPLAY_ATTENDEES = 100;
  var DISPLAY_SPEAKERS = 12;

  function updateRegistrationCount() {
    var display = DISPLAY_ATTENDEES + '+';
    document.querySelectorAll('#registration-count, #hero-registration-count').forEach(function (el) {
      el.setAttribute('data-count', DISPLAY_ATTENDEES);
      el.textContent = display;
    });
  }

  function loadRegistrationCount() {
    updateRegistrationCount();
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function speakerImageSrc(url) {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('/')) return url;
    return '/uploads/' + url;
  }

  var speakersData = [];

  function updateSpeakerCount() {
    var countEl = document.getElementById('hero-speaker-count');
    if (countEl) countEl.textContent = String(DISPLAY_SPEAKERS);
  }

  function openSpeakerModal(speaker) {
    var modal = document.getElementById('speaker-modal');
    if (!modal) return;

    var photo = document.getElementById('speaker-modal-photo');
    var placeholder = document.getElementById('speaker-modal-photo-placeholder');
    var announcement = document.getElementById('speaker-modal-announcement');

    document.getElementById('speaker-modal-name').textContent = speaker.name;
    document.getElementById('speaker-modal-role').textContent = speaker.title;
    document.getElementById('speaker-modal-bio').textContent = speaker.bio || 'Full bio coming soon.';

    if (speaker.imageUrl) {
      photo.src = speakerImageSrc(speaker.imageUrl);
      photo.alt = speaker.name;
      photo.hidden = false;
      placeholder.hidden = true;
    } else {
      photo.hidden = true;
      placeholder.hidden = false;
    }

    if (speaker.announcement) {
      announcement.innerHTML = '<i class="fa-solid fa-bullhorn"></i> ' + escapeHtml(speaker.announcement);
      announcement.hidden = false;
    } else {
      announcement.hidden = true;
    }

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeSpeakerModal() {
    var modal = document.getElementById('speaker-modal');
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function initSpeakerModal() {
    var closeBtn = document.getElementById('speaker-modal-close');
    var backdrop = document.getElementById('speaker-modal-backdrop');
    if (closeBtn) closeBtn.addEventListener('click', closeSpeakerModal);
    if (backdrop) backdrop.addEventListener('click', closeSpeakerModal);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeSpeakerModal();
    });
  }

  function renderSpeakers(speakers, announcement) {
    var grid = document.getElementById('speakers-grid');
    var announcementEl = document.getElementById('speaker-announcement-text');

    speakersData = speakers || [];
    updateSpeakerCount(speakersData);

    if (announcementEl) {
      if (announcement && speakersData.length) {
        announcementEl.innerHTML = '<strong>' + escapeHtml(announcement) + '</strong>';
        announcementEl.style.display = '';
      } else if (!speakersData.length) {
        announcementEl.innerHTML = '<strong>' + escapeHtml(announcement || 'Speaker announcements will be released soon.') + '</strong>';
      } else {
        announcementEl.style.display = 'none';
      }
    }

    if (!grid) return;

    if (!speakersData.length) {
      grid.innerHTML = '';
      return;
    }

    grid.innerHTML = speakersData
      .map(function (speaker, index) {
        if (speaker.isAnnouncementOnly) {
          return (
            '<div class="speaker-card speaker-card--teaser">' +
            '<i class="fa-solid fa-bullhorn"></i>' +
            '<h3>' + escapeHtml(speaker.name) + '</h3>' +
            '<p>' + escapeHtml(speaker.announcement || speaker.title) + '</p>' +
            '</div>'
          );
        }

        var imgHtml = speaker.imageUrl
          ? '<img src="' + escapeHtml(speakerImageSrc(speaker.imageUrl)) + '" alt="' + escapeHtml(speaker.name) + '">'
          : '<div class="speaker-card__placeholder"><i class="fa-solid fa-user"></i></div>';

        return (
          '<article class="speaker-card" data-speaker-index="' + index + '" tabindex="0" role="button" aria-label="View ' + escapeHtml(speaker.name) + '">' +
          '<div class="speaker-card__img-wrap">' + imgHtml + '</div>' +
          '<div class="speaker-card__body">' +
          '<h3 class="speaker-card__name">' + escapeHtml(speaker.name) + '</h3>' +
          '<p class="speaker-card__title">' + escapeHtml(speaker.title) + '</p>' +
          '<span class="speaker-card__more">Read More <i class="fa-sharp fa-regular fa-arrow-right"></i></span>' +
          '</div></article>'
        );
      })
      .join('');

    grid.querySelectorAll('.speaker-card:not(.speaker-card--teaser)').forEach(function (card) {
      function activate() {
        var idx = parseInt(card.getAttribute('data-speaker-index'), 10);
        if (speakersData[idx]) openSpeakerModal(speakersData[idx]);
      }
      card.addEventListener('click', activate);
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activate();
        }
      });
    });
  }

  function loadSpeakers() {
    fetch(API + '/api/speakers')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        renderSpeakers(data.speakers || [], data.announcement);
      })
      .catch(function () {});
  }

  function initHeroCountdown() {
    var container = document.getElementById('hero-countdown');
    if (!container) return;

    var eventDateStr = container.getAttribute('data-event-date');
    var eventTime = new Date(eventDateStr).getTime();
    if (isNaN(eventTime)) return;

    var daysEl = document.getElementById('countdown-days');
    var hoursEl = document.getElementById('countdown-hours');
    var minutesEl = document.getElementById('countdown-minutes');
    var secondsEl = document.getElementById('countdown-seconds');
    var labelEl = container.querySelector('.tedx-hero__countdown-label');

    function pad(n) {
      return n < 10 ? '0' + n : String(n);
    }

    function tick() {
      var now = Date.now();
      var diff = eventTime - now;

      if (diff <= 0) {
        container.classList.add('is-live');
        if (labelEl) labelEl.textContent = 'The Narrative Shift begins today!';
        clearInterval(timer);
        return;
      }

      var days = Math.floor(diff / (1000 * 60 * 60 * 24));
      var hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      var minutes = Math.floor((diff / (1000 * 60)) % 60);
      var seconds = Math.floor((diff / 1000) % 60);

      if (daysEl) daysEl.textContent = pad(days);
      if (hoursEl) hoursEl.textContent = pad(hours);
      if (minutesEl) minutesEl.textContent = pad(minutes);
      if (secondsEl) secondsEl.textContent = pad(seconds);
    }

    tick();
    var timer = setInterval(tick, 1000);
  }

  function initRegistrationForm() {
    var form = document.getElementById('registration-form');
    var formMessages = document.getElementById('form-messages');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var payload = {
        name: document.getElementById('reg-name').value.trim(),
        email: document.getElementById('reg-email').value.trim(),
        phone: document.getElementById('reg-phone').value.trim(),
        organization: document.getElementById('reg-organization').value.trim(),
        registrationType: document.getElementById('reg-type').value,
        message: document.getElementById('reg-message').value.trim(),
      };

      var submitBtn = document.getElementById('submit');
      submitBtn.disabled = true;

      fetch(API + '/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then(function (res) {
          return res.json().then(function (data) {
            return { ok: res.ok, data: data };
          });
        })
        .then(function (result) {
          submitBtn.disabled = false;
          if (result.ok) {
            formMessages.className = 'success';
            formMessages.textContent = result.data.message || 'Registration successful!';
            form.reset();
            updateRegistrationCount(result.data.totalCount || 0);
          } else {
            formMessages.className = 'error';
            formMessages.textContent = result.data.error || 'Registration failed. Please try again.';
          }
        })
        .catch(function () {
          submitBtn.disabled = false;
          formMessages.className = 'error';
          formMessages.textContent = 'Unable to connect. Please ensure the server is running.';
        });
    });
  }

  function initMobileNav() {
    var nav = document.getElementById('tedx-mobile-nav');
    if (!nav) return;

    var links = nav.querySelectorAll('.tedx-mobile-nav__link');
    var sections = [];

    links.forEach(function (link) {
      var id = link.getAttribute('href').replace('#', '');
      var section = document.getElementById(id);
      if (section) {
        sections.push({ id: id, el: section, link: link });
      }
    });

    if (!sections.length) return;

    function setActive(sectionId) {
      links.forEach(function (link) {
        link.classList.toggle('is-active', link.getAttribute('data-nav-section') === sectionId);
      });
    }

    function updateActiveOnScroll() {
      var offset = window.innerHeight * 0.32;
      var scrollPos = window.scrollY + offset;
      var current = sections[0].id;

      sections.forEach(function (item) {
        if (item.el.offsetTop <= scrollPos) {
          current = item.id;
        }
      });

      setActive(current);
    }

    window.addEventListener('scroll', updateActiveOnScroll, { passive: true });
    window.addEventListener('resize', updateActiveOnScroll);
    updateActiveOnScroll();

    links.forEach(function (link) {
      link.addEventListener('click', function () {
        var sectionId = link.getAttribute('data-nav-section');
        setActive(sectionId);
        window.setTimeout(updateActiveOnScroll, 500);
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    loadRegistrationCount();
    loadSpeakers();
    initRegistrationForm();
    initHeroCountdown();
    initSpeakerModal();
    initMobileNav();
  });
})();

(function () {
  'use strict';

  var API = window.location.origin;

  function updateRegistrationCount(count) {
    document.querySelectorAll('#registration-count, #hero-registration-count').forEach(function (el) {
      el.setAttribute('data-count', count);
      el.textContent = count;
      if (typeof jQuery !== 'undefined' && jQuery(el).hasClass('odometer')) {
        jQuery(el).html(count);
      }
    });
  }

  function loadRegistrationCount() {
    fetch(API + '/api/registrations/count')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        updateRegistrationCount(data.count || 0);
      })
      .catch(function () {});
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

  function renderSpeakers(speakers, announcement) {
    var grid = document.getElementById('speakers-grid');
    var announcementEl = document.getElementById('speaker-announcement-text');
    var placeholder = document.getElementById('speakers-placeholder');

    if (announcementEl && announcement) {
      announcementEl.innerHTML = '<strong>' + escapeHtml(announcement) + '</strong>';
    }

    if (!grid || !speakers.length) {
      return;
    }

    if (placeholder) {
      placeholder.classList.add('mb--30');
    }

    grid.innerHTML = speakers
      .map(function (speaker) {
        if (speaker.isAnnouncementOnly) {
          return (
            '<div class="col-lg-4 col-md-6">' +
            '<div class="about-us-card tmponhover text-center h-100">' +
            '<div class="card-head justify-content-center">' +
            '<div class="logo-img"><i class="fa-solid fa-bullhorn fa-2x theme-gradient" style="-webkit-text-fill-color: var(--color-primary);"></i></div>' +
            '<h3 class="card-title mt--15">' + escapeHtml(speaker.name) + '</h3>' +
            '</div>' +
            '<p class="card-para">' + escapeHtml(speaker.announcement || speaker.title) + '</p>' +
            '</div></div>'
          );
        }

        var imgHtml = speaker.imageUrl
          ? '<img src="' + escapeHtml(speakerImageSrc(speaker.imageUrl)) + '" alt="' + escapeHtml(speaker.name) + '" style="width:100%;height:280px;object-fit:cover;border-radius:20px;">'
          : '<div style="width:100%;height:280px;background:var(--color-gray-2);border-radius:20px;display:flex;align-items:center;justify-content:center;"><i class="fa-solid fa-user fa-4x text-muted"></i></div>';

        return (
          '<div class="col-lg-4 col-md-6">' +
          '<div class="latest-portfolio-card tmponhover">' +
          '<div class="portfoli-card-img">' + imgHtml + '</div>' +
          '<div class="portfolio-card-content-wrap flex-column align-items-start">' +
          '<div class="portfolio-card-title">' +
          '<h3 class="title">' + escapeHtml(speaker.name) + '</h3>' +
          '<p class="para mb-0">' + escapeHtml(speaker.title) + '</p>' +
          (speaker.announcement ? '<p class="para mt--10" style="color:var(--color-primary);"><i class="fa-solid fa-bullhorn me-1"></i>' + escapeHtml(speaker.announcement) + '</p>' : '') +
          (speaker.bio ? '<p class="para mt--10">' + escapeHtml(speaker.bio) + '</p>' : '') +
          '</div></div></div></div>'
        );
      })
      .join('');
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

  document.addEventListener('DOMContentLoaded', function () {
    loadRegistrationCount();
    loadSpeakers();
    initRegistrationForm();
    initHeroCountdown();
  });
})();

(function () {
  'use strict';

  const API = window.location.origin;
  const TOKEN_KEY = 'tedx_admin_token';
  const USER_KEY = 'tedx_admin_user';

  const loginScreen = document.getElementById('login-screen');
  const dashboardScreen = document.getElementById('dashboard-screen');
  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');
  const logoutBtn = document.getElementById('logout-btn');

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function authHeaders() {
    return {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + getToken(),
    };
  }

  function showToast(msg, isError) {
    const toast = document.getElementById('toast');
    const body = document.getElementById('toast-body');
    body.textContent = msg;
    body.className = 'alert mb-0 shadow ' + (isError ? 'alert-danger' : 'alert-success');
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
  }

  function showDashboard() {
    loginScreen.classList.add('hidden');
    dashboardScreen.classList.remove('hidden');
    document.getElementById('admin-user').textContent = localStorage.getItem(USER_KEY) || 'Admin';
    loadDashboard();
  }

  function showLogin() {
    loginScreen.classList.remove('hidden');
    dashboardScreen.classList.add('hidden');
  }

  async function verifySession() {
    const token = getToken();
    if (!token) return false;
    try {
      const res = await fetch(API + '/api/auth/verify', { headers: authHeaders() });
      const data = await res.json();
      return data.valid === true;
    } catch {
      return false;
    }
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.classList.add('hidden');
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    try {
      const res = await fetch(API + '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        loginError.textContent = data.error || 'Login failed';
        loginError.classList.remove('hidden');
        return;
      }
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, data.username);
      showDashboard();
    } catch {
      loginError.textContent = 'Unable to connect to server';
      loginError.classList.remove('hidden');
    }
  });

  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    showLogin();
  });

  async function loadDashboard() {
    await Promise.all([loadRegistrations(), loadSpeakers()]);
  }

  async function loadRegistrations() {
    try {
      const res = await fetch(API + '/api/admin/registrations', { headers: authHeaders() });
      if (res.status === 401) {
        showLogin();
        return;
      }
      const data = await res.json();
      renderRegistrations(data.registrations || []);
      document.getElementById('stat-registrations').textContent = data.count || 0;
      const attendees = (data.registrations || []).filter((r) => r.registrationType === 'attendee').length;
      document.getElementById('stat-attendees').textContent = attendees;
    } catch (err) {
      console.error(err);
    }
  }

  function typeBadge(type) {
    const labels = {
      attendee: ['Attendee', 'primary'],
      'student-speaker': ['Student Speaker', 'success'],
      'speaker-applicant': ['Speaker Applicant', 'warning'],
    };
    const [label, color] = labels[type] || ['Other', 'secondary'];
    return '<span class="badge bg-' + color + ' badge-type">' + label + '</span>';
  }

  function renderRegistrations(list) {
    const tbody = document.getElementById('registrations-table');
    const empty = document.getElementById('no-registrations');
    if (!list.length) {
      tbody.innerHTML = '';
      empty.classList.remove('hidden');
      return;
    }
    empty.classList.add('hidden');
    tbody.innerHTML = list
      .map(
        (r) =>
          '<tr>' +
          '<td><strong>' + escapeHtml(r.name) + '</strong></td>' +
          '<td>' + escapeHtml(r.email) + '</td>' +
          '<td>' + escapeHtml(r.phone) + '</td>' +
          '<td>' + escapeHtml(r.organization || '—') + '</td>' +
          '<td>' + typeBadge(r.registrationType) + '</td>' +
          '<td class="small text-muted">' + formatDate(r.createdAt) + '</td>' +
          '<td><button class="btn btn-sm btn-outline-danger delete-reg" data-id="' + r._id + '"><i class="fa-solid fa-trash"></i></button></td>' +
          '</tr>'
      )
      .join('');

    tbody.querySelectorAll('.delete-reg').forEach((btn) => {
      btn.addEventListener('click', () => deleteRegistration(btn.dataset.id));
    });
  }

  async function deleteRegistration(id) {
    if (!confirm('Delete this registration?')) return;
    try {
      const res = await fetch(API + '/api/admin/registrations/' + id, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (res.ok) {
        showToast('Registration deleted');
        loadRegistrations();
      }
    } catch (err) {
      showToast('Failed to delete', true);
    }
  }

  document.getElementById('refresh-registrations').addEventListener('click', loadRegistrations);

  async function loadSpeakers() {
    try {
      const res = await fetch(API + '/api/admin/speakers', { headers: authHeaders() });
      if (res.status === 401) {
        showLogin();
        return;
      }
      const data = await res.json();
      renderSpeakers(data.speakers || []);
      document.getElementById('global-announcement').value = data.announcement || '';
      const published = (data.speakers || []).filter((s) => s.published).length;
      document.getElementById('stat-speakers').textContent = published;
    } catch (err) {
      console.error(err);
    }
  }

  function speakerImageSrc(url) {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('/')) return url;
    return '/uploads/' + url;
  }

  function updateImagePreview(url) {
    const wrap = document.getElementById('speaker-image-preview-wrap');
    const preview = document.getElementById('speaker-image-preview');
    if (url) {
      preview.src = speakerImageSrc(url);
      wrap.classList.remove('hidden');
    } else {
      preview.src = '';
      wrap.classList.add('hidden');
    }
  }

  document.getElementById('speaker-image').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      updateImagePreview(URL.createObjectURL(file));
    } else {
      updateImagePreview('');
    }
  });

  function renderSpeakers(list) {
    const container = document.getElementById('speakers-list');
    const empty = document.getElementById('no-speakers');
    if (!list.length) {
      container.innerHTML = '';
      empty.classList.remove('hidden');
      return;
    }
    empty.classList.add('hidden');
    container.innerHTML = list
      .map(
        (s) =>
          '<div class="speaker-card-admin d-flex gap-3 align-items-start">' +
          (s.imageUrl
            ? '<img src="' + escapeHtml(speakerImageSrc(s.imageUrl)) + '" alt="">'
            : '<div class="bg-light rounded-circle d-flex align-items-center justify-content-center" style="width:60px;height:60px;"><i class="fa-solid fa-user text-muted"></i></div>') +
          '<div class="flex-grow-1">' +
          '<div class="d-flex justify-content-between">' +
          '<div><strong>' +
          escapeHtml(s.name) +
          '</strong>' +
          (s.published ? ' <span class="badge bg-success badge-type">Live</span>' : ' <span class="badge bg-secondary badge-type">Draft</span>') +
          (s.isAnnouncementOnly ? ' <span class="badge bg-info badge-type">Teaser</span>' : '') +
          '<br><span class="text-muted small">' +
          escapeHtml(s.title) +
          '</span></div>' +
          '<div class="d-flex gap-1">' +
          '<button class="btn btn-sm btn-outline-primary edit-speaker" data-id="' +
          s._id +
          '"><i class="fa-solid fa-pen"></i></button>' +
          '<button class="btn btn-sm btn-outline-danger delete-speaker" data-id="' +
          s._id +
          '"><i class="fa-solid fa-trash"></i></button>' +
          '</div></div>' +
          (s.announcement ? '<p class="small mt-2 mb-0 text-primary"><i class="fa-solid fa-bullhorn me-1"></i>' + escapeHtml(s.announcement) + '</p>' : '') +
          (s.bio ? '<p class="small mt-1 mb-0 text-muted">' + escapeHtml(s.bio.substring(0, 120)) + (s.bio.length > 120 ? '…' : '') + '</p>' : '') +
          '</div></div>'
      )
      .join('');

    container.querySelectorAll('.edit-speaker').forEach((btn) => {
      btn.addEventListener('click', () => editSpeaker(btn.dataset.id, list));
    });
    container.querySelectorAll('.delete-speaker').forEach((btn) => {
      btn.addEventListener('click', () => deleteSpeaker(btn.dataset.id));
    });
  }

  function editSpeaker(id, list) {
    const s = list.find((x) => x._id === id);
    if (!s) return;
    document.getElementById('speaker-form-title').textContent = 'Edit Speaker';
    document.getElementById('speaker-id').value = s._id;
    document.getElementById('speaker-name').value = s.name;
    document.getElementById('speaker-title').value = s.title;
    document.getElementById('speaker-bio').value = s.bio || '';
    document.getElementById('speaker-image').value = '';
    updateImagePreview(s.imageUrl || '');
    document.getElementById('speaker-announcement').value = s.announcement || '';
    document.getElementById('speaker-order').value = s.order || 0;
    document.getElementById('speaker-published').checked = s.published;
    document.getElementById('speaker-teaser-only').checked = s.isAnnouncementOnly;
    document.getElementById('cancel-speaker-edit').classList.remove('hidden');
  }

  function resetSpeakerForm() {
    document.getElementById('speaker-form').reset();
    document.getElementById('speaker-form-title').textContent = 'Add Speaker';
    document.getElementById('speaker-id').value = '';
    document.getElementById('speaker-published').checked = true;
    document.getElementById('cancel-speaker-edit').classList.add('hidden');
    updateImagePreview('');
  }

  document.getElementById('cancel-speaker-edit').addEventListener('click', resetSpeakerForm);

  document.getElementById('speaker-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('speaker-id').value;
    const formData = new FormData();
    formData.append('name', document.getElementById('speaker-name').value.trim());
    formData.append('title', document.getElementById('speaker-title').value.trim());
    formData.append('bio', document.getElementById('speaker-bio').value.trim());
    formData.append('announcement', document.getElementById('speaker-announcement').value.trim());
    formData.append('order', parseInt(document.getElementById('speaker-order').value, 10) || 0);
    formData.append('published', document.getElementById('speaker-published').checked);
    formData.append('isAnnouncementOnly', document.getElementById('speaker-teaser-only').checked);

    const imageFile = document.getElementById('speaker-image').files[0];
    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      const url = id ? API + '/api/admin/speakers/' + id : API + '/api/admin/speakers';
      const res = await fetch(url, {
        method: id ? 'PUT' : 'POST',
        headers: { Authorization: 'Bearer ' + getToken() },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to save speaker', true);
        return;
      }
      showToast(id ? 'Speaker updated' : 'Speaker added');
      resetSpeakerForm();
      loadSpeakers();
    } catch {
      showToast('Failed to save speaker', true);
    }
  });

  async function deleteSpeaker(id) {
    if (!confirm('Delete this speaker?')) return;
    try {
      const res = await fetch(API + '/api/admin/speakers/' + id, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (res.ok) {
        showToast('Speaker deleted');
        loadSpeakers();
      }
    } catch {
      showToast('Failed to delete', true);
    }
  }

  document.getElementById('announcement-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const announcement = document.getElementById('global-announcement').value.trim();
    try {
      const res = await fetch(API + '/api/admin/speakers/announcement', {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ announcement }),
      });
      if (res.ok) {
        showToast('Announcement saved');
      } else {
        showToast('Failed to save announcement', true);
      }
    } catch {
      showToast('Failed to save announcement', true);
    }
  });

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  verifySession().then((valid) => {
    if (valid) showDashboard();
    else showLogin();
  });
})();

const dialog = document.querySelector('#panel');
const content = document.querySelector('#panel-content');
const closeButton = document.querySelector('.close');

function bindBetaForm() {
  const form = content.querySelector('.beta-form');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const status = form.querySelector('.form-status');
    const button = form.querySelector('button');
    button.disabled = true;
    status.textContent = 'sending…';

    try {
      const response = await fetch(form.action, { method: 'POST', body: new FormData(form) });
      const result = await response.json();
      status.textContent = result.message || result.error || 'Something went wrong. Please try again.';
      if (response.ok) form.reset();
    } catch {
      status.textContent = 'Connection error. Please try again.';
    } finally {
      button.disabled = false;
    }
  });
}

document.querySelectorAll('[data-panel]').forEach((folder) => {
  folder.addEventListener('click', () => {
    const template = document.querySelector(`#${folder.dataset.panel}-template`);
    content.replaceChildren(template.content.cloneNode(true));
    bindBetaForm();
    if (folder.dataset.panel === 'plugin') initCarousel();
    dialog.showModal();
  });
});

closeButton.addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
});

document.querySelector('.sound-toggle').addEventListener('click', (event) => {
  const on = event.currentTarget.getAttribute('aria-pressed') === 'true';
  event.currentTarget.setAttribute('aria-pressed', String(!on));
  event.currentTarget.textContent = on ? 'sound: off' : 'sound: on';
});

/* ===== ADDED: Toast + Store support ===== */

function showToast(msg) {
  let t = document.querySelector('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

// Enhanced beta form with toast
const _origBindBeta = bindBetaForm;
bindBetaForm = function() {
  const form = content.querySelector('.beta-form');
  if (!form) return;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const status = form.querySelector('.form-status');
    const button = form.querySelector('button');
    button.disabled = true;
    status.textContent = 'sending…';
    try {
      const response = await fetch(form.action, { method: 'POST', body: new FormData(form) });
      const result = await response.json();
      status.textContent = result.message || result.error || 'Something went wrong. Please try again.';
      if (response.ok) { 
      form.reset(); 
      showToast(result.message || 'Request sent!'); 
      if (result.count) {
        document.querySelectorAll('.beta-count').forEach(el => { el.textContent = result.count; });
      }
    }
    } catch {
      status.textContent = 'Connection error. Please try again.';
    } finally {
      button.disabled = false;
    }
  });
};


/* ===== FETCH WAITLIST COUNT ===== */
function updateCount(type) {
  fetch('/api/count?type=' + (type || 'beta') + '&t=' + Date.now())
    .then(r => r.json())
    .then(d => {
      document.querySelectorAll('.beta-count').forEach(el => {
        el.textContent = d.count ?? '—';
      });
    })
    .catch(() => {});
}
updateCount('beta');

/* ===== OPEN STORE FROM PLUGIN ===== */
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-open-store]');
  if (!btn) return;
  e.preventDefault();
  const storeFolder = document.querySelector('[data-panel="store"]');
  if (storeFolder) storeFolder.click();
});

/* ===== FETCH CURRENT STATUS ===== */
const ICONS = {
  gaming: '<svg viewBox="0 0 24 24"><path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>',
  music: '<svg viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>',
  browser: '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>',
  chat: '<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>',
  creative: '<svg viewBox="0 0 24 24"><path d="M7 14c-1.66 0-3 1.34-3 3 0 1.31-1.16 2-2 2 .92 1.22 2.49 2 4 2 2.21 0 4-1.79 4-4 0-1.66-1.34-3-3-3zm13.71-9.37l-1.34-1.34a.996.996 0 00-1.41 0L9 12.25 11.75 15l8.96-8.96a.996.996 0 000-1.41z"/></svg>',
  code: '<svg viewBox="0 0 24 24"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>',
  idle: '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>',
  other: '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>'
};

function loadStatus() {
  fetch('/api/now?t=' + Date.now())
    .then(r => r.json())
    .then(data => {
      const dot = document.getElementById('now-dot');
      const icon = document.getElementById('now-icon');
      const text = document.getElementById('now-text');
      if (!dot || !text) return;
      dot.className = 'now-dot ' + (data.status === 'online' ? 'online' : 'offline');
      if (icon) icon.innerHTML = ICONS[data.category || 'idle'] || ICONS.idle;
      text.textContent = data.activity || 'chilling';
    })
    .catch(() => {
      const text = document.getElementById('now-text');
      if (text) text.textContent = 'unavailable';
    });
}
loadStatus();
setInterval(loadStatus, 30000);

/* ===== FOLDER PARTICLE EFFECT ($ / PL) ===== */
document.querySelectorAll('.folder').forEach(folder => {
  let interval = null;

  function spawnParticle() {
    const el = document.createElement('span');
    const isPL = Math.random() > 0.5;
    el.className = 'folder-particle';
    el.textContent = isPL ? 'PL' : '$';
    el.style.left = (Math.random() * 60 + 20) + '%';
    el.style.top = (Math.random() * 25 + 55) + '%';
    el.style.fontSize = (Math.random() * 10 + 12) + 'px';
    el.style.animation = `${isPL ? 'particleFloatPL' : 'particleFloatDollar'} ${Math.random() * 0.6 + 0.9}s ease-out forwards`;
    folder.appendChild(el);
    setTimeout(() => el.remove(), 1800);
  }

  folder.addEventListener('mouseenter', () => {
    if (interval) return;
    spawnParticle();
    interval = setInterval(spawnParticle, 85);
  });

  folder.addEventListener('mouseleave', () => {
    clearInterval(interval);
    interval = null;
  });
});

/* ===== PLUGIN CAROUSEL ===== */
function initCarousel() {
  const carousel = document.getElementById('plugin-carousel');
  if (!carousel) return;

  const track = carousel.querySelector('.carousel-track');
  const slides = carousel.querySelectorAll('.carousel-slide');
  const dotsContainer = carousel.querySelector('.carousel-dots');
  const prevBtn = carousel.querySelector('.carousel-prev');
  const nextBtn = carousel.querySelector('.carousel-next');

  if (!slides.length) return;

  let current = 0;
  let isDragging = false;
  let startX = 0;

  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
    dot.type = 'button';
    dot.ariaLabel = 'Slide ' + (i + 1);
    dot.addEventListener('click', () => goTo(i));
    dotsContainer.appendChild(dot);
  });

  const dots = dotsContainer.querySelectorAll('.carousel-dot');

  function updateSlides() {
    slides.forEach((s, i) => s.classList.toggle('active', i === current));
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
  }

  function goTo(index) {
    if (index < 0) index = slides.length - 1;
    if (index >= slides.length) index = 0;
    current = index;
    track.style.transform = `translateX(-${current * 100}%)`;
    updateSlides();
  }

  prevBtn.addEventListener('click', () => goTo(current - 1));
  nextBtn.addEventListener('click', () => goTo(current + 1));

  // Mouse drag
  track.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.pageX;
    track.style.transition = 'none';
    track.style.cursor = 'grabbing';
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const walk = e.pageX - startX;
    const percent = (walk / carousel.offsetWidth) * 100;
    track.style.transform = `translateX(calc(-${current * 100}% + ${percent}%))`;
  });

  window.addEventListener('mouseup', (e) => {
    if (!isDragging) return;
    isDragging = false;
    track.style.transition = 'transform 0.55s cubic-bezier(0.22, 1, 0.36, 1)';
    track.style.cursor = 'grab';
    const walk = e.pageX - startX;
    const threshold = carousel.offsetWidth * 0.18;
    if (walk < -threshold) goTo(current + 1);
    else if (walk > threshold) goTo(current - 1);
    else goTo(current);
  });

  // Touch drag
  track.addEventListener('touchstart', (e) => {
    isDragging = true;
    startX = e.touches[0].pageX;
    track.style.transition = 'none';
  }, { passive: true });

  track.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    const walk = e.touches[0].pageX - startX;
    const percent = (walk / carousel.offsetWidth) * 100;
    track.style.transform = `translateX(calc(-${current * 100}% + ${percent}%))`;
  }, { passive: true });

  track.addEventListener('touchend', (e) => {
    if (!isDragging) return;
    isDragging = false;
    track.style.transition = 'transform 0.55s cubic-bezier(0.22, 1, 0.36, 1)';
    const walk = e.changedTouches[0].pageX - startX;
    const threshold = carousel.offsetWidth * 0.18;
    if (walk < -threshold) goTo(current + 1);
    else if (walk > threshold) goTo(current - 1);
    else goTo(current);
  });

  updateSlides();
}

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
    if (folder.dataset.panel === 'game') initGame();
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

/* ===== PL$ DROP GAME ===== */
function initGame() {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('game-score');
  const timerEl = document.getElementById('game-timer');
  const startOverlay = document.getElementById('game-start');
  const overOverlay = document.getElementById('game-over');
  const finalScoreEl = document.getElementById('game-final-score');
  const startBtn = document.getElementById('game-start-btn');
  const restartBtn = document.getElementById('game-restart-btn');
  const leftBtn = document.getElementById('game-left');
  const rightBtn = document.getElementById('game-right');

  const W = 640, H = 480;
  let running = false, score = 0, timeLeft = 60, frame = 0;
  let items = [], particles = [], clouds = [];
  let spawnRate = 60, speedMult = 1;
  let keys = { left: false, right: false };
  let animId, timerId;

  const player = { x: W / 2 - 20, y: H - 55, w: 40, h: 45, speed: 5 };

  const itemTypes = [
    { text: '$', score: 10, color: '#617858', chance: 0.35, size: 18, speed: 2 },
    { text: 'PL', score: 10, color: '#4d5c47', chance: 0.30, size: 16, speed: 2.2 },
    { text: '🔊', score: 15, color: '#d4a574', chance: 0.18, size: 20, speed: 2.5 },
    { text: '🎤', score: 30, color: '#c4b8ad', chance: 0.12, size: 20, speed: 3 },
    { text: '💎', score: 50, color: '#7ec8e3', chance: 0.05, size: 20, speed: 4 },
  ];

  for (let i = 0; i < 6; i++) {
    clouds.push({
      x: Math.random() * W,
      y: Math.random() * (H / 2),
      w: 40 + Math.random() * 60,
      h: 15 + Math.random() * 20,
      speed: 0.2 + Math.random() * 0.3
    });
  }

  function drawPixelRect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.floor(x), Math.floor(y), w, h);
  }

  function drawSky() {
    for (let y = 0; y < H; y += 4) {
      const t = y / H;
      const r = Math.floor(13 + t * 25);
      const g = Math.floor(13 + t * 20);
      const b = Math.floor(18 + t * 35);
      drawPixelRect(0, y, W, 4, `rgb(${r},${g},${b})`);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    for (let i = 0; i < 30; i++) {
      const sx = ((i * 137) % W);
      const sy = ((i * 53) % (H / 2));
      ctx.fillRect(sx, sy, 2, 2);
    }
    for (const c of clouds) {
      drawPixelRect(c.x, c.y, c.w, c.h, 'rgba(230,228,220,0.12)');
      drawPixelRect(c.x + 8, c.y - 6, c.w - 16, c.h, 'rgba(230,228,220,0.08)');
    }
  }

  function drawPlayer() {
    const { x, y, w, h } = player;
    drawPixelRect(x + 8, y + 10, w - 16, h - 10, '#8b7355');
    drawPixelRect(x + 4, y, w - 8, 12, '#1a1a1a');
    drawPixelRect(x, y + 4, w, 6, '#1a1a1a');
    drawPixelRect(x + 6, y + 10, w - 12, 4, '#2a2a2a');
    drawPixelRect(x + 6, y + 18, w - 12, 6, '#0d0d0d');
    drawPixelRect(x + 18, y + 20, 4, 2, '#444');
    drawPixelRect(x + 6, y + 28, w - 12, 14, '#1a1a1a');
    drawPixelRect(x + 10, y + 36, w - 20, 6, '#2a2a2a');
    drawPixelRect(x + 10, y + 42, w - 20, 3, '#c9a227');
  }

  function drawItem(it) {
    ctx.font = `bold ${it.type.size}px "DM Mono", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = it.type.color;
    ctx.fillText(it.type.text, it.x, it.y);
    if (it.type.text === '💎') {
      ctx.shadowColor = '#7ec8e3';
      ctx.shadowBlur = 8;
      ctx.fillText(it.type.text, it.x, it.y);
      ctx.shadowBlur = 0;
    }
  }

  function drawParticles() {
    for (const p of particles) {
      drawPixelRect(p.x, p.y, p.size, p.size, p.color);
    }
  }

  function spawnItem() {
    const r = Math.random();
    let acc = 0, type = itemTypes[0];
    for (const t of itemTypes) {
      acc += t.chance;
      if (r <= acc) { type = t; break; }
    }
    items.push({
      x: 20 + Math.random() * (W - 40),
      y: -20,
      type: type,
      vy: type.speed * speedMult + Math.random() * 0.5
    });
  }

  function addParticles(x, y, color) {
    for (let i = 0; i < 8; i++) {
      particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4 - 2,
        size: 2 + Math.random() * 3,
        color,
        life: 30
      });
    }
  }

  function update() {
    if (keys.left) player.x -= player.speed;
    if (keys.right) player.x += player.speed;
    player.x = Math.max(0, Math.min(W - player.w, player.x));

    for (const c of clouds) {
      c.x += c.speed;
      if (c.x > W) c.x = -c.w;
    }

    frame++;
    if (frame % Math.max(20, Math.floor(spawnRate)) === 0) spawnItem();
    if (frame % 300 === 0) {
      spawnRate = Math.max(20, spawnRate - 4);
      speedMult += 0.08;
    }

    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      it.y += it.vy;
      if (it.x > player.x && it.x < player.x + player.w &&
          it.y > player.y && it.y < player.y + player.h) {
        score += it.type.score;
        scoreEl.textContent = score;
        addParticles(it.x, it.y, it.type.color);
        items.splice(i, 1);
        continue;
      }
      if (it.y > H + 20) items.splice(i, 1);
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy;
      p.vy += 0.15;
      p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    drawSky();
    for (const it of items) drawItem(it);
    drawPlayer();
    drawParticles();
  }

  function loop() {
    if (!running) return;
    update(); draw();
    animId = requestAnimationFrame(loop);
  }

  function startGame() {
    score = 0; timeLeft = 60; frame = 0;
    items = []; particles = [];
    spawnRate = 60; speedMult = 1;
    player.x = W / 2 - 20;
    scoreEl.textContent = '0';
    timerEl.textContent = '60';
    startOverlay.classList.add('hidden');
    overOverlay.classList.add('hidden');
    running = true;
    loop();
    timerId = setInterval(() => {
      timeLeft--;
      timerEl.textContent = timeLeft;
      if (timeLeft <= 0) endGame();
    }, 1000);
  }

  function endGame() {
    running = false;
    cancelAnimationFrame(animId);
    clearInterval(timerId);
    finalScoreEl.textContent = 'score: ' + score;
    overOverlay.classList.remove('hidden');
    const prev = parseInt(localStorage.getItem('pls_highscore') || '0');
    if (score > prev) localStorage.setItem('pls_highscore', String(score));
  }

  function onKey(e, pressed) {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = pressed;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = pressed;
    if (pressed && e.key === ' ' && !running && overOverlay.classList.contains('hidden')) {
      if (!startOverlay.classList.contains('hidden')) startGame();
    }
  }

  const keyDown = (e) => onKey(e, true);
  const keyUp = (e) => onKey(e, false);
  document.addEventListener('keydown', keyDown);
  document.addEventListener('keyup', keyUp);

  if (leftBtn) {
    const pressL = (e) => { e.preventDefault(); keys.left = true; };
    const relL = (e) => { e.preventDefault(); keys.left = false; };
    leftBtn.addEventListener('mousedown', pressL);
    leftBtn.addEventListener('mouseup', relL);
    leftBtn.addEventListener('mouseleave', relL);
    leftBtn.addEventListener('touchstart', pressL, { passive: false });
    leftBtn.addEventListener('touchend', relL);
  }
  if (rightBtn) {
    const pressR = (e) => { e.preventDefault(); keys.right = true; };
    const relR = (e) => { e.preventDefault(); keys.right = false; };
    rightBtn.addEventListener('mousedown', pressR);
    rightBtn.addEventListener('mouseup', relR);
    rightBtn.addEventListener('mouseleave', relR);
    rightBtn.addEventListener('touchstart', pressR, { passive: false });
    rightBtn.addEventListener('touchend', relR);
  }

  startBtn.addEventListener('click', startGame);
  restartBtn.addEventListener('click', startGame);

  dialog.addEventListener('close', () => {
    running = false;
    cancelAnimationFrame(animId);
    clearInterval(timerId);
    document.removeEventListener('keydown', keyDown);
    document.removeEventListener('keyup', keyUp);
  }, { once: true });

  drawSky(); drawPlayer();
}

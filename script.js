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
 gaming: '',
 music: '',
 browser: '',
 chat: '',
 creative: '',
 code: '',
 idle: '',
 other: ''
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
 const restartBtn = document.getElementById('game-restart-btn');
 const leftBtn = document.getElementById('game-left');
 const rightBtn = document.getElementById('game-right');

 const W = 640, H = 480;
 let running = false, score = 0, timeLeft = 60, frame = 0;
 let items = [], particles = [], clouds = [], planes = [];
 let spawnRate = 60, speedMult = 1.0;
 let keys = { left: false, right: false };
 let animId, timerId;
 let bgCycle = 0; // 0..1 continuous cycle
 let busted = false, bustedFrame = 0;
 let copY = -60;
 let shakeX = 0, shakeY = 0;
 let selectedChar = 'male';
 let activeDialog = null; // { text, timer, x, y }
 let lastMilestone = 0;
 let lastTime = 0;
 const TARGET_DT = 1000 / 60; // 16.67ms per frame at 60fps

 // Player (pixel head with dreads, beanie, shades)
 const player = { x: W / 2 - 20, y: H - 52, w: 40, h: 42, speed: 5 };

 // Dialog lines
 const maleLines = [
  "that's right", "goddamn", "let's go", "cash money", "no cap",
  "straight up", "big moves", "we out here", "too easy", "sheesh"
 ];
 const animeLines = [
  "uwu", "nya~", "sugoi", "kawaii", "yatta", "moe moe",
  "desu~", "honto", "ganbaru", "sugoi ne"
 ];

 // Item types — speeds are px per frame @ 60fps, scaled by dt
 const itemTypes = [
 { text: '$', score: 10, color: '#617858', chance: 0.35, size: 18, speed: 2.2 },
 { text: 'PL', score: 10, color: '#4d5c47', chance: 0.30, size: 16, speed: 2.5 },
 { text: '\uD83D\uDD0A', score: 15, color: '#d4a574', chance: 0.18, size: 20, speed: 2.8 },
 { text: '\uD83C\uDFA4', score: 30, color: '#c4b8ad', chance: 0.12, size: 20, speed: 3.2 },
 { text: '\uD83D\uDC8E', score: 50, color: '#7ec8e3', chance: 0.05, size: 20, speed: 3.6 },
 ];

 // Palettes for smooth sky cycle
 const palettes = [
 { top: [8, 6, 18], bot: [20, 15, 35], starA: 0.9, sun: false, moon: true, win: '#ffee88' },
 { top: [35, 25, 55], bot: [160, 90, 60], starA: 0.3, sun: true, moon: false, win: '#ffcc88' },
 { top: [60, 130, 195], bot: [170, 205, 235], starA: 0, sun: true, moon: false, win: '#88ccff' },
 { top: [50, 35, 75], bot: [220, 120, 55], starA: 0.1, sun: true, moon: false, win: '#ffaa55' },
 ];

 function lerp(a, b, t) { return a + (b - a) * t; }
 function lerpColor(c1, c2, t) {
 return [Math.round(lerp(c1[0], c2[0], t)), Math.round(lerp(c1[1], c2[1], t)), Math.round(lerp(c1[2], c2[2], t))];
 }

 function getCurrentPalette() {
 const phase = (bgCycle * 4) % 4;
 const idx = Math.floor(phase);
 const next = (idx + 1) % 4;
 const t = phase - idx;
 const p1 = palettes[idx], p2 = palettes[next];
 return {
 top: lerpColor(p1.top, p2.top, t),
 bot: lerpColor(p1.bot, p2.bot, t),
 starA: lerp(p1.starA, p2.starA, t),
 sun: p1.sun || (t > 0.5 && p2.sun),
 moon: p1.moon && t < 0.5,
 win: t < 0.5 ? p1.win : p2.win,
 phase: idx
 };
 }

 // Init clouds
 for (let i = 0; i < 6; i++) {
 clouds.push({ x: Math.random() * W, y: 15 + Math.random() * (H / 3), w: 45 + Math.random() * 75, h: 10 + Math.random() * 14, speed: 0.25 + Math.random() * 0.35 });
 }
 // Init planes
 for (let i = 0; i < 2; i++) {
 planes.push({ x: -80 - Math.random() * 300, y: 25 + Math.random() * 70, speed: 1.2 + Math.random() * 1.0 });
 }

 function drawPixelRect(x, y, w, h, color) {
 ctx.fillStyle = color;
 ctx.fillRect(Math.floor(x), Math.floor(y), w, h);
 }

 function drawSky() {
 const pal = getCurrentPalette();
 // Smooth pixel sky
 for (let y = 0; y < H; y += 2) {
 const t = y / H;
 const r = Math.round(pal.top[0] + t * (pal.bot[0] - pal.top[0]));
 const g = Math.round(pal.top[1] + t * (pal.bot[1] - pal.top[1]));
 const b = Math.round(pal.top[2] + t * (pal.bot[2] - pal.top[2]));
 drawPixelRect(0, y, W, 2, `rgb(${r},${g},${b})`);
 }

 // Stars with twinkle
 if (pal.starA > 0.05) {
 for (let i = 0; i < 30; i++) {
 const sx = ((i * 137) % W);
 const sy = ((i * 53) % (H / 2 + 40));
 const twinkle = Math.sin(frame * 0.04 + i * 0.7) * 0.35 + 0.65;
 const alpha = twinkle * pal.starA;
 ctx.fillStyle = `rgba(255,255,255,${alpha})`;
 ctx.fillRect(sx, sy, 2, 2);
 }
 }

 // Moon
 if (pal.moon) {
 const mx = W - 75, my = 45;
 drawPixelRect(mx, my, 26, 26, '#e8e4d8');
 drawPixelRect(mx + 4, my + 3, 5, 5, '#d0ccc0');
 drawPixelRect(mx + 14, my + 10, 4, 4, '#d0ccc0');
 // Moon glow
 ctx.fillStyle = 'rgba(232,228,216,0.06)';
 ctx.fillRect(mx - 8, my - 8, 42, 42);
 }

 // Sun with arc movement
 if (pal.sun) {
 const sunProgress = (bgCycle * 4) % 4;
 let sunAngle;
 if (sunProgress < 1) sunAngle = 0.2 + sunProgress * 0.3; // dawn rising
 else if (sunProgress < 2) sunAngle = 0.5 + (sunProgress - 1) * 0.4; // day high
 else if (sunProgress < 3) sunAngle = 0.9 + (sunProgress - 2) * 0.3; // sunset
 else sunAngle = 1.2 + (sunProgress - 3) * 0.2; // night hiding
 const sunX = W - 100 + Math.cos(sunAngle) * 30;
 const sunY = 30 + Math.sin(sunAngle) * 25;
 const sunColor = pal.phase === 3 ? '#ff8844' : (pal.phase === 1 ? '#ffcc55' : '#ffee88');
 // Glow
 ctx.fillStyle = sunColor;
 ctx.globalAlpha = 0.08;
 ctx.fillRect(sunX - 15, sunY - 15, 56, 56);
 ctx.globalAlpha = 0.15;
 ctx.fillRect(sunX - 8, sunY - 8, 42, 42);
 ctx.globalAlpha = 1;
 // Sun body
 drawPixelRect(sunX, sunY, 26, 26, sunColor);
 // Rays
 ctx.fillStyle = sunColor;
 for (let i = 0; i < 12; i++) {
 const angle = frame * 0.008 + i * 0.524;
 const rx = sunX + 13 + Math.cos(angle) * 22;
 const ry = sunY + 13 + Math.sin(angle) * 22;
 ctx.globalAlpha = 0.12 + Math.sin(frame * 0.03 + i) * 0.06;
 ctx.fillRect(rx - 1, ry - 1, 3, 3);
 }
 ctx.globalAlpha = 1;
 }

 // Clouds
 for (const c of clouds) {
 const cloudColor = pal.phase === 2 ? 'rgba(255,255,255,0.22)' : pal.phase === 3 ? 'rgba(255,180,120,0.14)' : 'rgba(220,218,210,0.09)';
 drawPixelRect(c.x, c.y, c.w, c.h, cloudColor);
 drawPixelRect(c.x + 12, c.y - 4, c.w - 24, c.h, cloudColor.replace(/[0-9.]+\)$/, '0.05)'));
 }

 // Planes
 for (const p of planes) {
 const pc = pal.phase === 2 ? '#555' : '#999';
 drawPixelRect(p.x, p.y, 22, 3, pc);
 drawPixelRect(p.x + 7, p.y - 3, 8, 9, pc);
 drawPixelRect(p.x + 18, p.y - 3, 3, 5, pc);
 if (frame % 50 < 25) drawPixelRect(p.x + 20, p.y - 1, 2, 2, '#ff3333');
 }

 // City skyline
 const cityColor = pal.phase === 2 ? '#1a1a2e' : '#080810';
 const buildings = [
 [0, 28], [55, 42], [95, 22], [140, 35], [185, 18],
 [220, 30], [265, 24], [310, 38], [360, 20], [405, 32],
 [450, 26], [495, 40], [540, 22], [585, 34], [625, 28]
 ];
 for (const [bx, bh] of buildings) {
 drawPixelRect(bx, H - bh, 35, bh, cityColor);
 }
 // Windows
 ctx.fillStyle = pal.win;
 for (let wx = 10; wx < W; wx += 38) {
 for (let wy = H - 45; wy < H - 5; wy += 10) {
 if ((wx * 7 + wy * 3) % 11 < 5) ctx.fillRect(wx, wy, 3, 4);
 }
 }
 }

 function drawPlayer() {
 const { x, y, w, h } = player;
 const skin = '#d4a574';
 const skinDark = '#b0865a';
 const hair = '#1a1a1a';
 const beanie = '#e85d3e'; // orange beanie
 const beanieDark = '#c44a30';
 const shades = '#0a0a0a';
 const shadesFrame = '#ffd700';
 const chain = '#ffd700';

 // === IMPROVED DREADS ===
 // Left dreads - thicker, with tapered ends, more natural sway
 for (let i = 0; i < 5; i++) {
 const offset = i * 2.5;
 const sway = Math.sin(frame * 0.05 + i * 0.9) * 2.5;
 const baseLen = 16 + i * 1.5;
 // Main dread body
 drawPixelRect(x - 6 + offset + sway, y + 12, 4, baseLen - 3, hair);
 // Tapered tip
 drawPixelRect(x - 5 + offset + sway * 0.7, y + 12 + baseLen - 3, 2, 3, hair);
 // Subtle highlight
 if (i % 2 === 0) drawPixelRect(x - 5 + offset + sway, y + 14, 1, baseLen - 6, '#2a2a2a');
 }
 // Right dreads
 for (let i = 0; i < 5; i++) {
 const offset = i * 2.5;
 const sway = Math.sin(frame * 0.05 + i * 0.9 + 2.5) * 2.5;
 const baseLen = 16 + i * 1.5;
 drawPixelRect(x + w + 2 + offset + sway, y + 12, 4, baseLen - 3, hair);
 drawPixelRect(x + w + 3 + offset + sway * 0.7, y + 12 + baseLen - 3, 2, 3, hair);
 if (i % 2 === 0) drawPixelRect(x + w + 3 + offset + sway, y + 14, 1, baseLen - 6, '#2a2a2a');
 }
 // Back dreads peeking behind
 for (let i = 0; i < 3; i++) {
 const sway = Math.sin(frame * 0.04 + i * 1.2) * 1.5;
 drawPixelRect(x + 6 + i * 8 + sway, y + 10, 3, 12, hair);
 }

 // Face
 drawPixelRect(x + 4, y + 10, w - 8, 22, skin);
 // Chin shadow
 drawPixelRect(x + 6, y + 30, w - 12, 4, skinDark);

 // Beanie (orange, puffy)
 drawPixelRect(x + 2, y, w - 4, 12, beanie);
 drawPixelRect(x, y + 3, w, 8, beanie);
 drawPixelRect(x + 4, y - 3, w - 8, 6, beanieDark);
 // Beanie fold
 drawPixelRect(x + 2, y + 8, w - 4, 4, beanieDark);
 // Beanie logo (small green square like in image)
 drawPixelRect(x + w/2 - 3, y + 4, 6, 5, '#4a8c5a');
 drawPixelRect(x + w/2 - 1, y + 5, 2, 3, '#3a7c4a');

 // Sunglasses (big, gold frame)
 drawPixelRect(x + 5, y + 16, w - 10, 9, shades);
 drawPixelRect(x + 4, y + 15, w - 8, 2, shadesFrame);
 drawPixelRect(x + 4, y + 24, w - 8, 2, shadesFrame);
 // Bridge
 drawPixelRect(x + w/2 - 2, y + 18, 4, 4, shadesFrame);
 // Reflection
 drawPixelRect(x + 8, y + 17, 5, 2, '#222');
 drawPixelRect(x + w - 15, y + 18, 4, 2, '#222');

 // Nose
 drawPixelRect(x + w/2 - 1, y + 24, 2, 3, skinDark);

 // Mouth (slight smile)
 drawPixelRect(x + 10, y + 29, w - 20, 2, '#6b4226');
 drawPixelRect(x + 12, y + 28, 3, 2, '#6b4226');

 // Small beard stubble
 drawPixelRect(x + 8, y + 30, w - 16, 3, hair);

 // Gold chain
 drawPixelRect(x + 10, y + 34, w - 20, 3, chain);
 drawPixelRect(x + 14, y + 35, 3, 2, '#ffee88');
 drawPixelRect(x + w - 19, y + 35, 3, 2, '#ffee88');
 }

 function drawAnimeGirl() {
 const { x, y, w, h } = player;
 const skin = '#ffe0d0';
 const skinDark = '#f0c0a8';
 const hair = '#ffb7d5'; // pink hair
 const hairDark = '#e89bb8';
 const hairLight = '#ffd0e5';
 const eyeWhite = '#ffffff';
 const eyeColor = '#44aaff'; // big blue eyes
 const eyePupil = '#224488';
 const blush = '#ff99aa';
 const mouth = '#cc6677';
 const bow = '#ff5588';

 // === BACK HAIR (long, flowing) ===
 // Main back hair mass
 drawPixelRect(x - 4, y + 8, w + 8, 18, hair);
 drawPixelRect(x - 2, y + 24, w + 4, 10, hair);
 // Hair tips swaying
 for (let i = 0; i < 4; i++) {
 const sway = Math.sin(frame * 0.06 + i * 1.1) * 2;
 const hx = x - 2 + i * 10;
 drawPixelRect(hx + sway, y + 32, 6, 8, hairDark);
 drawPixelRect(hx + sway * 0.5, y + 38, 4, 4, hair);
 }

 // === PIGTAILS (two side ponytails) ===
 // Left pigtail
 const leftSway = Math.sin(frame * 0.07 + 1) * 3;
 drawPixelRect(x - 14 + leftSway, y + 6, 10, 14, hair);
 drawPixelRect(x - 12 + leftSway * 0.8, y + 18, 8, 10, hair);
 drawPixelRect(x - 10 + leftSway * 0.6, y + 26, 6, 8, hairDark);
 // Left hair tie (bow)
 drawPixelRect(x - 8 + leftSway * 0.5, y + 4, 6, 5, bow);
 drawPixelRect(x - 10 + leftSway * 0.5, y + 5, 3, 3, '#ff3366');
 drawPixelRect(x - 3 + leftSway * 0.5, y + 5, 3, 3, '#ff3366');

 // Right pigtail
 const rightSway = Math.sin(frame * 0.07 + 2.5) * 3;
 drawPixelRect(x + w + 4 + rightSway, y + 6, 10, 14, hair);
 drawPixelRect(x + w + 4 + rightSway * 0.8, y + 18, 8, 10, hair);
 drawPixelRect(x + w + 6 + rightSway * 0.6, y + 26, 6, 8, hairDark);
 // Right hair tie (bow)
 drawPixelRect(x + w + 2 + rightSway * 0.5, y + 4, 6, 5, bow);
 drawPixelRect(x + w + rightSway * 0.5, y + 5, 3, 3, '#ff3366');
 drawPixelRect(x + w + 7 + rightSway * 0.5, y + 5, 3, 3, '#ff3366');

 // === FACE ===
 drawPixelRect(x + 4, y + 8, w - 8, 24, skin);
 // Chin
 drawPixelRect(x + 6, y + 30, w - 12, 4, skin);

 // === BANGS ===
 drawPixelRect(x + 2, y + 4, w - 4, 8, hair);
 // Bang strands
 drawPixelRect(x + 4, y + 10, 4, 4, hair);
 drawPixelRect(x + 10, y + 10, 3, 5, hair);
 drawPixelRect(x + w - 14, y + 10, 3, 5, hair);
 drawPixelRect(x + w - 8, y + 10, 4, 4, hair);
 // Center gap for face
 drawPixelRect(x + w/2 - 3, y + 8, 6, 4, skin);

 // === BIG EYES ===
 // Left eye
 drawPixelRect(x + 7, y + 14, 10, 10, eyeWhite);
 drawPixelRect(x + 9, y + 16, 6, 6, eyeColor);
 drawPixelRect(x + 10, y + 17, 3, 4, eyePupil);
 drawPixelRect(x + 11, y + 15, 2, 2, '#ffffff'); // highlight
 // Right eye
 drawPixelRect(x + w - 17, y + 14, 10, 10, eyeWhite);
 drawPixelRect(x + w - 15, y + 16, 6, 6, eyeColor);
 drawPixelRect(x + w - 14, y + 17, 3, 4, eyePupil);
 drawPixelRect(x + w - 13, y + 15, 2, 2, '#ffffff'); // highlight

 // Eyelashes
 drawPixelRect(x + 6, y + 13, 12, 2, hair);
 drawPixelRect(x + w - 18, y + 13, 12, 2, hair);

 // === BLUSH ===
 drawPixelRect(x + 6, y + 22, 5, 3, blush);
 drawPixelRect(x + w - 11, y + 22, 5, 3, blush);

 // === NOSE ===
 drawPixelRect(x + w/2 - 1, y + 22, 2, 2, skinDark);

 // === MOUTH (small cat-like) ===
 drawPixelRect(x + 14, y + 26, w - 28, 2, mouth);
 drawPixelRect(x + 16, y + 25, 2, 2, mouth);
 drawPixelRect(x + w - 18, y + 25, 2, 2, mouth);

 // === HAIR HIGHLIGHTS ===
 drawPixelRect(x + 6, y + 5, 4, 2, hairLight);
 drawPixelRect(x + w - 10, y + 5, 4, 2, hairLight);
 }

 function drawCop() {
 // Police head descending from top to catch player
 const cx = player.x + player.w/2 - 18;
 const cy = copY;
 // Police hat (blue)
 drawPixelRect(cx + 4, cy, 28, 10, '#1a3a6b');
 drawPixelRect(cx, cy + 6, 36, 5, '#1a3a6b');
 // Hat badge
 drawPixelRect(cx + 14, cy + 3, 8, 5, '#ffd700');
 // Face
 drawPixelRect(cx + 6, cy + 10, 24, 18, '#d4a574');
 // Sunglasses
 drawPixelRect(cx + 7, cy + 14, 22, 6, '#0a0a0a');
 // Mustache
 drawPixelRect(cx + 10, cy + 22, 16, 3, '#2a2a2a');
 // Uniform collar
 drawPixelRect(cx + 4, cy + 26, 28, 6, '#1a3a6b');
 drawPixelRect(cx + 12, cy + 28, 12, 3, '#ffd700');
 }

 function drawPoliceLights() {
 const flashSpeed = 8;
 const isRed = Math.floor(frame / flashSpeed) % 2 === 0;
 // Top bar lights
 for (let i = 0; i < 6; i++) {
 const lx = 60 + i * 90;
 const color = (i % 2 === 0) ? (isRed ? '#ff0000' : '#330000') : (isRed ? '#000033' : '#0000ff');
 ctx.fillStyle = color;
 ctx.fillRect(lx, 4, 20, 8);
 // Glow
 ctx.globalAlpha = isRed ? 0.3 : 0.15;
 ctx.fillRect(lx - 4, 0, 28, 16);
 }
 ctx.globalAlpha = 1;
 // Side flashes
 ctx.fillStyle = isRed ? 'rgba(255,0,0,0.08)' : 'rgba(0,0,255,0.08)';
 ctx.fillRect(0, 0, W, H);
 }

 function drawItem(it) {
 ctx.font = `bold ${it.type.size}px "DM Mono", monospace`;
 ctx.textAlign = 'center';
 ctx.textBaseline = 'middle';
 ctx.fillStyle = it.type.color;
 ctx.fillText(it.type.text, it.x, it.y);
 if (it.type.text === '\uD83D\uDC8E') {
 ctx.shadowColor = '#7ec8e3';
 ctx.shadowBlur = 12;
 ctx.fillText(it.type.text, it.x, it.y);
 ctx.shadowBlur = 0;
 }
 }

 function drawParticles() {
 for (const p of particles) {
 drawPixelRect(p.x, p.y, p.size, p.size, p.color);
 }
 }

 function drawDialog() {
 if (!activeDialog) return;
 const { text, x, y } = activeDialog;
 const px = x;
 const py = y - 28;

 ctx.font = 'bold 11px "DM Mono", monospace';
 ctx.textAlign = 'center';
 const metrics = ctx.measureText(text);
 const pad = 8;
 const bw = metrics.width + pad * 2;
 const bh = 20;
 const bx = px - bw / 2;
 const by = py - bh / 2;

 // Bubble background
 ctx.fillStyle = 'rgba(255,255,255,0.92)';
 ctx.fillRect(bx, by, bw, bh);
 ctx.strokeStyle = '#151515';
 ctx.lineWidth = 1;
 ctx.strokeRect(bx, by, bw, bh);

 // Little tail
 ctx.fillStyle = 'rgba(255,255,255,0.92)';
 ctx.beginPath();
 ctx.moveTo(px - 3, by + bh);
 ctx.lineTo(px + 3, by + bh);
 ctx.lineTo(px, by + bh + 4);
 ctx.closePath();
 ctx.fill();
 ctx.strokeStyle = '#151515';
 ctx.beginPath();
 ctx.moveTo(px - 3, by + bh);
 ctx.lineTo(px, by + bh + 4);
 ctx.lineTo(px + 3, by + bh);
 ctx.stroke();

 // Text
 ctx.fillStyle = '#151515';
 ctx.fillText(text, px, py + 1);
 }

 function spawnItem() {
 const r = Math.random();
 let acc = 0, type = itemTypes[0];
 for (const t of itemTypes) {
 acc += t.chance;
 if (r <= acc) { type = t; break; }
 }
 items.push({ x: 30 + Math.random() * (W - 60), y: -25, type: type, vy: type.speed * speedMult + Math.random() * 0.2 });
 }

 function addParticles(x, y, color) {
 for (let i = 0; i < 10; i++) {
 particles.push({ x, y, vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5 - 3, size: 2 + Math.random() * 4, color, life: 40 });
 }
 }

 function triggerDialog(trigger) {
 if (activeDialog && activeDialog.timer > 0) return;
 const lines = selectedChar === 'male' ? maleLines : animeLines;
 let text = '';
 if (trigger === 'diamond') {
 text = selectedChar === 'male' ? "that's right" : "uwu";
 } else if (trigger === 'milestone') {
 text = lines[Math.floor(Math.random() * lines.length)];
 }
 if (text) {
 activeDialog = {
 text,
 timer: 90,
 x: player.x + player.w / 2,
 y: player.y
 };
 }
 }

 function triggerBusted() {
 busted = true;
 bustedFrame = 0;
 copY = -60;
 items = [];
 activeDialog = null;
 }

 function update(dt) {
 if (activeDialog) {
 activeDialog.timer -= dt;
 activeDialog.x = player.x + player.w / 2;
 activeDialog.y = player.y;
 if (activeDialog.timer <= 0) activeDialog = null;
 }

 if (busted) {
 bustedFrame += dt;
 // Shake effect
 shakeX = Math.sin(bustedFrame * 0.8) * 3;
 shakeY = Math.cos(bustedFrame * 0.6) * 2;
 // Cop descends
 if (copY < player.y - 20) copY += 2.5 * dt;
 else {
 // Cop caught player - end game
 if (bustedFrame > 120) {
 endGame(true);
 return;
 }
 }
 frame += dt;
 bgCycle += 0.0003 * dt;
 return;
 }

 if (keys.left) player.x -= player.speed * dt;
 if (keys.right) player.x += player.speed * dt;
 player.x = Math.max(0, Math.min(W - player.w, player.x));

 // Background cycle - very smooth
 bgCycle += 0.00025 * dt;

 // Clouds
 for (const c of clouds) {
 c.x += c.speed * dt;
 if (c.x > W + 60) { c.x = -c.w - 20; c.y = 15 + Math.random() * (H / 3); }
 }
 // Planes
 for (const p of planes) {
 p.x += p.speed * dt;
 if (p.x > W + 50) { p.x = -80 - Math.random() * 150; p.y = 25 + Math.random() * 70; }
 }

 // Check busted condition at 30 seconds
 if (timeLeft === 30 && score < 400 && !busted) {
 triggerBusted();
 return;
 }

 frame += dt;
 if (!busted && frame % Math.max(40, Math.floor(spawnRate)) < dt) spawnItem();
 if (frame % 500 < dt) {
 spawnRate = Math.max(30, spawnRate - 4);
 speedMult += 0.03;
 }

 for (let i = items.length - 1; i >= 0; i--) {
 const it = items[i];
 it.y += it.vy * dt;
 it.x += Math.sin(frame * 0.025 + i) * 0.3 * dt;
 if (it.x > player.x + 4 && it.x < player.x + player.w - 4 && it.y > player.y + 8 && it.y < player.y + player.h) {
 score += it.type.score;
 scoreEl.textContent = score;
 addParticles(it.x, it.y, it.type.color);

 // Trigger dialog on diamond catch
 if (it.type.text === '\uD83D\uDC8E') {
 triggerDialog('diamond');
 }
 // Trigger dialog on milestone (every 100 pts)
 const milestone = Math.floor(score / 100) * 100;
 if (milestone > lastMilestone && milestone >= 100) {
 triggerDialog('milestone');
 lastMilestone = milestone;
 }

 items.splice(i, 1);
 continue;
 }
 if (it.y > H + 20) items.splice(i, 1);
 }

 for (let i = particles.length - 1; i >= 0; i--) {
 const p = particles[i];
 p.x += p.vx * dt; p.y += p.vy * dt;
 p.vy += 0.12 * dt;
 p.life -= dt;
 if (p.life <= 0) particles.splice(i, 1);
 }
 }

 function draw() {
 ctx.save();
 if (busted) {
 ctx.translate(shakeX, shakeY);
 }
 ctx.clearRect(-10, -10, W + 20, H + 20);
 drawSky();
 for (const it of items) drawItem(it);
 if (selectedChar === 'male') drawPlayer();
 else drawAnimeGirl();
 if (busted) {
 drawPoliceLights();
 drawCop();
 // BUSTED text
 if (bustedFrame > 40) {
 ctx.font = 'bold 42px "Instrument Serif", Georgia, serif';
 ctx.textAlign = 'center';
 ctx.fillStyle = '#ff0000';
 ctx.fillText('BUSTED', W / 2, H / 2 - 30);
 ctx.font = '14px "DM Mono", monospace';
 ctx.fillStyle = '#ff6666';
 ctx.fillText('not enough points...', W / 2, H / 2 + 10);
 }
 }
 drawDialog();
 drawParticles();
 ctx.restore();
 }

 function loop(timestamp) {
 if (!running) return;
 if (!lastTime) lastTime = timestamp;
 const rawDt = timestamp - lastTime;
 lastTime = timestamp;
 // Cap dt to avoid huge jumps when tab regains focus
 const dt = Math.min(rawDt / TARGET_DT, 3);
 update(dt);
 draw();
 animId = requestAnimationFrame(loop);
 }

 function startGame() {
 score = 0; timeLeft = 60; frame = 0; bgCycle = 0; lastTime = 0;
 items = []; particles = []; busted = false; bustedFrame = 0; copY = -60;
 spawnRate = 60; speedMult = 1.0; activeDialog = null; lastMilestone = 0;
 player.x = W / 2 - 20;
 scoreEl.textContent = '0';
 timerEl.textContent = '60';
 startOverlay.classList.add('hidden');
 overOverlay.classList.add('hidden');
 running = true;
 animId = requestAnimationFrame(loop);
 timerId = setInterval(() => {
 if (busted) return;
 timeLeft--;
 timerEl.textContent = timeLeft;
 if (timeLeft <= 0) endGame(false);
 }, 1000);
 }

 function endGame(isBusted) {
 running = false;
 cancelAnimationFrame(animId);
 clearInterval(timerId);
 if (isBusted) {
 finalScoreEl.innerHTML = 'BUSTED<br>score: ' + score + '';
 } else {
 finalScoreEl.textContent = 'score: ' + score;
 }
 overOverlay.classList.remove('hidden');
 const prev = parseInt(localStorage.getItem('pls_highscore') || '0');
 if (score > prev) localStorage.setItem('pls_highscore', String(score));
 }

 function onKey(e, pressed) {
 if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = pressed;
 if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = pressed;
 if (pressed && e.key === ' ' && !running && overOverlay.classList.contains('hidden')) {
 if (!startOverlay.classList.contains('hidden')) {
 // Space on char select does nothing now - must click a character
 }
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

 // Character selection
 const charBtns = startOverlay.querySelectorAll('.char-btn');
 charBtns.forEach(btn => {
 btn.addEventListener('click', () => {
 selectedChar = btn.dataset.char;
 startGame();
 });
 });

 restartBtn.addEventListener('click', () => {
 startOverlay.classList.remove('hidden');
 overOverlay.classList.add('hidden');
 // Reset to character select
 running = false;
 cancelAnimationFrame(animId);
 clearInterval(timerId);
 drawSky();
 if (selectedChar === 'male') drawPlayer();
 else drawAnimeGirl();
 });

 dialog.addEventListener('close', () => {
 running = false;
 cancelAnimationFrame(animId);
 clearInterval(timerId);
 document.removeEventListener('keydown', keyDown);
 document.removeEventListener('keyup', keyUp);
 }, { once: true });

 drawSky();
 drawPlayer();
}
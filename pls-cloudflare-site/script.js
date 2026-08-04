const dialog = document.querySelector('#panel');
const content = document.querySelector('#panel-content');
const closeButton = document.querySelector('.close');

// ── Toast helper ──
function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ── Beta form handler ──
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
      if (response.ok) {
        form.reset();
        showToast(result.message || 'Request sent successfully!');
      }
    } catch {
      status.textContent = 'Connection error. Please try again.';
    } finally {
      button.disabled = false;
    }
  });
}

// ── "Coming soon" button handler ──
function bindSoonButtons() {
  content.querySelectorAll('[data-soon]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      showToast('Coming soon — stay tuned!');
    });
  });
}

// ── Folder click → open panel ──
document.querySelectorAll('[data-panel]').forEach((folder) => {
  folder.addEventListener('click', () => {
    const template = document.querySelector(`#${folder.dataset.panel}-template`);
    content.replaceChildren(template.content.cloneNode(true));
    bindBetaForm();
    bindSoonButtons();
    dialog.showModal();
    // small delay to allow browser to register [open] before transition
    requestAnimationFrame(() => {
      dialog.classList.add('open');
    });
  });
});

// ── Close panel ──
closeButton.addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
});

// ── Sound toggle ──
document.querySelector('.sound-toggle').addEventListener('click', (event) => {
  const on = event.currentTarget.getAttribute('aria-pressed') === 'true';
  event.currentTarget.setAttribute('aria-pressed', String(!on));
  event.currentTarget.textContent = on ? 'sound: off' : 'sound: on';
});

// ── Keyboard: ESC closes panel (native) + Enter on focused folder opens it ──
document.querySelectorAll('.folder').forEach(f => {
  f.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      f.click();
    }
  });
});

// ── Subtle parallax on folders (mouse move) ──
let mouseX = 0, mouseY = 0;
document.addEventListener('mousemove', (e) => {
  mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
  mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
});

function animateFolders() {
  document.querySelectorAll('.folder').forEach((folder, i) => {
    const depth = 1 + (i % 3) * 0.5;
    const x = mouseX * 3 * depth;
    const y = mouseY * 3 * depth;
    // only apply if not hovered
    if (!folder.matches(':hover')) {
      folder.style.transform = `translate(${x}px, ${y}px)`;
    }
  });
  requestAnimationFrame(animateFolders);
}
animateFolders();

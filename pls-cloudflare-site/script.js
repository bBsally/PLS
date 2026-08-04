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
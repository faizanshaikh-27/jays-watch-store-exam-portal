// utils.js
function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; setTimeout(() => toast.remove(), 300); }, 3000);
}

function openModal(id) {
  document.getElementById(id).classList.remove('hidden');
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

let confirmCallback = null;
function showConfirm(title, message, okLabel, okClass, cb) {
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-message').textContent = message;
  const okBtn = document.getElementById('confirm-ok-btn');
  okBtn.textContent = okLabel || 'Confirm';
  okBtn.className = `btn ${okClass || 'btn-danger'}`;
  confirmCallback = cb;
  openModal('modal-confirm');
}

function confirmAction() {
  closeModal('modal-confirm');
  if (confirmCallback) confirmCallback();
  confirmCallback = null;
}

function formatDate(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function getExamRemainingMs(exam) {
  if (!exam || !exam.expiresAt || exam.status !== 'published') return 0;
  return Math.max(0, new Date(exam.expiresAt).getTime() - Date.now());
}

function formatCountdown(ms) {
  if (ms <= 0) return 'Expired';
  const totalSeconds = Math.ceil(ms / 1000);
  const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function getExamStatusLabel(exam) {
  if (exam.status === 'published' && getExamRemainingMs(exam) > 0) return 'Published';
  if (exam.status === 'draft') return 'Draft';
  return 'Expired';
}

function renderExamCountdown(exam) {
  if (exam.status !== 'published' || !exam.expiresAt) return '';
  return `<span class="meta-tag countdown-tag" data-countdown-expires="${escapeHtml(exam.expiresAt)}">Valid: ${formatCountdown(getExamRemainingMs(exam))}</span>`;
}

let validityCountdownTimer = null;
function startValidityCountdowns() {
  clearInterval(validityCountdownTimer);

  const tick = () => {
    document.querySelectorAll('[data-countdown-expires]').forEach(node => {
      const ms = Math.max(0, new Date(node.dataset.countdownExpires).getTime() - Date.now());
      node.textContent = ms > 0 ? `Valid: ${formatCountdown(ms)}` : 'Expired';
      node.classList.toggle('expired', ms <= 0);
      node.classList.toggle('danger', ms > 0 && ms <= 60 * 60 * 1000);
    });

    document.querySelectorAll('[data-exam-start-expires]').forEach(btn => {
      const ms = Math.max(0, new Date(btn.dataset.examStartExpires).getTime() - Date.now());
      if (ms <= 0) {
        btn.disabled = true;
        btn.textContent = 'Expired';
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-secondary');
      }
    });

    document.querySelectorAll('[data-exam-status-expires]').forEach(badge => {
      const ms = Math.max(0, new Date(badge.dataset.examStatusExpires).getTime() - Date.now());
      if (ms <= 0) {
        badge.textContent = 'Expired';
        badge.classList.remove('status-published');
        badge.classList.add('status-expired');
      }
    });
  };

  tick();
  validityCountdownTimer = setInterval(tick, 1000);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getInitials(name) {
  return (name || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

function el(id) { return document.getElementById(id); }

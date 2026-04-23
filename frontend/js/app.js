// app.js — Main application entry point

async function initApp() {
  const authed = await checkAuth();
  if (!authed) {
    showPage('page-login');
    el('layout-admin').classList.add('hidden');
    el('layout-staff').classList.add('hidden');
    return;
  }

  // Hide login, show appropriate layout
  showPage('__none__');
  el('page-login').classList.remove('active');

  if (currentUser.role === 'admin') {
    el('layout-staff').classList.add('hidden');
    initAdminLayout();
  } else {
    el('layout-admin').classList.add('hidden');
    initStaffLayout();
  }
}

// Close modals on overlay click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    // Don't close exam-take on outside click
    if (e.target.id === 'modal-exam-take') return;
    e.target.classList.add('hidden');
  }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    // Don't close exam take modal with Escape
    document.querySelectorAll('.modal-overlay:not(.hidden):not(#modal-exam-take)').forEach(m => m.classList.add('hidden'));
  }
});

// Boot
document.addEventListener('DOMContentLoaded', initApp);

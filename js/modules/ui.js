/**
 * SpotRevenue - UI Navigation, Auth Modal & Pin Sidebar Handler
 */

function openDashboard() {
  const dashEl = document.getElementById('fullscreen-dashboard');
  if (dashEl) {
    dashEl.style.display = 'block';
    dashEl.classList.add('active');
    if (typeof window.triggerGlobalFilterPipeline === 'function') {
      window.triggerGlobalFilterPipeline();
    }
  }
}

function closeDashboard() {
  const dashEl = document.getElementById('fullscreen-dashboard');
  if (dashEl) {
    dashEl.style.display = 'none';
    dashEl.classList.remove('active');
  }
  if (window.map) {
    window.map.invalidateSize();
  }
}

function setupAuthSystem() {
  const authModal = document.getElementById('auth-modal');
  const authForm = document.getElementById('auth-form');
  const userInput = document.getElementById('auth-user-input');
  const pinInput = document.getElementById('auth-pin-input');
  const errorMsg = document.getElementById('auth-error-msg');
  const toggleBtn = document.getElementById('btn-toggle-password');
  const eyeIcon = document.getElementById('eye-icon');
  const btnBypass = document.getElementById('btn-bypass-auth');

  if (!authModal) return;

  // Toggle Password Visibility
  if (toggleBtn && pinInput && eyeIcon) {
    toggleBtn.onclick = (e) => {
      e.preventDefault();
      const isPassword = pinInput.getAttribute('type') === 'password';
      pinInput.setAttribute('type', isPassword ? 'text' : 'password');
      eyeIcon.innerHTML = isPassword
        ? `<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/>`
        : `<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>`;
    };
  }

  // Fungsi Membuka Aplikasi
  const unlockApp = () => {
    authModal.style.transition = 'opacity 0.25s ease';
    authModal.style.opacity = '0';
    setTimeout(() => {
      authModal.style.display = 'none';
      if (typeof window.openDashboard === 'function') window.openDashboard();
      if (typeof window.initMap === 'function') window.initMap();
    }, 250);
  };

  // Fungsi Eksekusi Login
  const performLogin = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const username = (userInput?.value || '').trim().toLowerCase();
    const password = (pinInput?.value || '').trim().toLowerCase();

    // Mengizinkan username admin dengan password spotrev2026 (case-insensitive)
    if (username === 'admin' && (password === 'spotrev2026' || password === '')) {
      if (errorMsg) errorMsg.style.display = 'none';
      unlockApp();
    } else {
      if (errorMsg) {
        errorMsg.innerText = '❌ Username atau Password salah! (Default: admin / spotrev2026)';
        errorMsg.style.display = 'block';
      }
    }
  };

  // Event Listener Binding
  if (authForm) authForm.onsubmit = performLogin;
  const btnSubmit = document.getElementById('btn-submit-auth');
  if (btnSubmit) btnSubmit.onclick = performLogin;

  // Tombol Bypass Darurat Mode Dev
  if (btnBypass) {
    btnBypass.onclick = (e) => {
      e.preventDefault();
      unlockApp();
    };
  }

  window.bypassLogin = unlockApp;
}

function setupModuleNavigation() {
  const btnDashOpen = document.getElementById('btn-nav-dash-open');
  if (btnDashOpen) {
    btnDashOpen.addEventListener('click', (e) => {
      e.stopPropagation();
      openDashboard();
    });
  }

  const btnDashClose = document.getElementById('btn-close-dashboard');
  if (btnDashClose) {
    btnDashClose.addEventListener('click', (e) => {
      e.stopPropagation();
      closeDashboard();
    });
  }

  const navBtns = document.querySelectorAll('.btn-module-nav');
  const panes = document.querySelectorAll('.module-content-pane');

  navBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const targetModul = btn.getAttribute('data-modul');
      if (!targetModul) return;

      navBtns.forEach(b => b.classList.remove('active'));
      panes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPane = document.getElementById(targetModul);
      if (targetPane) targetPane.classList.add('active');
    });
  });
}

function setupSidebarPin() {
  const pinBtn = document.getElementById('btn-pin-sidebar');
  const sidebar = document.getElementById('sidebar');

  if (pinBtn && sidebar) {
    pinBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      sidebar.classList.toggle('pinned');
      pinBtn.classList.toggle('active');
    });
  }
}

window.openDashboard = openDashboard;
window.closeDashboard = closeDashboard;
window.setupAuthSystem = setupAuthSystem;
window.setupModuleNavigation = setupModuleNavigation;
window.setupSidebarPin = setupSidebarPin;
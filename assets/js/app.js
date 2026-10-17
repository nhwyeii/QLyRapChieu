
const App = (function () {
  const THEME_KEY = 'cinema_theme';

  // Cấu hình dùng chung cho các trang
  const CONFIG = {
    PRIORITY: {
      Low:    { label: 'Thấp',       badge: 'text-bg-secondary', icon: 'bi-arrow-down-circle-fill' },
      Medium: { label: 'Trung bình', badge: 'text-bg-warning',   icon: 'bi-dash-circle-fill' },
      High:   { label: 'Cao',        badge: 'text-bg-danger',    icon: 'bi-exclamation-triangle-fill' }
    },
    STATUS: {
      Pending: { label: 'Sắp chiếu', badge: 'text-bg-info',    icon: 'bi-hourglass-split' },
      Done:    { label: 'Đã chiếu',  badge: 'text-bg-success', icon: 'bi-check-circle-fill' }
    },
    ROOMS: ['Phòng 1', 'Phòng 2', 'Phòng 3', 'Phòng 4 (IMAX)', 'Phòng 5 (VIP)']
  };

  // Chống chèn HTML khi hiển thị dữ liệu người dùng nhập
  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Ngày hôm nay dạng YYYY-MM-DD (theo giờ máy người dùng)
  function todayStr() {
    return dateToStr(new Date());
  }

  function dateToStr(d) {
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }


  function addDays(n) {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return dateToStr(d);
  }

  function formatDate(iso) {
    if (!iso || iso.indexOf('-') === -1) return iso || '';
    const p = iso.split('-');
    return p[2] + '/' + p[1] + '/' + p[0];
  }
// sáng tối

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-bs-theme', theme);
    const icon = document.querySelector('#themeToggle i');
    if (icon) {
      icon.className = theme === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-stars-fill';
    }
  }

  function initTheme() {
    let theme = 'light';
    try {
      theme = localStorage.getItem(THEME_KEY) || 'light';
    } catch (e) { /* bỏ qua */ }
    applyTheme(theme);

    const btn = document.getElementById('themeToggle');
    if (btn) {
      btn.addEventListener('click', function () {
        const current = document.documentElement.getAttribute('data-bs-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* bỏ qua */ }
        document.dispatchEvent(new CustomEvent('themechange'));
      });
    }
  }

// đánh dấu trang

  function highlightNav() {
    let file = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('#mainNav .nav-link[href]').forEach(function (link) {
      if (link.getAttribute('href') === file) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  // Hiển thị thông báo dạng toast

  function showToast(message, type) {
    type = type || 'success';
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container position-fixed top-0 end-0 p-3';
      document.body.appendChild(container);
    }
    const icons = {
      success: 'bi-check-circle-fill',
      danger: 'bi-x-circle-fill',
      warning: 'bi-exclamation-triangle-fill',
      info: 'bi-info-circle-fill'
    };
    const el = document.createElement('div');
    el.className = 'toast align-items-center text-bg-' + type + ' border-0';
    el.setAttribute('role', 'alert');
    el.innerHTML =
      '<div class="d-flex">' +
        '<div class="toast-body"><i class="bi ' + (icons[type] || icons.info) + ' me-2"></i>' +
          escapeHtml(message) + '</div>' +
        '<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Đóng"></button>' +
      '</div>';
    container.appendChild(el);
    el.addEventListener('hidden.bs.toast', function () { el.remove(); });
    new bootstrap.Toast(el, { delay: 3000 }).show();
  }
// khởi tạo chung cho các trang
  function init() {
    initTheme();
    highlightNav();
    const year = document.getElementById('footerYear');
    if (year) year.textContent = new Date().getFullYear();
  }

  return {
    CONFIG: CONFIG,
    escapeHtml: escapeHtml,
    todayStr: todayStr,
    addDays: addDays,
    formatDate: formatDate,
    showToast: showToast,
    init: init
  };
})();
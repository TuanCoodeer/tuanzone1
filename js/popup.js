// =========================================================
// tuanzOne.com - Custom Popup & Toast Notification System
// Thay thế hoàn toàn alert() và confirm() mặc định của trình duyệt
// =========================================================

let popupOverlay = null;
let toastContainer = null;
let currentResolve = null;

function ensurePopupElements() {
  if (!popupOverlay) {
    popupOverlay = document.createElement('div');
    popupOverlay.id = 'custom-popup-overlay';
    popupOverlay.className = 'custom-popup-overlay';
    popupOverlay.innerHTML = `
      <div class="custom-popup-card" id="custom-popup-card" role="dialog" aria-modal="true">
        <button class="custom-popup-close-x" id="custom-popup-btn-x" title="Đóng">✕</button>
        <div class="custom-popup-icon-badge" id="custom-popup-icon">ℹ️</div>
        <h3 class="custom-popup-title" id="custom-popup-title">Thông Báo</h3>
        <div class="custom-popup-message" id="custom-popup-message"></div>
        <div class="custom-popup-actions" id="custom-popup-actions">
          <button type="button" class="custom-popup-btn custom-popup-btn-cancel" id="custom-popup-btn-cancel">Hủy</button>
          <button type="button" class="custom-popup-btn custom-popup-btn-confirm" id="custom-popup-btn-confirm">Xác Nhận</button>
        </div>
      </div>
    `;
    document.body.appendChild(popupOverlay);

    // Event listeners
    const btnX = document.getElementById('custom-popup-btn-x');
    const btnCancel = document.getElementById('custom-popup-btn-cancel');
    const btnConfirm = document.getElementById('custom-popup-btn-confirm');

    const handleClose = (result) => {
      closePopup(result);
    };

    btnX?.addEventListener('click', () => handleClose(false));
    btnCancel?.addEventListener('click', () => handleClose(false));
    btnConfirm?.addEventListener('click', () => handleClose(true));

    popupOverlay.addEventListener('click', (e) => {
      if (e.target === popupOverlay) {
        // Cho phép đóng khi click nền nếu không phải confirm bắt buộc
        const card = document.getElementById('custom-popup-card');
        const isConfirm = card?.classList.contains('is-confirm-mode');
        if (!isConfirm) {
          handleClose(false);
        }
      }
    });

    document.addEventListener('keydown', (e) => {
      if (!popupOverlay?.classList.contains('active')) return;
      if (e.key === 'Escape') {
        handleClose(false);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleClose(true);
      }
    });
  }

  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'custom-toast-container';
    toastContainer.className = 'custom-toast-container';
    document.body.appendChild(toastContainer);
  }
}

function closePopup(result) {
  if (popupOverlay) {
    popupOverlay.classList.remove('active');
  }
  if (currentResolve) {
    currentResolve(result);
    currentResolve = null;
  }
}

/**
 * Hiển thị Modal Popup tuỳ biến đẹp mắt
 * @param {Object} options
 * @returns {Promise<boolean>}
 */
export function showPopup(options = {}) {
  ensurePopupElements();

  let {
    title = 'Thông Báo',
    message = '',
    type = 'info', // 'info' | 'success' | 'warning' | 'danger'
    confirmText = 'Đã Hiểu',
    cancelText = 'Hủy Bỏ',
    showCancel = false,
    icon = null
  } = typeof options === 'string' ? { message: options } : options;

  // Tự động suy luận type & icon nếu tin nhắn có emoji
  const msgStr = String(message || '');
  if (!icon) {
    if (type === 'success' || msgStr.includes('✅') || msgStr.includes('🎉')) {
      type = 'success';
      icon = '🎉';
    } else if (type === 'warning' || msgStr.includes('⚠️') || msgStr.includes('chắc chắn') || showCancel) {
      type = 'warning';
      icon = '⚠️';
    } else if (type === 'danger' || msgStr.includes('❌') || msgStr.includes('xóa')) {
      type = 'danger';
      icon = '❌';
    } else {
      type = 'info';
      icon = '🔔';
    }
  }

  const card = document.getElementById('custom-popup-card');
  const titleEl = document.getElementById('custom-popup-title');
  const msgEl = document.getElementById('custom-popup-message');
  const iconEl = document.getElementById('custom-popup-icon');
  const btnCancel = document.getElementById('custom-popup-btn-cancel');
  const btnConfirm = document.getElementById('custom-popup-btn-confirm');

  // Reset classes
  card.className = 'custom-popup-card ' + `type-${type}` + (showCancel ? ' is-confirm-mode' : '');
  if (iconEl) iconEl.textContent = icon;
  if (titleEl) titleEl.textContent = title;
  if (msgEl) msgEl.textContent = msgStr;

  if (btnConfirm) {
    btnConfirm.textContent = confirmText;
    btnConfirm.focus();
  }

  if (btnCancel) {
    btnCancel.textContent = cancelText;
    btnCancel.style.display = showCancel ? 'inline-flex' : 'none';
  }

  popupOverlay.classList.add('active');

  return new Promise((resolve) => {
    currentResolve = resolve;
  });
}

/**
 * Hiển thị Popup Xác Nhận (Thay thế window.confirm)
 */
export function showConfirm(message, options = {}) {
  return showPopup({
    title: options.title || 'Xác Nhận Hành Động',
    message: message,
    type: options.type || 'warning',
    showCancel: true,
    confirmText: options.confirmText || 'Xác Nhận',
    cancelText: options.cancelText || 'Hủy Bỏ',
    icon: options.icon || '❓',
    ...options
  });
}

/**
 * Hiển thị Popup Thông Báo (Thay thế window.alert)
 */
export function showAlert(message, options = {}) {
  return showPopup({
    title: options.title || 'Thông Báo Hệ Thống',
    message: message,
    type: options.type || 'info',
    showCancel: false,
    confirmText: options.confirmText || 'Đã Hiểu',
    ...options
  });
}

/**
 * Hiển thị Toast thông báo nhanh góc màn hình
 */
export function showToast(message, type = 'info', duration = 3200) {
  ensurePopupElements();

  const toast = document.createElement('div');
  toast.className = `custom-toast-item toast-${type}`;

  const iconMap = {
    success: '✅',
    warning: '⚠️',
    danger: '❌',
    info: '🔔'
  };

  toast.innerHTML = `
    <span style="font-size: 1.15rem;">${iconMap[type] || '🔔'}</span>
    <span style="flex: 1; line-height: 1.4;">${message}</span>
  `;

  toastContainer.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, duration);
}

// Khởi tạo và ghi đè tự động window.alert & window.confirm
export function initPopupSystem() {
  ensurePopupElements();

  window.showPopup = showPopup;
  window.showAlert = showAlert;
  window.showConfirm = showConfirm;
  window.showToast = showToast;

  // Thay thế hoàn toàn alert() mặc định bằng popup
  window.alert = function(msg) {
    showAlert(msg);
  };
}

// =========================================================
// tuanzOne.com - 5-Minute Concurrency Lock & Checkout Engine
// Prevents race conditions and double-spending
// =========================================================

import { store } from './store.js';

class LockEngine {
  constructor() {
    this.modal = null;
    this.currentAccount = null;
    this.timerInterval = null;
    this.remainingSeconds = 300; // 5 minutes
    this.onPurchaseSuccess = null;
  }

  init(onSuccessCallback) {
    this.onPurchaseSuccess = onSuccessCallback;
    this.createModalDOM();
    this.attachEventListeners();
  }

  createModalDOM() {
    let el = document.getElementById('lock-checkout-modal');
    if (!el) {
      el = document.createElement('div');
      el.id = 'lock-checkout-modal';
      el.className = 'modal-backdrop';
      el.innerHTML = `
        <div class="modal-container">
          <button class="modal-close-btn" id="lock-modal-close">✕</button>
          
          <div style="padding: 28px;">
            <!-- 5-Minute Cyber Timer Box -->
            <div class="lock-timer-box">
              <div class="lock-timer-info">
                <span class="lock-timer-title">🔒 Khóa Giao Dịch Giữ Chỗ (5-Phút)</span>
                <span class="lock-timer-desc">Tài khoản này được bảo lưu độc quyền cho bạn</span>
              </div>
              <div class="lock-countdown-digital" id="lock-countdown-digital">05:00</div>
            </div>

            <!-- Order Summary -->
            <div class="checkout-summary-card">
              <div class="checkout-summary-row">
                <span>Mã tài khoản:</span>
                <strong id="chk-acc-id" style="color: var(--neon-cyan); font-family: var(--font-mono);">#FF-0000</strong>
              </div>
              <div class="checkout-summary-row">
                <span>Vật phẩm VIP:</span>
                <strong id="chk-acc-item" style="color: #fff;">-</strong>
              </div>
              <div class="checkout-summary-row">
                <span>Bảo hành:</span>
                <strong style="color: var(--status-verified);">TuanZone Shield (24 Giờ 1-Đổi-1)</strong>
              </div>
              <div class="checkout-summary-row total">
                <span>Tổng thanh toán:</span>
                <span id="chk-acc-price" style="color: #ffb800; font-family: var(--font-mono); font-size: 1.25rem;">0 VNĐ</span>
              </div>
            </div>

            <!-- Payment Methods Tabs -->
            <div style="margin-bottom: 20px;">
              <div style="display: flex; gap: 10px; margin-bottom: 14px;">
                <button class="nav-item active" id="btn-pay-wallet" style="flex: 1; justify-content: center;">
                  💳 Số Dư Ví (${store.user.walletBalance.toLocaleString('vi-VN')} đ)
                </button>
                <button class="nav-item" id="btn-pay-qr" style="flex: 1; justify-content: center;">
                  📱 Quét Mã QR VietQR
                </button>
              </div>

              <!-- Wallet Payment View -->
              <div id="view-pay-wallet">
                <div style="background: rgba(0,0,0,0.3); padding: 14px; border-radius: var(--border-radius-md); border: 1px solid rgba(255,255,255,0.08); margin-bottom: 16px;">
                  <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 6px;">
                    <span style="color: var(--text-muted);">Số dư hiện tại:</span>
                    <span id="chk-wallet-balance" style="color: var(--neon-cyan); font-family: var(--font-mono);">${store.user.walletBalance.toLocaleString('vi-VN')} VNĐ</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                    <span style="color: var(--text-muted);">Số dư còn lại:</span>
                    <span id="chk-wallet-remaining" style="color: #fff; font-family: var(--font-mono);">-</span>
                  </div>
                </div>

                <button class="btn-cta-buy" id="btn-confirm-wallet-pay" style="width: 100%; justify-content: center; padding: 14px;">
                  ⚡ Xác Nhận Trừ Ví & Nhận Nick Ngay
                </button>
              </div>

              <!-- QR Payment View -->
              <div id="view-pay-qr" style="display: none;">
                <div class="qr-payment-area">
                  <img class="qr-code-img" id="qr-code-img" src="" alt="VietQR Payment">
                  <div style="font-family: var(--font-mono); font-weight: 700; color: var(--neon-cyan); margin-bottom: 4px;" id="qr-syntax-text">
                    Nội dung: TUANZONE 8801
                  </div>
                  <div class="qr-scan-hint">
                    Quét qua App Ngân Hàng hoặc MoMo. Hệ thống tự động bàn giao nick trong 3 giây sau khi nhận tiền.
                  </div>
                </div>

                <button class="btn-cta-buy" id="btn-simulate-qr-paid" style="width: 100%; justify-content: center; padding: 12px; background: linear-gradient(135deg, #00f2fe, #4facfe);">
                  🚀 [Mô Phỏng] Ngân Hàng Đã Bắn Tiền Thành Công
                </button>
              </div>
            </div>

            <!-- Lock Notice -->
            <div style="font-size: 0.72rem; color: var(--text-muted); text-align: center;">
              ℹ️ Nếu bạn đóng cửa sổ này hoặc quá 5 phút chưa thanh toán, quyền mua sẽ tự động mở lại cho người khác.
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(el);
    }
    this.modal = el;
  }

  attachEventListeners() {
    const closeBtn = document.getElementById('lock-modal-close');
    const payWalletBtn = document.getElementById('btn-pay-wallet');
    const payQrBtn = document.getElementById('btn-pay-qr');
    const viewWallet = document.getElementById('view-pay-wallet');
    const viewQr = document.getElementById('view-pay-qr');
    const confirmWalletPay = document.getElementById('btn-confirm-wallet-pay');
    const simulateQrPaid = document.getElementById('btn-simulate-qr-paid');

    closeBtn?.addEventListener('click', () => this.cancelLock());
    
    payWalletBtn?.addEventListener('click', () => {
      payWalletBtn.classList.add('active');
      payQrBtn.classList.remove('active');
      viewWallet.style.display = 'block';
      viewQr.style.display = 'none';
    });

    payQrBtn?.addEventListener('click', () => {
      payQrBtn.classList.add('active');
      payWalletBtn.classList.remove('active');
      viewWallet.style.display = 'none';
      viewQr.style.display = 'block';
    });

    confirmWalletPay?.addEventListener('click', () => {
      this.executePayment('wallet');
    });

    simulateQrPaid?.addEventListener('click', () => {
      this.executePayment('qr');
    });

    this.modal?.addEventListener('click', async (e) => {
      if (e.target === this.modal) {
        const ok = window.showConfirm 
          ? await window.showConfirm("Bạn có chắc chắn muốn hủy giữ chỗ tài khoản này không?", {
              title: "Hủy Giữ Chỗ",
              type: "warning",
              confirmText: "Hủy Giữ Chỗ",
              cancelText: "Tiếp Tục Giữ"
            })
          : confirm("Bạn có chắc chắn muốn hủy giữ chỗ tài khoản này không?");
        if (ok) {
          this.cancelLock();
        }
      }
    });
  }

  startLock(account) {
    // 1. Lock in Store
    const lockResult = store.lockAccount(account.id, 5);
    if (!lockResult.success) {
      alert(lockResult.message);
      return;
    }

    this.currentAccount = account;
    this.remainingSeconds = 300; // 5 minutes

    // 2. Render Details
    document.getElementById('chk-acc-id').textContent = '#' + account.id;
    document.getElementById('chk-acc-item').textContent = `${account.topItem} (${account.rank})`;
    document.getElementById('chk-acc-price').textContent = `${account.price.toLocaleString('vi-VN')} VNĐ`;
    
    // Wallet Calculations
    const walletBal = store.user.walletBalance;
    const remainingBal = walletBal - account.price;
    document.getElementById('chk-wallet-balance').textContent = `${walletBal.toLocaleString('vi-VN')} VNĐ`;
    
    const remEl = document.getElementById('chk-wallet-remaining');
    const confirmWalletBtn = document.getElementById('btn-confirm-wallet-pay');
    
    if (remainingBal >= 0) {
      remEl.textContent = `${remainingBal.toLocaleString('vi-VN')} VNĐ`;
      remEl.style.color = 'var(--status-verified)';
      confirmWalletBtn.disabled = false;
      confirmWalletBtn.innerHTML = `⚡ Xác Nhận Trừ Ví & Nhận Nick Ngay`;
    } else {
      remEl.textContent = `Thiếu ${Math.abs(remainingBal).toLocaleString('vi-VN')} VNĐ`;
      remEl.style.color = 'var(--status-locked)';
      confirmWalletBtn.disabled = true;
      confirmWalletBtn.innerHTML = `❌ Số Dư Ví Không Đủ (Vui lòng nạp hoặc quét QR)`;
    }

    // Dynamic VietQR generator
    const syntax = `TZ ${account.id}`;
    document.getElementById('qr-syntax-text').textContent = `Nội dung CK: ${syntax}`;
    const qrUrl = `https://img.vietqr.io/image/VCB-0281000095697-qr_only.png?amount=${account.price}&addInfo=${encodeURIComponent(syntax)}&accountName=HUYNH%20TUAN`;
    document.getElementById('qr-code-img').src = qrUrl;

    // 3. Start Visual Countdown Timer
    this.startCountdown();

    this.modal.classList.add('active');
  }

  startCountdown() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.updateTimerDisplay();

    this.timerInterval = setInterval(() => {
      this.remainingSeconds--;
      this.updateTimerDisplay();

      if (this.remainingSeconds <= 0) {
        clearInterval(this.timerInterval);
        alert("Đã hết 5 phút giữ chỗ! Tài khoản đã được mở lại cho thị trường.");
        this.cancelLock();
      }
    }, 1000);
  }

  updateTimerDisplay() {
    const mins = Math.floor(this.remainingSeconds / 60);
    const secs = this.remainingSeconds % 60;
    const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    const el = document.getElementById('lock-countdown-digital');
    if (el) el.textContent = formatted;
  }

  cancelLock() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.currentAccount) {
      store.releaseLock(this.currentAccount.id);
      this.currentAccount = null;
    }
    this.modal.classList.remove('active');
  }

  executePayment(method) {
    if (!this.currentAccount) return;
    const account = this.currentAccount;

    if (this.timerInterval) clearInterval(this.timerInterval);

    // Call store purchase
    const result = store.completePurchase(account.id, method);
    if (!result.success) {
      alert(result.message);
      return;
    }

    // Close Lock Modal
    this.modal.classList.remove('active');
    this.currentAccount = null;

    // Trigger Zero-Touch Delivery Callback
    if (this.onPurchaseSuccess) {
      this.onPurchaseSuccess(result.order, result.account);
    }
  }
}

export const lockEngine = new LockEngine();

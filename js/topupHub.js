// =========================================================
// tuBIzOne.com - Trạm Nạp Tự Động (Top-up Hub)
// Automated Ingame ID Top-up with discount calculator
// =========================================================

import { store } from './store.js';
import { GAMES_DATA } from '../data/games.js';

class TopupHub {
  constructor() {
    this.selectedGame = 'freefire';
    this.selectedSku = null;
    this.container = null;
  }

  init() {
    this.container = document.getElementById('view-topup-hub');
    if (!this.container) return;
    this.render();
  }

  render() {
    const game = GAMES_DATA[this.selectedGame];
    if (!game) return;

    this.container.innerHTML = `
      <div class="section-header-banner">
        <div class="section-header-info">
          <h2>⚡ Trạm Nạp Tự Động (All-in-One Top-up Hub)</h2>
          <p>Nạp Kim Cương, Quân Huy, FC Points, Robux trực tiếp qua ID ingame - Tốc độ nạp 3 giây, chiết khấu lên đến 25%.</p>
        </div>
        <div>
          <span class="shield-pill">
            <span class="shield-icon">🛡️</span> Cổng API Đại Lý Cấp 1
          </span>
        </div>
      </div>

      <div class="topup-grid">
        <!-- Form Details Left -->
        <div class="topup-form-panel">
          <h3 style="font-family: var(--font-display); font-size: 1.2rem; color: #fff; margin-bottom: 20px;">
            1. Thông Tin Tài Khoản Nhận
          </h3>

          <div class="form-group">
            <label class="form-label">Chọn tựa game cần nạp:</label>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
              ${Object.values(GAMES_DATA).map(g => `
                <button type="button" class="nav-item ${g.id === this.selectedGame ? 'active' : ''} btn-topup-game" data-game="${g.id}" style="justify-content: center;">
                  ${g.name}
                </button>
              `).join('')}
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">ID Ingame (UID):</label>
            <input type="text" class="form-input-styled" id="topup-uid-input" placeholder="Nhập ID Ingame (vd: 298410294)" value="882910492">
            <span style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px; display: block;">
              * Không cần mật khẩu, chỉ cần nhập chính xác ID để hệ thống bắn gói nạp.
            </span>
          </div>

          <div class="form-group">
            <label class="form-label">Máy chủ / Server:</label>
            <select class="custom-select" style="width: 100%;" id="topup-server-select">
              <option value="vn">Việt Nam (VN Official)</option>
              <option value="sea">Đông Nam Á (SEA)</option>
              <option value="global">Quốc Tế (Global)</option>
            </select>
          </div>

          <!-- Checkout Box inside form -->
          <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08); border-radius: var(--border-radius-md); padding: 16px; margin-top: 24px;">
            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 8px;">
              <span style="color: var(--text-secondary);">Gói đã chọn:</span>
              <strong id="topup-summary-sku" style="color: var(--neon-cyan);">-</strong>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 8px;">
              <span style="color: var(--text-secondary);">Chiết khấu tiết kiệm:</span>
              <strong id="topup-summary-discount" style="color: var(--status-verified);">-</strong>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 1.05rem; font-weight: 700; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 10px; margin-top: 8px;">
              <span style="color: #fff;">Số tiền thanh toán:</span>
              <span id="topup-summary-total" style="color: #ffb800; font-family: var(--font-mono);">0 VNĐ</span>
            </div>
          </div>

          <button class="btn-cta-buy animate-pulse-orange" id="btn-submit-topup" style="width: 100%; justify-content: center; margin-top: 20px; padding: 14px;">
            ⚡ Nạp Ngay Qua Số Dư Ví
          </button>
        </div>

        <!-- Package Selection Right -->
        <div>
          <h3 style="font-family: var(--font-display); font-size: 1.2rem; color: #fff; margin-bottom: 20px;">
            2. Chọn Gói Nạp Ưu Đãi (${game.currency})
          </h3>
          <div class="sku-packages-grid" id="topup-packages-list">
            ${game.topupPackages.map((sku, idx) => `
              <div class="sku-card ${idx === 0 ? 'selected' : ''}" data-sku-id="${sku.id}">
                <div class="sku-discount-tag">-${sku.discount}</div>
                <div class="sku-amount">+${sku.amount.toLocaleString()}</div>
                <div class="sku-currency">${sku.currency}</div>
                <div class="sku-price">${sku.price.toLocaleString('vi-VN')} đ</div>
                <div style="font-size: 0.72rem; color: var(--text-muted); text-decoration: line-through;">
                  ${sku.originalPrice.toLocaleString('vi-VN')} đ
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    // Select default first SKU
    this.selectedSku = game.topupPackages[0];
    this.updateSummary();
    this.attachEvents();
  }

  attachEvents() {
    // Game buttons
    this.container.querySelectorAll('.btn-topup-game').forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectedGame = btn.dataset.game;
        this.render();
      });
    });

    // SKU cards
    this.container.querySelectorAll('.sku-card').forEach(card => {
      card.addEventListener('click', () => {
        this.container.querySelectorAll('.sku-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        const skuId = card.dataset.skuId;
        const game = GAMES_DATA[this.selectedGame];
        this.selectedSku = game.topupPackages.find(s => s.id === skuId);
        this.updateSummary();
      });
    });

    // Submit Topup
    const submitBtn = this.container.querySelector('#btn-submit-topup');
    submitBtn?.addEventListener('click', () => this.handleTopupSubmit());
  }

  updateSummary() {
    if (!this.selectedSku) return;
    const summarySku = this.container.querySelector('#topup-summary-sku');
    const summaryDiscount = this.container.querySelector('#topup-summary-discount');
    const summaryTotal = this.container.querySelector('#topup-summary-total');

    if (summarySku) summarySku.textContent = `${this.selectedSku.amount.toLocaleString()} ${this.selectedSku.currency}`;
    if (summaryDiscount) summaryDiscount.textContent = `Giảm ${this.selectedSku.discount}`;
    if (summaryTotal) summaryTotal.textContent = `${this.selectedSku.price.toLocaleString('vi-VN')} VNĐ`;
  }

  handleTopupSubmit() {
    const uid = document.getElementById('topup-uid-input')?.value.trim();
    if (!uid) {
      alert("Vui lòng nhập ID Ingame của bạn!");
      return;
    }

    if (!this.selectedSku) {
      alert("Vui lòng chọn gói nạp!");
      return;
    }

    if (store.user.walletBalance < this.selectedSku.price) {
      alert(`Số dư ví (${store.user.walletBalance.toLocaleString('vi-VN')} đ) không đủ để thanh toán ${this.selectedSku.price.toLocaleString('vi-VN')} đ!`);
      return;
    }

    // Deduct balance
    store.depositWallet(-this.selectedSku.price);

    const txHash = 'TOPUP-' + Math.random().toString(36).substring(2, 9).toUpperCase();
    alert(`🎉 Nạp thành công!\n\nID Ingame: ${uid}\nGói nạp: +${this.selectedSku.amount.toLocaleString()} ${this.selectedSku.currency}\nSố tiền: ${this.selectedSku.price.toLocaleString('vi-VN')} VNĐ\nMã GD: ${txHash}\nThời gian nạp: 2 giây\n\nVật phẩm đã được bắn trực tiếp vào hòm thư ingame của bạn!`);
  }
}

export const topupHub = new TopupHub();

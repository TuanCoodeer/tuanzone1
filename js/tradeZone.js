// =========================================================
// tuanzOne.com - Ký Gửi Tài Khoản (User Trade Zone C2C)
// Platform Escrow: Sàn trung gian giữ tiền, 5-7% phí giao dịch
// =========================================================

import { store } from './store.js';
import { GAMES_DATA } from '../data/games.js';

class TradeZone {
  constructor() {
    this.container = null;
    this.feeRate = 0.05; // 5% Escrow Fee
  }

  init() {
    this.container = document.getElementById('view-trade-zone');
    if (!this.container) return;
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="section-header-banner">
        <div class="section-header-info">
          <h2>🤝 Ký Gửi Tài Khoản (User Trade Zone C2C)</h2>
          <p>Đăng bán nick của bạn an toàn tuyệt đối. Sàn tuanzOne.com làm trung gian bảo chứng, thu 5% phí khi giao dịch thành công.</p>
        </div>
        <div>
          <span class="escrow-fee-badge">
            <span>🛡️</span> Phí sàn ưu đãi: 5% (Người mua thanh toán tiền sàn giữ trước)
          </span>
        </div>
      </div>

      <div class="trade-zone-grid">
        <!-- Form Ký Gửi -->
        <div class="topup-form-panel">
          <h3 style="font-family: var(--font-display); font-size: 1.2rem; color: #fff; margin-bottom: 18px;">
            📝 Điền Thông Tin Ký Gửi Tài Khoản
          </h3>

          <form id="trade-listing-form">
            <div class="form-group">
              <label class="form-label">Chọn game:</label>
              <select class="custom-select" style="width: 100%;" id="trade-game-select">
                <option value="freefire">Free Fire</option>
                <option value="lienquan">Liên Quân Mobile</option>
                <option value="fcmobile">FC Mobile</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Tiêu đề tin đăng:</label>
              <input type="text" class="form-input-styled" id="trade-title-input" placeholder="Ví dụ: Acc Free Fire 3 Súng Lv7 Rank Huyền Thoại" required>
            </div>

            <!-- 3 Golden Metrics Inputs -->
            <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08); border-radius: var(--border-radius-md); padding: 14px; margin-bottom: 20px;">
              <span style="font-size: 0.8rem; font-weight: 700; color: var(--neon-cyan); text-transform: uppercase; display: block; margin-bottom: 10px;">
                ⭐ 3 Thông Số Vàng Hiển Thị Thẻ
              </span>

              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                <div>
                  <label class="form-label" style="font-size: 0.75rem;">1. Bậc Rank:</label>
                  <input type="text" class="form-input-styled" id="trade-rank-input" placeholder="vd: Thách Đấu" required>
                </div>
                <div>
                  <label class="form-label" style="font-size: 0.75rem;">2. Món VIP Nhất:</label>
                  <input type="text" class="form-input-styled" id="trade-topitem-input" placeholder="vd: AK Rồng Xanh" required>
                </div>
                <div>
                  <label class="form-label" style="font-size: 0.75rem;">3. Tình trạng:</label>
                  <select class="custom-select" style="width: 100%; font-size: 0.78rem;" id="trade-link-input">
                    <option value="clean">Trắng thông tin</option>
                    <option value="linked">Đã liên kết</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Giá bạn muốn bán (VNĐ):</label>
              <input type="number" class="form-input-styled" id="trade-price-input" placeholder="Nhập giá (vd: 500000)" min="50000" step="10000" required>
            </div>

            <!-- Sensitive Escrow Credentials -->
            <div style="background: rgba(255, 51, 102, 0.08); border: 1px solid rgba(255, 51, 102, 0.25); border-radius: var(--border-radius-md); padding: 14px; margin-bottom: 20px;">
              <span style="font-size: 0.8rem; font-weight: 700; color: var(--status-locked); text-transform: uppercase; display: block; margin-bottom: 4px;">
                🔒 Thông Tin Bàn Giao Tự Động (Lưu Trữ Mã Hóa)
              </span>
              <p style="font-size: 0.72rem; color: var(--text-secondary); margin-bottom: 12px;">
                Thông tin này chỉ được bung ra cho người mua khi họ thanh toán thành công và tiền đã vào ví sàn của bạn.
              </p>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 8px;">
                <input type="text" class="form-input-styled" id="trade-login-input" placeholder="Tên đăng nhập / Email nick" required>
                <input type="text" class="form-input-styled" id="trade-pass-input" placeholder="Mật khẩu tài khoản" required>
              </div>
              <input type="text" class="form-input-styled" id="trade-2fa-input" placeholder="Mã bảo mật 2FA / Mã dự phòng (nếu có)">
            </div>

            <!-- Financial Fee Calculation -->
            <div style="background: rgba(0,0,0,0.4); padding: 16px; border-radius: var(--border-radius-md); border: 1px solid rgba(0, 242, 254, 0.2); margin-bottom: 20px;">
              <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 6px;">
                <span style="color: var(--text-secondary);">Giá niêm yết trên sàn:</span>
                <span id="calc-list-price" style="font-family: var(--font-mono); color: #fff;">0 VNĐ</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 6px;">
                <span style="color: var(--text-secondary);">Phí sàn trung gian (5%):</span>
                <span id="calc-fee-amount" style="font-family: var(--font-mono); color: var(--status-locked);">- 0 VNĐ</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 1rem; font-weight: 800; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px; margin-top: 6px;">
                <span style="color: var(--status-verified);">Thực nhận khi bán thành công:</span>
                <span id="calc-net-payout" style="font-family: var(--font-mono); color: var(--status-verified); font-size: 1.15rem;">0 VNĐ</span>
              </div>
            </div>

            <button type="submit" class="btn-cta-buy animate-pulse-orange" style="width: 100%; justify-content: center; padding: 14px;">
              🚀 Đăng Bán Ký Gửi Ngay Lập Tức
            </button>
          </form>
        </div>

        <!-- Right Side: Live Card Preview & Escrow Shield Benefits -->
        <div>
          <h3 style="font-family: var(--font-display); font-size: 1.2rem; color: #fff; margin-bottom: 18px;">
            👁️ Xem Trước Thẻ Sẽ Xuất Hiện Trên Sàn
          </h3>

          <div class="acc-card" style="margin-bottom: 24px;">
            <div class="acc-card-media">
              <img class="acc-card-img" id="preview-card-img" src="https://images.unsplash.com/photo-1542751371-adc38448a05e?w=700&auto=format&fit=crop&q=80" alt="Preview">
              <span class="acc-game-pill" id="preview-card-game-pill" style="background: var(--color-freefire); color: #fff;">Free Fire</span>
            </div>
            <div class="acc-card-body">
              <div class="acc-title-row">
                <span class="acc-code">C2C-MỚI</span>
                <div class="acc-title" id="preview-card-title">Tiêu đề tin đăng của bạn sẽ hiển thị ở đây</div>
              </div>

              <!-- 3 Golden Metrics Live Preview -->
              <div class="golden-metrics-grid">
                <div class="metric-col">
                  <span class="metric-label">Bậc Rank</span>
                  <span class="metric-val rank" id="preview-metric-rank">Thách Đấu</span>
                </div>
                <div class="metric-col">
                  <span class="metric-label">VIP Nhất</span>
                  <span class="metric-val vip-item" id="preview-metric-vip">AK Rồng Xanh</span>
                </div>
                <div class="metric-col">
                  <span class="metric-label">Tình trạng</span>
                  <span class="metric-val link-clean" id="preview-metric-link">Trắng Thông Tin</span>
                </div>
              </div>

              <div class="acc-card-footer">
                <div class="acc-price-block">
                  <span class="acc-price-original" id="preview-original-price">0 đ</span>
                  <span class="acc-price-current" id="preview-current-price">0 <span>VNĐ</span></span>
                </div>
                <button class="btn-cta-buy" disabled style="opacity: 0.7;">
                  🔒 Khóa 5P & Mua
                </button>
              </div>
            </div>
          </div>

          <!-- Escrow Shield Guarantee Box -->
          <div class="shield-assurance-box" style="margin-bottom: 14px;">
            <div class="shield-assurance-icon">🛡️</div>
            <div class="shield-assurance-text">
              <h4>Bảo Chứng Giao Dịch Trung Gian Escrow</h4>
              <p>Người mua nạp tiền trước vào ví sàn mới mở được thông tin nick. Người bán hoàn toàn yên tâm không lo bị lừa đảo đổi pass hay quỵt tiền.</p>
            </div>
          </div>

          <div class="shield-assurance-box">
            <div class="shield-assurance-icon">⚡</div>
            <div class="shield-assurance-text">
              <h4>Rút Tiền Tự Động Về Mọi Ngân Hàng</h4>
              <p>Sau 24 giờ bảo hành TuanZone Shield không phát sinh khiếu nại, tiền bán nick sẽ tự động cộng vào tài khoản ngân hàng của bạn.</p>
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  attachEvents() {
    const priceInput = document.getElementById('trade-price-input');
    const titleInput = document.getElementById('trade-title-input');
    const rankInput = document.getElementById('trade-rank-input');
    const topitemInput = document.getElementById('trade-topitem-input');
    const linkInput = document.getElementById('trade-link-input');
    const gameSelect = document.getElementById('trade-game-select');
    const form = document.getElementById('trade-listing-form');

    const updateCalculations = () => {
      const price = Number(priceInput?.value) || 0;
      const fee = Math.round(price * this.feeRate);
      const net = price - fee;

      const listPriceEl = document.getElementById('calc-list-price');
      const feeEl = document.getElementById('calc-fee-amount');
      const netEl = document.getElementById('calc-net-payout');
      const prevOrig = document.getElementById('preview-original-price');
      const prevCurr = document.getElementById('preview-current-price');

      if (listPriceEl) listPriceEl.textContent = `${price.toLocaleString('vi-VN')} VNĐ`;
      if (feeEl) feeEl.textContent = `- ${fee.toLocaleString('vi-VN')} VNĐ`;
      if (netEl) netEl.textContent = `${net.toLocaleString('vi-VN')} VNĐ`;
      if (prevOrig) prevOrig.textContent = `${Math.round(price * 1.25).toLocaleString('vi-VN')} đ`;
      if (prevCurr) prevCurr.innerHTML = `${price.toLocaleString('vi-VN')} <span>VNĐ</span>`;
    };

    priceInput?.addEventListener('input', updateCalculations);

    // Live preview updates
    titleInput?.addEventListener('input', () => {
      const el = document.getElementById('preview-card-title');
      if (el) el.textContent = titleInput.value || "Tiêu đề tin đăng của bạn";
    });

    rankInput?.addEventListener('input', () => {
      const el = document.getElementById('preview-metric-rank');
      if (el) el.textContent = rankInput.value || "-";
    });

    topitemInput?.addEventListener('input', () => {
      const el = document.getElementById('preview-metric-vip');
      if (el) el.textContent = topitemInput.value || "-";
    });

    linkInput?.addEventListener('change', () => {
      const el = document.getElementById('preview-metric-link');
      if (el) {
        if (linkInput.value === 'clean') {
          el.textContent = "Trắng Thông Tin";
          el.className = "metric-val link-clean";
        } else {
          el.textContent = "Đã Liên Kết";
          el.className = "metric-val link-linked";
        }
      }
    });

    gameSelect?.addEventListener('change', () => {
      const pill = document.getElementById('preview-card-game-pill');
      const img = document.getElementById('preview-card-img');
      const g = GAMES_DATA[gameSelect.value];
      if (pill && g) {
        pill.textContent = g.name;
        pill.style.background = g.themeColor;
      }
      if (img && g) {
        img.src = g.banner;
      }
    });

    // Form submit
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const price = Number(priceInput.value);
      if (price < 50000) {
        alert("Giá bán tối thiểu là 50.000 VNĐ!");
        return;
      }

      const listing = {
        game: gameSelect.value,
        title: titleInput.value.trim(),
        rank: rankInput.value.trim(),
        topItem: topitemInput.value.trim(),
        linkStatus: linkInput.value,
        price: price,
        accountLogin: document.getElementById('trade-login-input')?.value.trim(),
        accountPassword: document.getElementById('trade-pass-input')?.value.trim(),
        account2FA: document.getElementById('trade-2fa-input')?.value.trim(),
        escrowFee: Math.round(price * this.feeRate),
        thumbnail: GAMES_DATA[gameSelect.value]?.banner
      };

      const newAcc = store.addEscrowListing(listing);
      alert(`🎉 Đăng bán ký gửi thành công!\n\nMã tin đăng: #${newAcc.id}\nGiá niêm yết: ${price.toLocaleString('vi-VN')} VNĐ\n\nTài khoản của bạn đã được đưa lên Kho Acc Tuyển Chọn ngay lập tức và bảo chứng qua TuanZone Escrow.`);
      
      // Reset form
      form.reset();
      updateCalculations();
    });
  }
}

export const tradeZone = new TradeZone();

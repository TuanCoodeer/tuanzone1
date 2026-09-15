// =========================================================
// tuBIzOne.com - Quick-Slide Fullscreen Inventory Story
// Instagram Story / Carousel Experience
// =========================================================

import { store } from './store.js';

class QuickSlideViewer {
  constructor() {
    this.modal = null;
    this.currentAccount = null;
    this.currentIndex = 0;
    this.progressTimer = null;
    this.isPaused = false;
    this.onBuyCallback = null;
  }

  init(onBuyClick) {
    this.onBuyCallback = onBuyClick;
    this.createModalDOM();
    this.attachEventListeners();
  }

  createModalDOM() {
    let el = document.getElementById('quickslide-modal');
    if (!el) {
      el = document.createElement('div');
      el.id = 'quickslide-modal';
      el.className = 'quickslide-backdrop';
      el.innerHTML = `
        <div class="quickslide-wrapper">
          <!-- Story Progress Bars Top -->
          <div class="story-progress-container" id="story-progress-container"></div>

          <!-- Story Header -->
          <div class="story-header">
            <div class="story-acc-info">
              <span class="story-acc-badge" id="story-acc-id">ACC #0000</span>
              <span class="story-acc-title" id="story-acc-title">Chi tiết kho đồ</span>
            </div>
            <button class="modal-close-btn" id="story-close-btn" title="Đóng (ESC)">✕</button>
          </div>

          <!-- Story Main Viewport -->
          <div class="story-viewport" id="story-viewport">
            <div class="story-tap-zone left" id="story-tap-left" title="Ảnh trước"></div>
            <div class="story-tap-zone right" id="story-tap-right" title="Ảnh tiếp theo"></div>
            <button class="story-nav-btn prev" id="story-btn-prev">❮</button>
            <button class="story-nav-btn next" id="story-btn-next">❯</button>
            
            <img class="story-slide-image" id="story-slide-img" src="" alt="Inventory Slide">
            
            <!-- Caption Bar -->
            <div class="story-caption-bar">
              <div class="story-caption-text" id="story-caption-text">Mô tả vật phẩm</div>
              <div class="story-caption-counter" id="story-caption-counter">1 / 4</div>
            </div>
          </div>

          <!-- Story Footer Action -->
          <div class="story-footer">
            <div class="story-price-display">
              <span class="story-price-label">Giá chuyển nhượng</span>
              <span class="story-price-value" id="story-price-val">0 <span>VNĐ</span></span>
            </div>
            <button class="btn-cta-buy animate-pulse-orange" id="story-buy-btn">
              <span>🔒</span> Khóa 5 Phút & Mua Ngay
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(el);
    }
    this.modal = el;
  }

  attachEventListeners() {
    const closeBtn = document.getElementById('story-close-btn');
    const tapLeft = document.getElementById('story-tap-left');
    const tapRight = document.getElementById('story-tap-right');
    const btnPrev = document.getElementById('story-btn-prev');
    const btnNext = document.getElementById('story-btn-next');
    const buyBtn = document.getElementById('story-buy-btn');

    closeBtn?.addEventListener('click', () => this.close());
    tapLeft?.addEventListener('click', (e) => { e.stopPropagation(); this.prev(); });
    tapRight?.addEventListener('click', (e) => { e.stopPropagation(); this.next(); });
    btnPrev?.addEventListener('click', (e) => { e.stopPropagation(); this.prev(); });
    btnNext?.addEventListener('click', (e) => { e.stopPropagation(); this.next(); });

    buyBtn?.addEventListener('click', () => {
      if (this.currentAccount && this.onBuyCallback) {
        const acc = this.currentAccount;
        this.close();
        this.onBuyCallback(acc);
      }
    });

    // Close when clicking outside wrapper
    this.modal?.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (!this.isOpen()) return;
      if (e.key === 'Escape') this.close();
      if (e.key === 'ArrowRight' || e.key === ' ') this.next();
      if (e.key === 'ArrowLeft') this.prev();
    });
  }

  open(account, startIndex = 0) {
    if (!account || !account.slides || account.slides.length === 0) return;
    this.currentAccount = account;
    this.currentIndex = startIndex;

    // Render Story info
    const idEl = document.getElementById('story-acc-id');
    const titleEl = document.getElementById('story-acc-title');
    const priceEl = document.getElementById('story-price-val');
    const buyBtn = document.getElementById('story-buy-btn');

    if (idEl) idEl.textContent = account.id;
    if (titleEl) titleEl.textContent = account.title;
    if (priceEl) priceEl.innerHTML = `${Number(account.price).toLocaleString('vi-VN')} <span>VNĐ</span>`;

    if (buyBtn) {
      if (account.status === 'SOLD') {
        buyBtn.disabled = true;
        buyBtn.textContent = 'Đã Bán Hết';
      } else if (account.status === 'LOCKED' && account.lockedBy !== store.user.username) {
        buyBtn.disabled = true;
        buyBtn.textContent = 'Đang Có Người Giữ Chỗ';
      } else {
        buyBtn.disabled = false;
        buyBtn.innerHTML = `<span>🔒</span> Khóa 5 Phút & Mua Ngay`;
      }
    }

    this.renderProgressBars();
    this.showSlide(this.currentIndex);
    this.modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  renderProgressBars() {
    const container = document.getElementById('story-progress-container');
    if (!container || !this.currentAccount) return;
    container.innerHTML = '';

    this.currentAccount.slides.forEach((_, idx) => {
      const bar = document.createElement('div');
      bar.className = 'story-progress-bar';
      bar.id = `story-bar-${idx}`;
      bar.innerHTML = `<div class="story-progress-fill" id="story-fill-${idx}"></div>`;
      container.appendChild(bar);
    });
  }

  showSlide(index) {
    if (!this.currentAccount) return;
    const slides = this.currentAccount.slides;
    if (index < 0) index = 0;
    if (index >= slides.length) index = slides.length - 1;
    this.currentIndex = index;

    const currentSlide = slides[this.currentIndex];
    const imgEl = document.getElementById('story-slide-img');
    const captionEl = document.getElementById('story-caption-text');
    const counterEl = document.getElementById('story-caption-counter');

    if (imgEl) {
      imgEl.style.opacity = '0.5';
      imgEl.src = currentSlide.url;
      imgEl.onload = () => { imgEl.style.opacity = '1'; };
    }
    if (captionEl) captionEl.textContent = currentSlide.caption || this.currentAccount.title;
    if (counterEl) counterEl.textContent = `${this.currentIndex + 1} / ${slides.length}`;

    // Update Progress Bars
    slides.forEach((_, idx) => {
      const bar = document.getElementById(`story-bar-${idx}`);
      const fill = document.getElementById(`story-fill-${idx}`);
      if (!bar || !fill) return;

      if (idx < this.currentIndex) {
        bar.className = 'story-progress-bar completed';
        fill.style.width = '100%';
      } else if (idx === this.currentIndex) {
        bar.className = 'story-progress-bar active';
        fill.style.width = '100%';
      } else {
        bar.className = 'story-progress-bar';
        fill.style.width = '0%';
      }
    });
  }

  next() {
    if (!this.currentAccount) return;
    if (this.currentIndex < this.currentAccount.slides.length - 1) {
      this.showSlide(this.currentIndex + 1);
    } else {
      // Loop or stay at last
      this.showSlide(0);
    }
  }

  prev() {
    if (this.currentIndex > 0) {
      this.showSlide(this.currentIndex - 1);
    }
  }

  close() {
    if (this.modal) {
      this.modal.classList.remove('active');
    }
    document.body.style.overflow = '';
  }

  isOpen() {
    return this.modal && this.modal.classList.contains('active');
  }
}

export const quickSlide = new QuickSlideViewer();

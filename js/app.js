// =========================================================
// tuBIzOne.com - Main Application Logic
// =========================================================

import { store, ADMIN_CONFIG, BANK_CONFIG } from './store.js';
import { WAREHOUSES, TOP_DEPOSIT_USERS } from '../data/games.js?v=1.0.6';
import { showPopup, showAlert, showConfirm, showToast, initPopupSystem } from './popup.js';
import { initCyberSparks } from './cyberSparks.js';
import { SecurityService } from './security.js';

class TuBIzOneApp {
  constructor() {
    this.selectedTelco = 'VIETTEL';
    this.activeDetailAccId = null;
    this.currentActiveWarehouse = null;
    this.currentGalleryImages = [];
    this.currentGalleryIndex = 0;
    this.adminUploadedImages = [];
    this.cyberSparks = null;
    this.lockoutInterval = null;
  }

  init() {
    initPopupSystem();
    this.cyberSparks = initCyberSparks();
    this.initTheme();
    this.renderTopLeaderboard();
    this.renderHeaderAuth();
    this.renderWarehouses();
    this.attachHeaderEvents();
    this.attachCategoryCardEvents();
    this.attachDepositModalEvents();
    this.attachAuthModalEvents();
    this.attachWarehouseFilterEvents();
    this.attachAdminEvents();
    this.attachUserHistoryModalEvents();
    this.attachAccountDetailEvents();
    this.initRouteHash();

    store.subscribe(() => {
      this.renderHeaderAuth();
      this.renderWarehouses();
      if (this.activeDetailAccId) {
        const currentAcc = store.accounts.find(a => a.id === this.activeDetailAccId);
        if (currentAcc) {
          this.renderAccountDetail(currentAcc);
        }
      }
    });
  }

  // --- 1. THEME SWITCHER (Light / Dark) ---
  initTheme() {
    const savedTheme = localStorage.getItem('tz_theme') || 'dark';
    document.body.setAttribute('data-theme', savedTheme);
    this.updateThemeBtnState(savedTheme);

    const toggleBtn = document.getElementById('btn-toggle-theme');
    toggleBtn?.addEventListener('click', () => {
      const current = document.body.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      document.body.setAttribute('data-theme', next);
      localStorage.setItem('tz_theme', next);
      this.updateThemeBtnState(next);
    });
  }

  updateThemeBtnState(theme) {
    const iconEl = document.getElementById('theme-toggle-icon');
    const labelEl = document.getElementById('theme-toggle-label');
    if (iconEl && labelEl) {
      if (theme === 'dark') {
        iconEl.textContent = '🌙';
        labelEl.textContent = 'Tối';
      } else {
        iconEl.textContent = '☀️';
        labelEl.textContent = 'Sáng';
      }
    }
  }

  // --- 2. TOP NẠP TIỀN THÁNG ---
  renderTopLeaderboard() {
    const container = document.getElementById('leaderboard-list-items');
    if (!container) return;
    // Để trống khung theo yêu cầu của bạn
    container.innerHTML = '';
  }

  // --- 3. HEADER AUTH & USER / ADMIN CONTROLS ---
  renderHeaderAuth() {
    const group = document.getElementById('header-auth-group');
    if (!group) return;

    if (store.user.isLoggedIn) {
      if (store.user.isAdmin) {
        // Giao diện ĐỘC QUYỀN của tài khoản ADMIN
        group.innerHTML = `
          <div class="admin-header-controls">
            <button class="btn-admin-nav" id="btn-admin-open-add-acc" title="Thêm tài khoản game mới vào kho">
              <span>➕</span> Thêm Acc Vào Kho
            </button>
            <button class="btn-admin-nav btn-admin-stats" id="btn-admin-open-dashboard" title="Xem doanh thu và lịch sử giao dịch">
              <span>📊</span> Doanh Thu & Lịch Sử
            </button>
            <div class="admin-badge-pill">
              <span class="admin-crown">👑</span>
              <span class="admin-name">Huỳnh Tuấn</span>
              <button class="btn-logout-mini" id="btn-header-logout" title="Đăng xuất Admin">Thoát</button>
            </div>
          </div>
        `;

        document.getElementById('btn-admin-open-add-acc')?.addEventListener('click', () => {
          this.openAddAccView();
        });

        document.getElementById('btn-admin-open-dashboard')?.addEventListener('click', () => {
          this.openAdminDashboardModal();
        });

      } else {
        // Giao diện Khách hàng / Người dùng bình thường
        group.innerHTML = `
          <div class="user-logged-nav-group">
            <div class="user-badge-logged">
              <div class="user-avatar-text">👤</div>
              <div class="user-info-text">
                <span class="user-name-title">${store.user.displayName}</span>
                <span class="user-info-divider">•</span>
                <span class="user-balance-val">💰 ${store.user.balance.toLocaleString('vi-VN')} đ</span>
              </div>
            </div>
            <button class="btn-user-history-nav" id="btn-header-user-history" title="Xem lịch sử giao dịch và tài khoản đã mua">
              <span>📜</span> Lịch Sử Giao Dịch
            </button>
            <button class="btn-logout-mini" id="btn-header-logout" title="Đăng xuất">Thoát</button>
          </div>
        `;

        document.getElementById('btn-header-user-history')?.addEventListener('click', () => {
          this.openUserHistoryModal();
        });
      }

      document.getElementById('btn-header-logout')?.addEventListener('click', async () => {
        const ok = await showConfirm("Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?", {
          title: "Xác Nhận Đăng Xuất",
          type: "warning",
          confirmText: "Đăng Xuất",
          cancelText: "Hủy Bỏ"
        });
        if (ok) {
          store.logout();
          showToast("Đã đăng xuất thành công!", "info");
        }
      });

    } else {
      // Khi Chưa Đăng Nhập
      group.innerHTML = `
        <button class="btn-auth-item" id="btn-header-login">Đăng Nhập</button>
        <button class="btn-auth-item" id="btn-header-register" style="background: var(--primary-blue); color: #fff; border: none;">Đăng Ký</button>
      `;

      document.getElementById('btn-header-login')?.addEventListener('click', () => {
        this.openAuthModal('login');
      });

      document.getElementById('btn-header-register')?.addEventListener('click', () => {
        this.openAuthModal('register');
      });
    }

    // Cập nhật cú pháp chuyển khoản ngân hàng
    const syntaxEl = document.getElementById('bank-memo-syntax');
    if (syntaxEl) {
      const uname = store.user.isLoggedIn ? store.user.username : 'KHACH';
      syntaxEl.textContent = `NAP tuBIzOne ${uname.toUpperCase()}`;
    }

    // Cập nhật phân vùng và link header cho KHO CHỨC NĂNG ADMIN (Cách ly tuyệt đối)
    const groupCatAdmin = document.getElementById('group-category-admin');
    const navAdmin = document.getElementById('nav-link-header-admin');

    if (store.user?.isLoggedIn && store.user?.isAdmin) {
      if (groupCatAdmin) groupCatAdmin.style.display = 'block';
      if (navAdmin) navAdmin.style.display = 'inline-flex';

      const revStats = store.getMonthlyRevenue();
      const elTotal = document.getElementById('cat-count-admin-total');
      const elRev = document.getElementById('cat-count-admin-revenue');
      const elSold = document.getElementById('cat-count-admin-sold');
      const elPendingBadge = document.getElementById('cat-badge-pending-deposits');

      if (elTotal) elTotal.textContent = `${store.accounts.length} nick`;
      if (elRev) elRev.textContent = `${revStats.totalRevenue.toLocaleString('vi-VN')} đ`;
      if (elSold) elSold.textContent = `${revStats.totalSold} acc`;
      if (elPendingBadge) elPendingBadge.textContent = `Chờ Duyệt: ${store.getPendingDepositsCount()}`;
    } else {
      if (groupCatAdmin) groupCatAdmin.style.display = 'none';
      if (navAdmin) navAdmin.style.display = 'none';

      // Chặn truy cập trái phép: Nếu người dùng thường đang ở kho admin, lập tức đóng kho
      if (this.currentActiveWarehouse === 'admin' || window.location.hash === '#kho-admin' || window.location.hash === '#admin-add-acc') {
        this.closeWarehouseDetail(true);
      }
    }
  }

  attachHeaderEvents() {
    const searchInput = document.getElementById('global-search-input');
    const searchBtn = document.getElementById('global-search-btn');

    const handleSearch = () => {
      const query = (searchInput?.value || '').trim().toLowerCase();
      store.searchQuery = query;
      this.renderWarehouses();
    };

    searchBtn?.addEventListener('click', handleSearch);
    searchInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSearch();
    });

    document.getElementById('header-logo-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      if (this.activeDetailAccId) {
        this.closeAccountDetail(false);
      }
      const adminAddView = document.getElementById('view-admin-add-acc');
      if (adminAddView && adminAddView.style.display !== 'none') {
        this.closeAddAccView(false);
      }
      this.closeWarehouseDetail(false);
      window.location.hash = 'trangchu';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // --- 4. RENDER CÁC KHO TÀI KHOẢN & DANH MỤC GAME (THEO ẢNH 2) ---
  renderWarehouses() {
    this.updateCategoryCounts();
    this.renderFreeFireWarehouse();
    this.renderLienQuanWarehouse();
    this.renderFcMobileWarehouse();
    this.renderBlindBagWarehouse();
  }

  updateCategoryCounts() {
    const ffCount = store.accounts.filter(a => a.game === 'freefire' && a.status === 'AVAILABLE').length;
    const lqCount = store.accounts.filter(a => a.game === 'lienquan' && a.status === 'AVAILABLE').length;
    const fcCount = store.accounts.filter(a => (a.game === 'fcmobile' || a.game === 'fc' || a.game === 'roblox') && a.status === 'AVAILABLE').length;
    const bbCount = store.accounts.filter(a => (a.game === 'blindbag' || a.game === 'ff-blindbag') && a.status === 'AVAILABLE').length;

    const elFf = document.getElementById('cat-count-freefire');
    const elLq = document.getElementById('cat-count-lienquan');
    const elFc = document.getElementById('cat-count-fcmobile');
    const elBb = document.getElementById('cat-count-blindbag');

    if (elFf) elFf.textContent = ffCount;
    if (elLq) elLq.textContent = lqCount;
    if (elFc) elFc.textContent = fcCount;
    if (elBb) elBb.textContent = bbCount;
  }

  openWarehouse(gameKey, updateHash = true) {
    if (!gameKey) return;
    if (gameKey === 'ff-blindbag') gameKey = 'blindbag';

    // KIỂM TRA BẢO MẬT CÁCH LY: Kho Admin chỉ dành riêng cho Quản Trị Viên
    if (gameKey === 'admin') {
      if (!store.user?.isAdmin) {
        showToast("⛔ Khu vực cách ly: Chỉ Quản Trị Viên mới có quyền truy cập!", "danger");
        this.closeWarehouseDetail(true);
        return;
      }
    }

    this.currentActiveWarehouse = gameKey;

    if (updateHash) {
      window.location.hash = 'kho-' + gameKey;
    }

    const shopView = document.getElementById('view-shop-warehouses');
    const detailView = document.getElementById('view-account-detail');
    const adminAddView = document.getElementById('view-admin-add-acc');
    if (shopView) shopView.style.display = 'block';
    if (detailView) detailView.style.display = 'none';
    if (adminAddView) adminAddView.style.display = 'none';

    const catSection = document.getElementById('game-categories-section');
    if (catSection) catSection.style.display = 'none';

    ['freefire', 'lienquan', 'fcmobile', 'blindbag', 'admin'].forEach(g => {
      const el = document.getElementById(`kho-${g}`);
      if (el) el.style.display = g === gameKey ? 'block' : 'none';
    });

    if (gameKey === 'admin') {
      this.renderAdminWarehouseHub();
    }

    const target = document.getElementById(`kho-${gameKey}`);
    if (target) {
      setTimeout(() => {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    }
  }

  closeWarehouseDetail(updateHash = true) {
    this.currentActiveWarehouse = null;

    if (updateHash) {
      window.location.hash = 'trangchu';
    }

    const shopView = document.getElementById('view-shop-warehouses');
    const detailView = document.getElementById('view-account-detail');
    const adminAddView = document.getElementById('view-admin-add-acc');
    if (shopView) shopView.style.display = 'block';
    if (detailView) detailView.style.display = 'none';
    if (adminAddView) adminAddView.style.display = 'none';

    const catSection = document.getElementById('game-categories-section');
    if (catSection) catSection.style.display = 'block';

    ['freefire', 'lienquan', 'fcmobile', 'blindbag', 'admin'].forEach(g => {
      const el = document.getElementById(`kho-${g}`);
      if (el) el.style.display = 'none';
    });

    if (catSection && updateHash) {
      setTimeout(() => {
        catSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    }
  }

  attachCategoryCardEvents() {
    // 1. Click vào khung danh mục game hình vuông
    document.querySelectorAll('.game-category-card[data-game-category]').forEach(card => {
      card.addEventListener('click', () => {
        const game = card.getAttribute('data-game-category');
        if (game) {
          this.openWarehouse(game);
        }
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const game = card.getAttribute('data-game-category');
          if (game) {
            this.openWarehouse(game);
          }
        }
      });
    });

    // 1b. Click nút "Xem tất cả >" ở từng nhóm vùng kho game
    document.querySelectorAll('[data-open-warehouse]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const game = btn.getAttribute('data-open-warehouse');
        if (game) {
          this.openWarehouse(game);
        }
      });
    });

    // 1c. Click vào các thẻ Admin Category trên trang chủ
    document.getElementById('admin-card-add-acc')?.addEventListener('click', () => {
      if (store.user?.isAdmin) {
        this.openAddAccView();
      }
    });
    document.getElementById('admin-card-revenue')?.addEventListener('click', () => {
      if (store.user?.isAdmin) {
        this.openWarehouse('admin');
        this.switchAdminHubTab('revenue');
      }
    });
    document.getElementById('admin-card-deposits')?.addEventListener('click', () => {
      if (store.user?.isAdmin) {
        this.openWarehouse('admin');
        this.switchAdminHubTab('deposits');
      }
    });
    document.getElementById('admin-card-inventory')?.addEventListener('click', () => {
      if (store.user?.isAdmin) {
        this.openWarehouse('admin');
        this.switchAdminHubTab('inventory');
      }
    });
    document.getElementById('btn-admin-group-viewall')?.addEventListener('click', (e) => {
      e.preventDefault();
      if (store.user?.isAdmin) {
        this.openWarehouse('admin');
      }
    });

    // 2. Click nút quay lại danh mục game
    document.querySelectorAll('[data-back-to-categories]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.closeWarehouseDetail();
      });
    });

    // 3. Header nav links: 🔥 Kho Free Fire, ⚔️ Kho Liên Quân, ⚽ Kho FC Mobile, 🎁 Túi Mù FF
    document.querySelectorAll('.header-nav a').forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href === '#kho-blindbag' || href === '#tui-mu-freefire') {
          e.preventDefault();
          this.openWarehouse('blindbag');
        } else if (href && href.startsWith('#kho-')) {
          e.preventDefault();
          const game = href.replace('#kho-', '').trim();
          if (game) {
            this.openWarehouse(game);
          }
        }
      });
    });

    // 4. Logo website click đã được xử lý tập trung tại attachHeaderEvents()
  }

  // --- 4B. KHO TÚI MÙ FREE FIRE (CHUẨN NHƯ 3 KHO NICK) ---
  renderBlindBagWarehouse() {
    const container = document.getElementById('blindbag-accounts-container');
    const badge = document.querySelector('#kho-blindbag .warehouse-total-badge');
    if (!container) return;

    let list = store.accounts.filter(a => (a.game === 'blindbag' || a.game === 'ff-blindbag') && a.status === 'AVAILABLE');

    if (badge) {
      badge.textContent = `${list.length} tài khoản`;
    }

    // Lọc Mức giá
    list = this.filterByPrice(list, store.filters.blindbag?.priceRange);

    // Tìm kiếm (Tìm kiếm chung Header & Tìm kiếm riêng Kho Túi Mù)
    if (store.searchQuery) {
      list = list.filter(a => this.matchesSearch(a, store.searchQuery));
    }
    if (store.filters.blindbag?.search) {
      list = list.filter(a => this.matchesSearch(a, store.filters.blindbag.search));
    }

    // Sắp xếp
    list = this.sortList(list, store.filters.blindbag?.sortBy);

    container.innerHTML = this.buildWarehouseHTML('blindbag', list, "Kho Túi Mù Free Fire");
    this.attachCardBuyTriggers(container);
  }

  renderFreeFireWarehouse() {
    const container = document.getElementById('ff-accounts-container');
    const badge = document.querySelector('#kho-freefire .warehouse-total-badge');
    if (!container) return;

    let list = store.accounts.filter(a => a.game === 'freefire' && a.status === 'AVAILABLE');

    if (badge) {
      badge.textContent = `${list.length} tài khoản`;
    }

    // Lọc Prime
    const primeFilter = store.filters.freefire.prime;
    if (primeFilter !== 'all') {
      list = list.filter(a => a.prime === primeFilter);
    }

    // Lọc Mức giá
    list = this.filterByPrice(list, store.filters.freefire.priceRange);

    // Tìm kiếm (Tìm kiếm chung Header & Tìm kiếm riêng Kho Free Fire)
    if (store.searchQuery) {
      list = list.filter(a => this.matchesSearch(a, store.searchQuery));
    }
    if (store.filters.freefire?.search) {
      list = list.filter(a => this.matchesSearch(a, store.filters.freefire.search));
    }

    // Sắp xếp
    list = this.sortList(list, store.filters.freefire.sortBy);

    container.innerHTML = this.buildWarehouseHTML('freefire', list, "Kho Nick Free Fire");
    this.attachCardBuyTriggers(container);
  }

  renderLienQuanWarehouse() {
    const container = document.getElementById('lq-accounts-container');
    const badge = document.querySelector('#kho-lienquan .warehouse-total-badge');
    if (!container) return;

    let list = store.accounts.filter(a => a.game === 'lienquan' && a.status === 'AVAILABLE');

    if (badge) {
      badge.textContent = `${list.length} tài khoản`;
    }

    list = this.filterByPrice(list, store.filters.lienquan.priceRange);

    // Tìm kiếm (Tìm kiếm chung Header & Tìm kiếm riêng Kho Liên Quân)
    if (store.searchQuery) {
      list = list.filter(a => this.matchesSearch(a, store.searchQuery));
    }
    if (store.filters.lienquan?.search) {
      list = list.filter(a => this.matchesSearch(a, store.filters.lienquan.search));
    }

    list = this.sortList(list, store.filters.lienquan.sortBy);
    container.innerHTML = this.buildWarehouseHTML('lienquan', list, "Kho Nick Liên Quân");
    this.attachCardBuyTriggers(container);
  }

  renderFcMobileWarehouse() {
    const container = document.getElementById('fc-accounts-container');
    const badge = document.querySelector('#kho-fcmobile .warehouse-total-badge');
    if (!container) return;

    let list = store.accounts.filter(a => (a.game === 'fcmobile' || a.game === 'fc' || a.game === 'roblox') && a.status === 'AVAILABLE');

    if (badge) {
      badge.textContent = `${list.length} tài khoản`;
    }

    // 1. Lọc Phân Loại FC Mobile (Giá)
    const categoryFilter = store.filters.fcmobile?.category || 'all';
    if (categoryFilter !== 'all') {
      if (categoryFilter === 'over-1m') list = list.filter(a => a.price > 1000000);
      else if (categoryFilter === 'under-1m') list = list.filter(a => a.price <= 1000000);
    }

    // 2. Lọc Server
    const serverFilter = store.filters.fcmobile?.server || 'all';
    if (serverFilter !== 'all') {
      if (serverFilter === 'vietnam' || serverFilter === 'korea') {
        list = list.filter(a => {
          const s = (a.server || '').toLowerCase();
          return s.includes('việt') || s.includes('vietnam') || s.includes('vn') || s.includes('hàn');
        });
      } else if (serverFilter === 'global') {
        list = list.filter(a => (a.server || '').toLowerCase().includes('global') || (a.server || '').toLowerCase().includes('quốc tế'));
      } else {
        list = list.filter(a => (a.server || '').toLowerCase().includes(serverFilter.toLowerCase()));
      }
    }

    // 3. Lọc Mức giá
    list = this.filterByPrice(list, store.filters.fcmobile?.priceRange);

    // 4. Tìm kiếm (Tìm kiếm chung Header & Tìm kiếm riêng Kho FC Mobile)
    if (store.searchQuery) {
      list = list.filter(a => this.matchesSearch(a, store.searchQuery));
    }
    if (store.filters.fcmobile?.search) {
      list = list.filter(a => this.matchesSearch(a, store.filters.fcmobile.search));
    }

    // 5. Sắp xếp
    list = this.sortList(list, store.filters.fcmobile?.sortBy);
    container.innerHTML = this.buildWarehouseHTML('fcmobile', list, "Kho Nick FC Mobile");
    this.attachCardBuyTriggers(container);
  }

  // Hàm so khớp tìm kiếm thông minh đa trường
  matchesSearch(acc, query) {
    if (!query) return true;
    const q = query.trim().toLowerCase();
    const id = (acc.id || '').toLowerCase();
    const title = (acc.title || '').toLowerCase();
    const desc = (acc.description || '').toLowerCase();
    const prime = (acc.prime || '').toLowerCase();
    const ovr = (acc.ovr || '').toLowerCase();
    const rank = (acc.rank || '').toLowerCase();
    const type = (acc.accountType || '').toLowerCase();
    const server = (acc.server || '').toLowerCase();
    return id.includes(q) || title.includes(q) || desc.includes(q) ||
           prime.includes(q) || ovr.includes(q) || rank.includes(q) ||
           type.includes(q) || server.includes(q);
  }

  filterByPrice(list, priceRangeId) {
    if (!priceRangeId || priceRangeId === 'all') return list;
    if (priceRangeId === 'under-50k') return list.filter(a => a.price < 50000);
    if (priceRangeId === '50k-200k') return list.filter(a => a.price >= 50000 && a.price <= 200000);
    if (priceRangeId === '200k-500k') return list.filter(a => a.price >= 200000 && a.price <= 500000);
    if (priceRangeId === '500k-1m') return list.filter(a => a.price >= 500000 && a.price <= 1000000);
    if (priceRangeId === '1m-5m') return list.filter(a => a.price >= 1000000 && a.price <= 5000000);
    if (priceRangeId === '5m-10m') return list.filter(a => a.price >= 5000000 && a.price <= 10000000);
    if (priceRangeId === '10m-15m') return list.filter(a => a.price >= 10000000 && a.price <= 15000000);
    if (priceRangeId === '15m-20m') return list.filter(a => a.price >= 15000000 && a.price <= 20000000);
    if (priceRangeId === 'over-20m') return list.filter(a => a.price > 20000000);
    return list;
  }

  sortList(list, sortBy) {
    const cloned = [...list];
    if (sortBy === 'price-asc') return cloned.sort((a, b) => a.price - b.price);
    if (sortBy === 'price-desc') return cloned.sort((a, b) => b.price - a.price);
    if (sortBy === 'newest') return cloned.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (sortBy === 'oldest') return cloned.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    if (sortBy === 'random') return cloned.sort(() => Math.random() - 0.5);
    return cloned;
  }

  buildWarehouseHTML(gameKey, list, warehouseName) {
    if (!list || list.length === 0) {
      const adminBtn = store.user.isAdmin ? `
        <div style="margin-top: 16px;">
          <button class="btn-admin-nav" onclick="document.getElementById('btn-admin-open-add-acc')?.click()">
            <span>➕</span> Thêm Acc Vào Kho Này Ngay
          </button>
        </div>
      ` : '';

      return `
        <div class="empty-warehouse-box" style="padding: 45px 20px;">
          <div class="empty-icon" style="font-size: 3rem; margin-bottom: 12px;">📦</div>
          <div class="empty-title" style="font-size: 1.2rem; font-weight: 800; text-transform: uppercase;">
            HIỆN CHƯA CÓ TÀI KHOẢN NÀO TRONG KHO
          </div>
          <p class="empty-desc" style="color: var(--text-muted); font-size: 0.88rem; margin-top: 6px;">
            Số lượng hiện tại: <strong style="color: var(--accent-gold);">0 tài khoản</strong>.<br>
            Hệ thống đang sẵn sàng, tài khoản sẽ xuất hiện ngay khi Admin thêm vào kho!
          </p>
          ${adminBtn}
        </div>
      `;
    }

    return `
      <div class="acc-cards-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px;">
        ${list.map(acc => `
          <div class="acc-card-item" data-acc-id="${acc.id}" title="Bấm để xem chi tiết tài khoản #${acc.id}">
            <div class="acc-card-thumb-wrapper" style="position: relative; overflow: hidden; border-radius: var(--radius-md) var(--radius-md) 0 0;">
              <img src="${acc.image}" class="acc-card-thumb-img" alt="${acc.title}">
              <span class="acc-tag-code">#${acc.id}</span>
              ${acc.prime ? `<span class="acc-tag-prime">${acc.prime}</span>` : ''}
              ${acc.ovr ? `<span class="acc-tag-prime" style="background: #10b981; color: #fff;">${acc.ovr}</span>` : ''}
              ${acc.server ? `<span class="acc-tag-prime" style="background: #0ea5e9; color: #fff;">${acc.server}</span>` : ''}
              <span class="acc-card-badge-flash">⚡ FLASH SALE</span>
              ${acc.rank && acc.rank !== 'Sẵn sàng' ? `<span class="acc-card-badge-rank-corner">${acc.rank}</span>` : ''}
            </div>
            <div class="acc-card-info">
              <h3 class="acc-card-name">${acc.title}</h3>
              <div class="acc-meta-details">
                <div class="acc-meta-item">Game: <strong>${(acc.game === 'blindbag' || acc.game === 'ff-blindbag') ? 'Túi Mù FF' : (acc.game === 'freefire' ? 'Free Fire' : (acc.game === 'lienquan' ? 'Liên Quân' : 'FC Mobile'))}</strong></div>
                <div class="acc-meta-item">Loại: <strong>${acc.accountType || 'VIP'}</strong></div>
              </div>
              <p style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 12px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                ${acc.description}
              </p>
              <div class="acc-card-footer">
                <div class="acc-price-wrap">
                  <span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Giá bán:</span>
                  <span class="acc-price-num" style="color: #ff2a44; font-weight: 800; font-size: 1.15rem;">${acc.price.toLocaleString('vi-VN')} đ</span>
                </div>
                <button class="btn-action-buy-item btn-action-view-detail" data-acc-id="${acc.id}" style="padding: 8px 16px; border-radius: var(--radius-md); background: linear-gradient(135deg, #0084ff, #0056b3); color: #fff; font-weight: 700; border: none; cursor: pointer;">
                  XEM CHI TIẾT
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // --- 5. BẤM VÀO THẺ ACC -> CHUYỂN SANG KHU VỰC CHI TIẾT NICK ---
  attachCardBuyTriggers(container) {
    container.querySelectorAll('.acc-card-item').forEach(card => {
      card.addEventListener('click', (e) => {
        const accId = card.dataset.accId;
        if (accId) {
          this.openAccountDetail(accId);
        }
      });
    });
  }

  // --- 5B. XỬ LÝ MUA ACC AN TOÀN (TỪ KHU VỰC CHI TIẾT HOẶC SHOP) ---
  async handleBuyAccount(accId) {
    if (!accId) return;

    // 1. Bắt buộc đăng nhập
    if (!store.user.isLoggedIn) {
      this.openAuthModal('login', true);
      return;
    }

    // 2. Chặn tuyệt đối Quản trị viên không được mua tài khoản trong shop
    if (store.user.isAdmin) {
      showPopup({
        title: "⛔ QUẢN TRỊ VIÊN KHÔNG THỂ MUA NICK",
        message: "Tài khoản Quản trị viên (Admin) không được phép thực hiện giao dịch mua nick trong shop!\n\nBạn là chủ shop, để trải nghiệm luồng mua hàng như khách hàng thực tế, vui lòng Đăng xuất và sử dụng một tài khoản khách thông thường.",
        type: "warning",
        confirmText: "Đã Hiểu"
      });
      return;
    }

    // 3. Thực hiện mua
    const res = store.purchaseAccount(accId);
    if (!res.success) {
      const goDeposit = await showConfirm(res.message + "\n\nBạn có muốn mở trang nạp tiền vào ví ngay không?", {
        title: "Số Dư Không Đủ",
        type: "warning",
        confirmText: "Nạp Tiền Ngay",
        cancelText: "Để Sau"
      });
      if (goDeposit) {
        this.openDepositModal();
      }
      return;
    }

    // 4. Bàn giao tài khoản thành công
    showPopup({
      title: "🎉 MUA TÀI KHOẢN THÀNH CÔNG!",
      message: `Mã đơn hàng: #${res.order.orderId}\n` +
               `Mã nick: #${res.account.id}\n` +
               `Tiêu đề: ${res.account.title}\n` +
               `Số tiền đã trừ: ${res.account.price.toLocaleString('vi-VN')} đ\n\n` +
               `🔐 THÔNG TIN ĐĂNG NHẬP NICK:\n👉 ${res.account.credentials}\n\n` +
               `(Lưu ý: Bạn hãy lưu lại thông tin và đổi mật khẩu ngay nhé!)`,
      type: "success",
      confirmText: "Tuyệt Vời!"
    });

    this.renderWarehouses();
    const updatedAcc = store.accounts.find(a => a.id === accId);
    if (updatedAcc && updatedAcc.status === 'AVAILABLE') {
      this.renderAccountDetail(updatedAcc);
    } else {
      this.closeAccountDetail();
    }
  }

  // --- 5C. KHU VỰC CHI TIẾT TÀI KHOẢN (ACCOUNT DETAIL SHOWCASE) & ROUTING ---
  initRouteHash() {
    const checkHash = () => {
      let hash = window.location.hash || '';

      // Tự động gán #trangchu vào thanh địa chỉ nếu người dùng mới vào web mà chưa có hash
      if (!hash || hash === '#') {
        history.replaceState(null, '', '#trangchu');
        hash = '#trangchu';
      }

      if (hash.startsWith('#acc-')) {
        const accId = hash.replace('#acc-', '').trim();
        if (accId) {
          this.openAccountDetail(accId, false);
        }
      } else if (hash === '#kho-freefire') {
        this.openWarehouse('freefire', false);
      } else if (hash === '#kho-lienquan') {
        this.openWarehouse('lienquan', false);
      } else if (hash === '#kho-fcmobile') {
        this.openWarehouse('fcmobile', false);
      } else if (hash === '#kho-blindbag' || hash === '#tui-mu-freefire') {
        this.openWarehouse('blindbag', false);
      } else if (hash === '#kho-admin' || hash === '#admin-hub') {
        if (store.user?.isAdmin) {
          this.openWarehouse('admin', false);
        } else {
          this.closeWarehouseDetail(false);
          history.replaceState(null, '', '#trangchu');
          showToast("⛔ Khu vực cách ly: Chỉ Quản Trị Viên mới có quyền truy cập!", "danger");
        }
      } else if (hash.startsWith('#kho-')) {
        const g = hash.replace('#kho-', '').trim();
        if (['freefire', 'lienquan', 'fcmobile', 'blindbag', 'admin'].includes(g)) {
          this.openWarehouse(g, false);
        }
      } else if (hash === '#admin-add-acc') {
        if (store.user?.isAdmin) {
          this.openAddAccView(false);
        } else {
          this.closeAddAccView(false);
          history.replaceState(null, '', '#trangchu');
          showToast("⛔ Khu vực cách ly: Chỉ Quản Trị Viên mới có quyền truy cập!", "danger");
        }
      } else {
        // #trangchu hoặc hash khác -> quay về giao diện trang chủ
        if (this.activeDetailAccId) {
          this.closeAccountDetail(false);
        }
        const adminAddView = document.getElementById('view-admin-add-acc');
        if (adminAddView && adminAddView.style.display !== 'none') {
          this.closeAddAccView(false);
        }
        this.closeWarehouseDetail(false);
      }
    };

    window.addEventListener('hashchange', checkHash);
    checkHash();
    setTimeout(checkHash, 150);
  }

  attachAccountDetailEvents() {
    // 1. Nút Quay Lại & Breadcrumbs
    document.getElementById('btn-detail-back-shop')?.addEventListener('click', () => {
      this.closeAccountDetail();
    });
    document.getElementById('bc-home-link')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.currentActiveWarehouse = null;
      this.closeAccountDetail(false);
      this.closeWarehouseDetail(false);
      window.location.hash = 'trangchu';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    document.getElementById('bc-shop-link')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.closeAccountDetail(true);
    });

    // 2. Nút Copy Mã Nick
    document.getElementById('btn-copy-acc-id')?.addEventListener('click', () => {
      if (this.activeDetailAccId) {
        navigator.clipboard.writeText(this.activeDetailAccId).then(() => {
          showToast(`Đã sao chép mã nick #${this.activeDetailAccId}!`, 'info');
        }).catch(() => {
          showToast(`Mã nick: #${this.activeDetailAccId}`, 'info');
        });
      }
    });

    // 3. Nút Phóng To Ảnh (Lightbox Modal)
    const lightboxModal = document.getElementById('lightbox-modal');
    const lightboxImg = document.getElementById('lightbox-full-img');
    const lightboxCaption = document.getElementById('lightbox-img-caption');
    const lightboxCloseBtn = document.getElementById('lightbox-close-btn');

    document.getElementById('btn-gallery-zoom-img')?.addEventListener('click', () => {
      if (this.currentGalleryImages.length > 0 && lightboxModal && lightboxImg) {
        lightboxImg.src = this.currentGalleryImages[this.currentGalleryIndex];
        if (lightboxCaption) {
          lightboxCaption.textContent = `Tài khoản #${this.activeDetailAccId} - Ảnh ${this.currentGalleryIndex + 1} / ${this.currentGalleryImages.length}`;
        }
        lightboxModal.classList.add('active');
      }
    });

    lightboxCloseBtn?.addEventListener('click', () => {
      lightboxModal?.classList.remove('active');
    });

    lightboxModal?.addEventListener('click', (e) => {
      if (e.target === lightboxModal) {
        lightboxModal.classList.remove('active');
      }
    });

    // 4. Mũi tên chuyển ảnh Gallery Trái / Phải
    document.getElementById('btn-gallery-prev')?.addEventListener('click', () => {
      if (this.currentGalleryImages.length > 0) {
        this.currentGalleryIndex = (this.currentGalleryIndex - 1 + this.currentGalleryImages.length) % this.currentGalleryImages.length;
        this.updateGalleryView();
      }
    });

    document.getElementById('btn-gallery-next')?.addEventListener('click', () => {
      if (this.currentGalleryImages.length > 0) {
        this.currentGalleryIndex = (this.currentGalleryIndex + 1) % this.currentGalleryImages.length;
        this.updateGalleryView();
      }
    });

    // 5. Nút MUA NGAY trong trang chi tiết
    document.getElementById('btn-detail-action-buy')?.addEventListener('click', () => {
      if (this.activeDetailAccId) {
        this.handleBuyAccount(this.activeDetailAccId);
      }
    });

    // 6. Nút Nạp Thẻ Cào & Nạp ATM từ trang chi tiết
    document.getElementById('btn-detail-open-topup-card')?.addEventListener('click', () => {
      this.openDepositModal();
      document.getElementById('tab-deposit-card')?.click();
    });

    document.getElementById('btn-detail-open-topup-atm')?.addEventListener('click', () => {
      this.openDepositModal();
      document.getElementById('tab-deposit-bank')?.click();
      if (this.activeDetailAccId) {
        const acc = store.accounts.find(a => a.id === this.activeDetailAccId);
        if (acc) {
          const bankAmt = document.getElementById('bank-deposit-amount');
          if (bankAmt) {
            bankAmt.value = acc.price;
            bankAmt.dispatchEvent(new Event('input'));
          }
        }
      }
    });
  }

  openAccountDetail(accId, updateHash = true) {
    const acc = store.accounts.find(a => a.id === accId);
    if (!acc) {
      showToast("Tài khoản không tồn tại hoặc đã được gỡ!", "error");
      return;
    }

    this.activeDetailAccId = accId;
    if (updateHash) {
      window.location.hash = 'acc-' + accId;
    }

    const shopView = document.getElementById('view-shop-warehouses');
    const detailView = document.getElementById('view-account-detail');
    const adminAddView = document.getElementById('view-admin-add-acc');

    if (shopView) shopView.style.display = 'none';
    if (adminAddView) adminAddView.style.display = 'none';
    if (detailView) detailView.style.display = 'block';

    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.renderAccountDetail(acc);
  }

  closeAccountDetail(updateHash = true) {
    this.activeDetailAccId = null;
    if (updateHash) {
      if (window.location.hash.startsWith('#acc-')) {
        if (this.currentActiveWarehouse) {
          window.location.hash = 'kho-' + this.currentActiveWarehouse;
        } else {
          window.location.hash = 'trangchu';
        }
      }
    }

    const shopView = document.getElementById('view-shop-warehouses');
    const detailView = document.getElementById('view-account-detail');
    const adminAddView = document.getElementById('view-admin-add-acc');

    if (detailView) detailView.style.display = 'none';
    if (adminAddView) adminAddView.style.display = 'none';
    if (shopView) shopView.style.display = 'block';

    if (this.currentActiveWarehouse) {
      this.openWarehouse(this.currentActiveWarehouse, false);
    } else {
      this.closeWarehouseDetail(false);
    }
  }

  renderAccountDetail(acc) {
    const gameNames = {
      freefire: "Free Fire",
      lienquan: "Liên Quân Mobile",
      fcmobile: "FC Mobile",
      blindbag: "Túi Mù Free Fire",
      "ff-blindbag": "Túi Mù Free Fire",
      roblox: "Roblox"
    };
    const gameName = gameNames[acc.game] || 'Game Online';

    // 1. Breadcrumbs
    const bcGame = document.getElementById('bc-game-name');
    const bcAcc = document.getElementById('bc-acc-title');
    if (bcGame) bcGame.textContent = gameName;
    if (bcAcc) bcAcc.textContent = `Chi tiết nick #${acc.id}`;

    // 2. Titles & Codes
    const titleEl = document.getElementById('detail-acc-title');
    const codeEl = document.getElementById('detail-acc-code-val');
    const badgeId = document.getElementById('detail-badge-id');
    const badgeTag = document.getElementById('detail-badge-tag');

    if (titleEl) titleEl.textContent = acc.title || `Tài khoản ${gameName} #${acc.id}`;
    if (codeEl) codeEl.textContent = `#${acc.id}`;
    if (badgeId) badgeId.textContent = `#${acc.id}`;
    if (badgeTag) badgeTag.textContent = acc.prime || acc.ovr || (acc.rank && acc.rank !== 'Sẵn sàng' ? acc.rank : 'FLASH SALE');

    // 3. Specs
    const specGame = document.getElementById('detail-spec-game');
    const specType = document.getElementById('detail-spec-type');
    const rankLabel = document.getElementById('detail-spec-rank-label');
    const rankVal = document.getElementById('detail-spec-rank-val');
    const specStatus = document.getElementById('detail-spec-status');

    if (specGame) specGame.textContent = gameName;
    if (specType) specType.textContent = acc.accountType || 'Tự chọn';
    if (rankLabel) {
      rankLabel.textContent = acc.game === 'fcmobile' ? 'Chỉ số OVR' : (acc.game === 'freefire' ? 'Bậc Prime / Rank' : 'Bậc Rank');
    }
    if (rankVal) {
      rankVal.textContent = acc.rank || acc.prime || acc.ovr || 'Sẵn sàng';
    }
    if (specStatus) {
      if (acc.status === 'AVAILABLE') {
        specStatus.textContent = 'Sẵn sàng giao dịch';
        specStatus.style.color = 'var(--accent-cyan)';
      } else {
        specStatus.textContent = 'Đã bán';
        specStatus.style.color = '#ff3b53';
      }
    }

    // 4. Giá & Nút hành động
    const priceEl = document.getElementById('detail-price-headline');
    const topupCardSub = document.getElementById('detail-topup-card-sub');
    const topupAtmSub = document.getElementById('detail-topup-atm-sub');
    const buyBtn = document.getElementById('btn-detail-action-buy');

    if (priceEl) {
      priceEl.innerHTML = `${acc.price.toLocaleString('vi-VN')} <span class="currency-symbol">đ</span>`;
    }
    if (topupCardSub) {
      const cardEst = Math.round(acc.price * 1.25);
      topupCardSub.textContent = `Cần ~${cardEst.toLocaleString('vi-VN')} đ thẻ`;
    }
    if (topupAtmSub) {
      topupAtmSub.textContent = `Cần ${acc.price.toLocaleString('vi-VN')} đ ATM`;
    }
    if (buyBtn) {
      if (acc.status === 'AVAILABLE') {
        buyBtn.disabled = false;
        buyBtn.innerHTML = `<span>⚡</span> MUA NGAY`;
        buyBtn.style.opacity = '1';
        buyBtn.style.cursor = 'pointer';
      } else {
        buyBtn.disabled = true;
        buyBtn.innerHTML = `<span>🔒</span> TÀI KHOẢN ĐÃ ĐƯỢC BÁN`;
        buyBtn.style.opacity = '0.6';
        buyBtn.style.cursor = 'not-allowed';
      }
    }

    // 5. Mô tả chi tiết dịch vụ
    const descText = document.getElementById('detail-service-desc-text');
    if (descText) {
      descText.textContent = acc.description || 'Tài khoản chính chủ, bảo mật tuyệt đối 100%. Nhận nick tự động và có bảo hành chuẩn sàn.';
    }

    // 6. Gallery Album Ảnh
    let imgs = [];
    if (Array.isArray(acc.images) && acc.images.length > 0) {
      imgs = acc.images.filter(u => typeof u === 'string' && u.trim().length > 0);
    }
    if (imgs.length === 0 && acc.image) {
      imgs = [acc.image];
    }
    if (imgs.length === 0) {
      imgs = [store.getDefaultGameImage(acc.game)];
    }

    this.currentGalleryImages = imgs;
    this.currentGalleryIndex = 0;
    this.updateGalleryView();

    // 7. Render Tài Khoản Liên Quan
    this.renderRelatedAccounts(acc.game, acc.id);
  }

  updateGalleryView() {
    const mainImg = document.getElementById('detail-main-img');
    const curIdxEl = document.getElementById('gallery-current-index');
    const totalEl = document.getElementById('gallery-total-count');
    const track = document.getElementById('detail-thumb-track');

    if (this.currentGalleryImages.length === 0) return;

    if (this.currentGalleryIndex >= this.currentGalleryImages.length) {
      this.currentGalleryIndex = 0;
    }

    if (mainImg) {
      mainImg.style.opacity = '0.4';
      mainImg.src = this.currentGalleryImages[this.currentGalleryIndex];
      setTimeout(() => { mainImg.style.opacity = '1'; }, 50);
    }

    if (curIdxEl) curIdxEl.textContent = this.currentGalleryIndex + 1;
    if (totalEl) totalEl.textContent = this.currentGalleryImages.length;

    // Render thumbnail track
    if (track) {
      track.innerHTML = this.currentGalleryImages.map((url, idx) => `
        <img src="${url}" class="gallery-thumb-item ${idx === this.currentGalleryIndex ? 'active' : ''}" data-thumb-idx="${idx}" alt="Thumbnail ${idx + 1}">
      `).join('');

      track.querySelectorAll('.gallery-thumb-item').forEach(thumb => {
        thumb.addEventListener('click', () => {
          this.currentGalleryIndex = Number(thumb.dataset.thumbIdx);
          this.updateGalleryView();
        });
      });
    }
  }

  renderRelatedAccounts(game, currentAccId) {
    const container = document.getElementById('detail-related-accounts-container');
    if (!container) return;

    let related = store.accounts.filter(a => a.game === game && a.id !== currentAccId && a.status === 'AVAILABLE');
    if (related.length === 0) {
      related = store.accounts.filter(a => a.id !== currentAccId && a.status === 'AVAILABLE');
    }

    if (related.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 24px; text-align: center; color: var(--text-muted); background: var(--bg-surface); border-radius: var(--radius-md); border: 1px dashed var(--border-color);">
          Hiện chưa có thêm tài khoản nào khác trong kho này.
        </div>
      `;
      return;
    }

    const displayList = related.slice(0, 5);
    container.innerHTML = displayList.map(acc => `
      <div class="acc-card-item" data-acc-id="${acc.id}">
        <div class="acc-card-thumb-wrapper" style="position: relative; overflow: hidden; border-radius: var(--radius-md) var(--radius-md) 0 0;">
          <img src="${acc.image}" class="acc-card-thumb-img" alt="${acc.title}">
          <span class="acc-tag-code">#${acc.id}</span>
          ${acc.prime ? `<span class="acc-tag-prime">${acc.prime}</span>` : ''}
          ${acc.ovr ? `<span class="acc-tag-prime" style="background: #10b981; color: #fff;">${acc.ovr}</span>` : ''}
          ${acc.rank && acc.rank !== 'Sẵn sàng' ? `<span class="acc-card-badge-rank-corner">${acc.rank}</span>` : ''}
        </div>
        <div class="acc-card-info">
          <h3 class="acc-card-name" style="font-size: 0.92rem;">${acc.title}</h3>
          <div class="acc-card-footer" style="margin-top: 8px;">
            <div class="acc-price-wrap">
              <span class="acc-price-num" style="color: #ff2a44; font-weight: 800; font-size: 1.05rem;">${acc.price.toLocaleString('vi-VN')} đ</span>
            </div>
            <button class="btn-action-view-detail" data-acc-id="${acc.id}" style="padding: 6px 12px; border-radius: var(--radius-sm); background: rgba(0, 132, 255, 0.15); border: 1px solid rgba(0, 132, 255, 0.35); color: #00d2ff; font-weight: 700; font-size: 0.78rem; cursor: pointer;">
              Xem Nick
            </button>
          </div>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.acc-card-item').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.accId;
        if (id) {
          this.openAccountDetail(id);
        }
      });
    });
  }

  // --- 6. EVENT LỌC & SẮP XẾP ---
  attachWarehouseFilterEvents() {
    // --- TÌM KIẾM RIÊNG THEO TỪNG KHO ---
    // 1. Free Fire Search
    const ffSearchInput = document.getElementById('ff-search-input');
    const ffSearchClear = document.getElementById('ff-search-clear');
    ffSearchInput?.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      if (!store.filters.freefire) store.filters.freefire = {};
      store.filters.freefire.search = val;
      if (ffSearchClear) ffSearchClear.style.display = val ? 'flex' : 'none';
      this.renderFreeFireWarehouse();
    });
    ffSearchClear?.addEventListener('click', () => {
      if (ffSearchInput) ffSearchInput.value = '';
      if (!store.filters.freefire) store.filters.freefire = {};
      store.filters.freefire.search = '';
      ffSearchClear.style.display = 'none';
      this.renderFreeFireWarehouse();
    });

    // 2. Liên Quân Search
    const lqSearchInput = document.getElementById('lq-search-input');
    const lqSearchClear = document.getElementById('lq-search-clear');
    lqSearchInput?.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      if (!store.filters.lienquan) store.filters.lienquan = {};
      store.filters.lienquan.search = val;
      if (lqSearchClear) lqSearchClear.style.display = val ? 'flex' : 'none';
      this.renderLienQuanWarehouse();
    });
    lqSearchClear?.addEventListener('click', () => {
      if (lqSearchInput) lqSearchInput.value = '';
      if (!store.filters.lienquan) store.filters.lienquan = {};
      store.filters.lienquan.search = '';
      lqSearchClear.style.display = 'none';
      this.renderLienQuanWarehouse();
    });

    // 3. FC Mobile Search
    const fcSearchInput = document.getElementById('fc-search-input');
    const fcSearchClear = document.getElementById('fc-search-clear');
    fcSearchInput?.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      if (!store.filters.fcmobile) store.filters.fcmobile = {};
      store.filters.fcmobile.search = val;
      if (fcSearchClear) fcSearchClear.style.display = val ? 'flex' : 'none';
      this.renderFcMobileWarehouse();
    });
    fcSearchClear?.addEventListener('click', () => {
      if (fcSearchInput) fcSearchInput.value = '';
      if (!store.filters.fcmobile) store.filters.fcmobile = {};
      store.filters.fcmobile.search = '';
      fcSearchClear.style.display = 'none';
      this.renderFcMobileWarehouse();
    });

    // Free Fire: Prime Chips
    document.querySelectorAll('#ff-prime-chips .filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('#ff-prime-chips .filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        store.filters.freefire.prime = chip.dataset.prime;
        this.renderFreeFireWarehouse();
      });
    });

    // Free Fire: Sort
    document.getElementById('ff-sort-select')?.addEventListener('change', (e) => {
      store.filters.freefire.sortBy = e.target.value;
      this.renderFreeFireWarehouse();
    });

    // Liên Quân: Sort
    document.getElementById('lq-sort-select')?.addEventListener('change', (e) => {
      store.filters.lienquan.sortBy = e.target.value;
      this.renderLienQuanWarehouse();
    });

    // FC Mobile: Category Chips (Siêu ngon / Giá rẻ)
    document.querySelectorAll('#fc-category-chips .filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('#fc-category-chips .filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        if (!store.filters.fcmobile) store.filters.fcmobile = {};
        store.filters.fcmobile.category = chip.dataset.category;
        this.renderFcMobileWarehouse();
      });
    });

    // FC Mobile: Server Chips
    document.querySelectorAll('#fc-server-chips .filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('#fc-server-chips .filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        if (!store.filters.fcmobile) store.filters.fcmobile = {};
        store.filters.fcmobile.server = chip.dataset.server;
        this.renderFcMobileWarehouse();
      });
    });

    // FC Mobile: Sort
    document.getElementById('fc-sort-select')?.addEventListener('change', (e) => {
      if (!store.filters.fcmobile) store.filters.fcmobile = {};
      store.filters.fcmobile.sortBy = e.target.value;
      this.renderFcMobileWarehouse();
    });

    // 4. Kho Túi Mù Free Fire: Search
    const bbSearchInput = document.getElementById('blindbag-search-input');
    const bbSearchClear = document.getElementById('blindbag-search-clear');
    bbSearchInput?.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      if (!store.filters.blindbag) store.filters.blindbag = {};
      store.filters.blindbag.search = val;
      if (bbSearchClear) bbSearchClear.style.display = val ? 'flex' : 'none';
      this.renderBlindBagWarehouse();
    });
    bbSearchClear?.addEventListener('click', () => {
      if (bbSearchInput) bbSearchInput.value = '';
      if (!store.filters.blindbag) store.filters.blindbag = {};
      store.filters.blindbag.search = '';
      bbSearchClear.style.display = 'none';
      this.renderBlindBagWarehouse();
    });

    // Kho Túi Mù: Price Chips
    document.querySelectorAll('#blindbag-price-chips .filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('#blindbag-price-chips .filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        if (!store.filters.blindbag) store.filters.blindbag = {};
        store.filters.blindbag.priceRange = chip.dataset.priceRange;
        this.renderBlindBagWarehouse();
      });
    });

    // Kho Túi Mù: Sort
    document.getElementById('blindbag-sort-select')?.addEventListener('change', (e) => {
      if (!store.filters.blindbag) store.filters.blindbag = {};
      store.filters.blindbag.sortBy = e.target.value;
      this.renderBlindBagWarehouse();
    });
  }

  // --- 7. KHU VỰC QUẢN TRỊ VIÊN: THÊM ACC (DEDICATED VIEW) & BÁO CÁO DOANH THU ---
  openAddAccView(updateHash = true) {
    if (!store.user?.isAdmin) {
      showToast("Chức năng chỉ dành riêng cho Quản Trị Viên!", "warning");
      return;
    }

    if (this.activeDetailAccId) {
      this.activeDetailAccId = null;
    }

    if (updateHash) {
      window.location.hash = 'admin-add-acc';
    }

    const shopView = document.getElementById('view-shop-warehouses');
    const detailView = document.getElementById('view-account-detail');
    const adminAddView = document.getElementById('view-admin-add-acc');

    if (shopView) shopView.style.display = 'none';
    if (detailView) detailView.style.display = 'none';
    if (adminAddView) adminAddView.style.display = 'block';

    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Tự sinh ID ban đầu nếu chưa có
    const idInput = document.getElementById('admin-acc-id');
    if (idInput && !idInput.value) {
      idInput.value = 'TZ-' + Math.floor(100000 + Math.random() * 900000);
    }

    // Nếu chưa có ảnh nào thì khởi tạo 1 ảnh mặc định ban đầu
    if (!this.adminUploadedImages || this.adminUploadedImages.length === 0) {
      this.adminUploadedImages = ['https://images.unsplash.com/photo-1542751371-adc38448a05e?w=700'];
    }

    this.renderAdminUploadedStrip();
    this.updateAdminLivePreview();
  }

  closeAddAccView(updateHash = true) {
    if (updateHash) {
      if (window.location.hash === '#admin-add-acc') {
        window.location.hash = this.currentActiveWarehouse ? ('kho-' + this.currentActiveWarehouse) : 'trangchu';
      }
    }

    const shopView = document.getElementById('view-shop-warehouses');
    const detailView = document.getElementById('view-account-detail');
    const adminAddView = document.getElementById('view-admin-add-acc');

    if (adminAddView) adminAddView.style.display = 'none';
    if (detailView) detailView.style.display = 'none';
    if (shopView) shopView.style.display = 'block';
  }

  // Nén ảnh từ file người dùng chọn trên máy tính (sắc nét & chống tràn dung lượng)
  compressAndReadImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 900;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Nén JPEG chất lượng 0.78 siêu sắc nét mà dung lượng cực nhẹ (~35-65KB)
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.78);
          resolve(compressedBase64);
        };
        img.onerror = () => resolve(e.target.result);
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Xử lý nạp danh sách tệp ảnh từ Drag & Drop hoặc File Input
  async handleAdminFilesUpload(fileList) {
    if (!fileList || fileList.length === 0) return;
    const validFiles = Array.from(fileList).filter(f => f.type.startsWith('image/'));
    if (validFiles.length === 0) {
      showToast("Vui lòng chỉ kéo thả tệp hình ảnh (PNG, JPG, JPEG, WEBP)!", "warning");
      return;
    }

    showToast(`Đang tải & xử lý ${validFiles.length} ảnh từ máy tính...`, "info");

    // Nếu hiện tại chỉ có 1 ảnh mẫu unsplash khởi tạo thì thay thế bằng ảnh của máy
    if (this.adminUploadedImages.length === 1 && this.adminUploadedImages[0].includes('images.unsplash.com')) {
      this.adminUploadedImages = [];
    }

    try {
      const readPromises = validFiles.map(file => this.compressAndReadImage(file));
      const results = await Promise.all(readPromises);
      results.forEach(url => {
        this.adminUploadedImages.push(url);
      });
      this.renderAdminUploadedStrip();
      showToast(`Đã thêm thành công ${results.length} ảnh từ thư mục máy tính!`, "success");
    } catch (err) {
      console.error("Lỗi đọc file ảnh:", err);
      showToast("Không thể xử lý tệp ảnh vừa chọn!", "error");
    }
  }

  // Render dải thumbnail quản lý ảnh đã upload của Admin
  renderAdminUploadedStrip() {
    const strip = document.getElementById('admin-uploaded-strip');
    const countLabel = document.getElementById('admin-uploaded-count-label');
    const mainImgHidden = document.getElementById('admin-acc-image');
    const galleryHidden = document.getElementById('admin-acc-images');

    const total = this.adminUploadedImages.length;
    if (countLabel) {
      countLabel.textContent = `Danh sách ảnh đã chọn (${total} ảnh):`;
    }

    // Đồng bộ vào input ẩn
    if (mainImgHidden) mainImgHidden.value = this.adminUploadedImages[0] || '';
    if (galleryHidden) galleryHidden.value = this.adminUploadedImages.slice(1).join('\n');

    if (!strip) return;

    if (total === 0) {
      strip.innerHTML = `
        <div style="font-size: 0.8rem; color: var(--text-muted); padding: 8px 4px;">
          Chưa có ảnh nào được chọn. Hãy kéo thả ảnh từ máy tính hoặc bấm nút "Dùng 4 ảnh mẫu demo".
        </div>
      `;
      this.updateAdminLivePreview();
      return;
    }

    strip.innerHTML = this.adminUploadedImages.map((imgUrl, idx) => {
      const isCover = idx === 0;
      return `
        <div class="admin-upload-card ${isCover ? 'is-cover' : ''}" data-idx="${idx}">
          <img src="${imgUrl}" alt="Ảnh ${idx + 1}" onerror="this.style.opacity='0.2'">
          ${isCover ? '<span class="badge-cover-tag">⭐ ẢNH BÌA</span>' : ''}
          <button type="button" class="btn-card-del" data-del-idx="${idx}" title="Xóa ảnh này">✕</button>
          ${!isCover ? `<button type="button" class="btn-set-cover" data-cover-idx="${idx}">⭐ Đặt làm bìa</button>` : ''}
        </div>
      `;
    }).join('');

    // Gắn sự kiện xóa ảnh
    strip.querySelectorAll('.btn-card-del').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const delIdx = Number(btn.dataset.delIdx);
        this.adminUploadedImages.splice(delIdx, 1);
        this.renderAdminUploadedStrip();
        showToast("Đã xóa 1 ảnh khỏi danh sách!", "info");
      });
    });

    // Gắn sự kiện đặt làm ảnh bìa chính
    strip.querySelectorAll('.btn-set-cover').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const coverIdx = Number(btn.dataset.coverIdx);
        if (coverIdx > 0 && coverIdx < this.adminUploadedImages.length) {
          const selectedImg = this.adminUploadedImages.splice(coverIdx, 1)[0];
          this.adminUploadedImages.unshift(selectedImg); // Đưa lên đầu làm ảnh bìa
          this.renderAdminUploadedStrip();
          showToast("Đã chuyển ảnh này thành Ảnh Bìa Chính!", "success");
        }
      });
    });

    this.updateAdminLivePreview();
  }

  updateAdminLivePreview() {
    const game = document.getElementById('admin-acc-game')?.value || 'freefire';
    const prime = document.getElementById('admin-acc-prime')?.value || '';
    const ovr = document.getElementById('admin-acc-ovr')?.value || '';
    const fcCat = document.getElementById('admin-acc-fc-category')?.value || '';
    const server = document.getElementById('admin-acc-server')?.value || '';
    const type = document.getElementById('admin-acc-type')?.value || 'Tự chọn';
    const rank = document.getElementById('admin-acc-rank')?.value || 'Sẵn sàng';
    const id = (document.getElementById('admin-acc-id')?.value || 'TZ-1029').replace(/^#/, '');
    const priceVal = Number(document.getElementById('admin-acc-price')?.value || 0);
    const title = document.getElementById('admin-acc-title')?.value || `Tài khoản ${game} #${id}`;
    
    // Lấy ảnh bìa chính từ mảng ảnh đã upload hoặc fallback
    const mainImg = (this.adminUploadedImages && this.adminUploadedImages.length > 0)
      ? this.adminUploadedImages[0]
      : 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=700';

    const desc = document.getElementById('admin-acc-desc')?.value || 'Trắng thông tin 100%, bảo mật tuyệt đối, nhận nick tự động đổi mật khẩu được ngay.';

    const gameNames = {
      freefire: "Free Fire",
      lienquan: "Liên Quân Mobile",
      fcmobile: "FC Mobile",
      blindbag: "Túi Mù Free Fire",
      roblox: "Roblox"
    };
    const gameName = gameNames[game] || 'Game Online';

    // Tag badge
    let tag = 'FLASH SALE';
    if (game === 'freefire' && prime) tag = prime;
    else if (game === 'fcmobile') tag = fcCat === 'over-1m' ? 'SIÊU PHẨM' : (fcCat === 'under-1m' ? 'GIÁ RẺ' : (ovr ? `OVR ${ovr}` : 'OVR VIP'));
    else if (rank && rank !== 'Sẵn sàng') tag = rank;

    // Cập nhật DOM Live Preview
    const imgEl = document.getElementById('admin-live-img');
    const badgeIdEl = document.getElementById('admin-live-badge-id');
    const badgeTagEl = document.getElementById('admin-live-badge-tag');
    const titleEl = document.getElementById('admin-live-title');
    const codeEl = document.getElementById('admin-live-code');
    const gameEl = document.getElementById('admin-live-game');
    const typeEl = document.getElementById('admin-live-type');
    const rankEl = document.getElementById('admin-live-rank');
    const priceEl = document.getElementById('admin-live-price');
    const descEl = document.getElementById('admin-live-desc');

    if (imgEl) imgEl.src = mainImg;
    if (badgeIdEl) badgeIdEl.textContent = `#${id}`;
    if (badgeTagEl) badgeTagEl.textContent = tag;
    if (titleEl) titleEl.textContent = title;
    if (codeEl) codeEl.textContent = `#${id}`;
    if (gameEl) gameEl.textContent = gameName;
    if (typeEl) typeEl.textContent = type;
    if (rankEl) rankEl.textContent = rank;
    if (priceEl) priceEl.innerHTML = `${priceVal.toLocaleString('vi-VN')} <span class="currency-symbol">đ</span>`;
    if (descEl) descEl.textContent = desc;

    // Thumbnails strip trên Live Preview
    const allThumbs = (this.adminUploadedImages && this.adminUploadedImages.length > 0)
      ? this.adminUploadedImages
      : [mainImg];

    const thumbsContainer = document.getElementById('admin-live-thumbs-strip');
    if (thumbsContainer) {
      thumbsContainer.innerHTML = allThumbs.map((url, idx) => `
        <div class="detail-thumb-item ${idx === 0 ? 'active' : ''}" data-url="${url}" style="width: 58px; height: 42px; border-radius: 4px; overflow: hidden; border: 2px solid ${idx === 0 ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)'}; cursor: pointer; flex-shrink: 0;">
          <img src="${url}" alt="thumb ${idx + 1}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.opacity='0.3'">
        </div>
      `).join('');

      thumbsContainer.querySelectorAll('.detail-thumb-item').forEach(thumb => {
        thumb.addEventListener('click', () => {
          thumbsContainer.querySelectorAll('.detail-thumb-item').forEach(t => {
            t.classList.remove('active');
            t.style.borderColor = 'rgba(255,255,255,0.1)';
          });
          thumb.classList.add('active');
          thumb.style.borderColor = 'var(--primary-color)';
          if (imgEl) imgEl.src = thumb.dataset.url;
        });
      });
    }
  }

  attachAdminEvents() {
    // 1. Điều hướng Khu Vực Thêm Acc Admin (Dedicated Workspace)
    document.getElementById('btn-admin-add-back-shop')?.addEventListener('click', () => {
      this.closeAddAccView();
    });
    document.getElementById('bc-admin-home-link')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.closeAddAccView();
    });

    // Nút sinh mã ID ngẫu nhiên
    document.getElementById('btn-admin-gen-id')?.addEventListener('click', () => {
      const idInput = document.getElementById('admin-acc-id');
      if (idInput) {
        idInput.value = 'TZ-' + Math.floor(100000 + Math.random() * 900000);
        this.updateAdminLivePreview();
        showToast("Đã tạo mã nick ngẫu nhiên mới!", "info");
      }
    });

    // Phân loại Game động (Prime cho FF, OVR & Server cho FC Mobile)
    const gameSelect = document.getElementById('admin-acc-game');
    const primeGroup = document.getElementById('admin-prime-group');
    const fcGroup = document.getElementById('admin-fcmobile-group');

    gameSelect?.addEventListener('change', () => {
      const val = gameSelect.value;
      if (val === 'freefire' || val === 'blindbag') {
        if (primeGroup) primeGroup.style.display = 'block';
        if (fcGroup) fcGroup.style.display = 'none';
      } else if (val === 'fcmobile') {
        if (primeGroup) primeGroup.style.display = 'none';
        if (fcGroup) fcGroup.style.display = 'block';
      } else {
        if (primeGroup) primeGroup.style.display = 'none';
        if (fcGroup) fcGroup.style.display = 'none';
      }
      this.updateAdminLivePreview();
    });

    // --- KÉO THẢ ẢNH TỪ FOLDER MÁY TÍNH (DRAG & DROP ZONE) ---
    const dropzone = document.getElementById('admin-acc-dropzone');
    const fileInput = document.getElementById('admin-acc-file-input');

    dropzone?.addEventListener('click', () => {
      fileInput?.click();
    });

    fileInput?.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        this.handleAdminFilesUpload(e.target.files);
        e.target.value = ''; // Reset input để có thể chọn lại cùng file nếu muốn
      }
    });

    // Xử lý sự kiện kéo thả từ folder máy tính
    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone?.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('dragover');
      });
    });

    ['dragleave', 'dragend'].forEach(eventName => {
      dropzone?.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('dragover');
      });
    });

    dropzone?.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        this.handleAdminFilesUpload(e.dataTransfer.files);
      }
    });

    // Nút xóa tất cả ảnh đã chọn
    document.getElementById('btn-admin-clear-all-imgs')?.addEventListener('click', () => {
      this.adminUploadedImages = [];
      this.renderAdminUploadedStrip();
      showToast("Đã xóa tất cả ảnh vừa chọn!", "info");
    });

    // Nút nạp nhanh 4 ảnh kho đồ mẫu demo chất lượng cao
    document.getElementById('btn-admin-fill-sample-imgs')?.addEventListener('click', () => {
      const g = gameSelect ? gameSelect.value : 'freefire';
      let sampleList = [];
      if (g === 'freefire') {
        sampleList = [
          'assets/images/cat-freefire.jpg',
          'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800',
          'https://images.unsplash.com/photo-1563089145-599997674d42?w=800',
          'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800'
        ];
      } else if (g === 'lienquan') {
        sampleList = [
          'assets/images/cat-lienquan.jpg',
          'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800',
          'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800',
          'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800'
        ];
      } else if (g === 'blindbag') {
        sampleList = [
          'assets/images/cat-ff-blindbag.jpg',
          'assets/images/cat-freefire.jpg',
          'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800',
          'https://images.unsplash.com/photo-1563089145-599997674d42?w=800'
        ];
      } else {
        sampleList = [
          'assets/images/cat-fcmobile.jpg',
          'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800',
          'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800',
          'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=800'
        ];
      }
      this.adminUploadedImages = [...sampleList];
      this.renderAdminUploadedStrip();
      showToast("Đã nạp nhanh 4 ảnh kho đồ mẫu demo!", "info");
    });

    // Live update khi gõ vào các trường text/số trong form
    const formAdminAdd = document.getElementById('form-admin-add-acc');
    formAdminAdd?.addEventListener('input', () => {
      this.updateAdminLivePreview();
    });
    formAdminAdd?.addEventListener('change', () => {
      this.updateAdminLivePreview();
    });

    // Xử lý gửi form thêm acc
    formAdminAdd?.addEventListener('submit', (e) => {
      e.preventDefault();

      if (!this.adminUploadedImages || this.adminUploadedImages.length === 0) {
        showToast("Vui lòng tải lên ít nhất 1 ảnh (kéo từ máy tính hoặc bấm dùng ảnh mẫu)!", "warning");
        return;
      }

      const game = document.getElementById('admin-acc-game').value;
      const prime = document.getElementById('admin-acc-prime')?.value;
      const ovr = document.getElementById('admin-acc-ovr')?.value;
      const fcCat = document.getElementById('admin-acc-fc-category')?.value;
      const server = document.getElementById('admin-acc-server')?.value;
      const accountType = document.getElementById('admin-acc-type')?.value || 'Tự chọn';
      const rank = document.getElementById('admin-acc-rank')?.value.trim() || 'Sẵn sàng';
      const id = document.getElementById('admin-acc-id').value.trim();
      const title = document.getElementById('admin-acc-title').value.trim();
      const price = Number(document.getElementById('admin-acc-price').value);
      
      // Ảnh bìa chính là ảnh đầu tiên, các ảnh sau là album
      const image = this.adminUploadedImages[0];
      const rawImages = this.adminUploadedImages.slice(1).join('\n');

      const credentials = document.getElementById('admin-acc-credentials').value.trim();
      const description = document.getElementById('admin-acc-desc').value.trim();

      const newAcc = store.addAccount({
        id,
        game,
        prime,
        ovr: game === 'fcmobile' ? (fcCat === 'over-1m' ? 'Acc Siêu Ngon (>1M)' : 'Acc Giá Rẻ (<1M)') : (ovr ? `OVR ${ovr}` : 'Sẵn sàng'),
        server: (server === 'vietnam' || server === 'korea') ? 'Bản Việt Nam ( VietNam )' : 'Bản Global',
        accountType,
        rank,
        title,
        price,
        image,
        images: rawImages,
        credentials,
        description
      });

      showPopup({
        title: "✅ ĐÃ THÊM ACC VÀO KHO!",
        message: `Tài khoản #${newAcc.id} đã được thêm vào kho thành công với toàn bộ ảnh tải từ máy tính của bạn.\nHệ thống đang chuyển sang trang chi tiết để bạn xem ngay!`,
        type: "success",
        confirmText: "Xem Ngay"
      });

      this.closeAddAccView(false);
      this.renderWarehouses();
      this.openAccountDetail(newAcc.id);
    });

    // 2. Modal Dashboard
    const dashboardModal = document.getElementById('admin-dashboard-modal');
    const dashboardCloseBtn = document.getElementById('admin-dashboard-close-btn');
    dashboardCloseBtn?.addEventListener('click', () => dashboardModal.classList.remove('active'));

    const tabRev = document.getElementById('tab-admin-revenue');
    const tabDep = document.getElementById('tab-admin-deposits');
    const tabHist = document.getElementById('tab-admin-history');
    const tabInv = document.getElementById('tab-admin-inventory');
    const panelRev = document.getElementById('panel-admin-revenue');
    const panelDep = document.getElementById('panel-admin-deposits');
    const panelHist = document.getElementById('panel-admin-history');
    const panelInv = document.getElementById('panel-admin-inventory');

    const switchAdminTab = (activeTab, activePanel) => {
      [tabRev, tabDep, tabHist, tabInv].forEach(t => t?.classList.remove('active'));
      [panelRev, panelDep, panelHist, panelInv].forEach(p => { if (p) p.style.display = 'none'; });
      activeTab?.classList.add('active');
      if (activePanel) activePanel.style.display = 'block';
    };

    tabRev?.addEventListener('click', () => switchAdminTab(tabRev, panelRev));
    tabDep?.addEventListener('click', () => {
      switchAdminTab(tabDep, panelDep);
      this.renderAdminDeposits();
    });
    tabHist?.addEventListener('click', () => switchAdminTab(tabHist, panelHist));
    tabInv?.addEventListener('click', () => switchAdminTab(tabInv, panelInv));

    document.getElementById('btn-refresh-admin-deposits')?.addEventListener('click', () => {
      this.renderAdminDeposits();
      showToast("Đã làm mới danh sách nạp tiền!", "info");
    });
  }

  // --- 6B. KHO CHỨC NĂNG ADMIN (ADMIN COMMAND CENTER) ---
  switchAdminHubTab(tabName) {
    const tabs = document.querySelectorAll('.admin-hub-tab-btn');
    const panels = document.querySelectorAll('.admin-hub-panel');
    tabs.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.adminTab === tabName);
    });
    panels.forEach(p => {
      p.classList.remove('active');
      p.style.display = 'none';
    });
    const targetPanel = document.getElementById(`admin-hub-panel-${tabName}`);
    if (targetPanel) {
      targetPanel.classList.add('active');
      targetPanel.style.display = 'block';
    }
  }

  renderAdminWarehouseHub() {
    if (!store.user?.isAdmin) return;

    const stats = store.getMonthlyRevenue();
    const availableCount = store.accounts.filter(a => a.status === 'AVAILABLE').length;
    const usersCount = store.registeredUsers ? store.registeredUsers.length : 0;
    const pendingDeposits = store.getPendingDepositsCount();

    // 1. Thống kê Quick Metrics
    const revEl = document.getElementById('admin-hub-metric-revenue');
    const soldEl = document.getElementById('admin-hub-metric-sold');
    const availEl = document.getElementById('admin-hub-metric-available');
    const usersEl = document.getElementById('admin-hub-metric-users');
    const invBadge = document.getElementById('admin-hub-inv-count');
    const depBadge = document.getElementById('admin-hub-dep-count');

    if (revEl) revEl.textContent = stats.totalRevenue.toLocaleString('vi-VN') + ' đ';
    if (soldEl) soldEl.textContent = stats.totalSold + ' acc';
    if (availEl) availEl.textContent = availableCount + ' acc';
    if (usersEl) usersEl.textContent = usersCount + ' người';
    if (invBadge) invBadge.textContent = store.accounts.length;
    if (depBadge) depBadge.textContent = pendingDeposits;

    // 2. Nút Thêm Acc & Làm Mới
    const addBtn = document.getElementById('btn-admin-hub-add-acc');
    const refreshBtn = document.getElementById('btn-admin-hub-refresh');
    if (addBtn && !addBtn.dataset.bound) {
      addBtn.dataset.bound = 'true';
      addBtn.addEventListener('click', () => this.openAddAccView());
    }
    if (refreshBtn && !refreshBtn.dataset.bound) {
      refreshBtn.dataset.bound = 'true';
      refreshBtn.addEventListener('click', () => {
        this.renderAdminWarehouseHub();
        showToast("Đã làm mới dữ liệu Kho Chức Năng Admin!", "info", 1500);
      });
    }

    // 3. Xử lý click chuyển tabs
    document.querySelectorAll('.admin-hub-tab-btn').forEach(btn => {
      if (!btn.dataset.bound) {
        btn.dataset.bound = 'true';
        btn.addEventListener('click', () => {
          this.switchAdminHubTab(btn.dataset.adminTab);
        });
      }
    });

    // 4. Panel 1: Quản Lý Kho Nick & Xóa Nick
    const renderInventoryTable = () => {
      const tbody = document.getElementById('admin-hub-inventory-tbody');
      if (!tbody) return;

      const searchVal = (document.getElementById('admin-hub-inv-search')?.value || '').trim().toLowerCase();
      const gameVal = document.getElementById('admin-hub-inv-filter-game')?.value || 'all';
      const statusVal = document.getElementById('admin-hub-inv-filter-status')?.value || 'all';

      let filtered = [...store.accounts];

      if (gameVal !== 'all') {
        filtered = filtered.filter(a => {
          if (gameVal === 'blindbag') return a.game === 'blindbag' || a.game === 'ff-blindbag';
          return a.game === gameVal;
        });
      }

      if (statusVal !== 'all') {
        filtered = filtered.filter(a => a.status === statusVal);
      }

      if (searchVal) {
        filtered = filtered.filter(a => 
          (a.id || '').toLowerCase().includes(searchVal) ||
          (a.title || '').toLowerCase().includes(searchVal) ||
          (a.game || '').toLowerCase().includes(searchVal) ||
          (a.description || '').toLowerCase().includes(searchVal)
        );
      }

      if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 24px; color: var(--text-muted);">Không tìm thấy tài khoản nào khớp với bộ lọc.</td></tr>`;
        return;
      }

      tbody.innerHTML = filtered.map(acc => {
        const gameTag = acc.game === 'freefire' ? '🔥 Free Fire' : (acc.game === 'lienquan' ? '⚔️ Liên Quân' : (acc.game === 'fcmobile' ? '⚽ FC Mobile' : '🎁 Túi Mù'));
        const statusBadge = acc.status === 'AVAILABLE' 
          ? `<span style="color: #00e676; font-weight: 700; background: rgba(0,230,118,0.15); padding: 3px 8px; border-radius: 4px;">🟢 Đang bán</span>`
          : `<span style="color: #ff334b; font-weight: 700; background: rgba(255,51,75,0.15); padding: 3px 8px; border-radius: 4px;">🔴 Đã bán</span>`;

        return `
          <tr>
            <td><strong style="color: var(--primary-blue); font-family: var(--font-mono);">#${acc.id}</strong></td>
            <td>
              <img src="${acc.image}" style="width: 44px; height: 32px; object-fit: cover; border-radius: 4px; border: 1px solid var(--border-color);" alt="${acc.title}" onerror="this.src='assets/images/placeholder.jpg'">
            </td>
            <td><span style="font-size: 0.78rem; font-weight: 700;">${gameTag}</span></td>
            <td><strong style="font-size: 0.85rem;">${acc.title}</strong></td>
            <td style="font-weight: 800; color: var(--accent-gold); font-family: var(--font-mono);">${acc.price.toLocaleString('vi-VN')} đ</td>
            <td>${statusBadge}</td>
            <td>
              <button class="btn-hub-del-acc" data-del-id="${acc.id}" style="background: rgba(255, 51, 75, 0.15); border: 1px solid var(--accent-red); color: var(--accent-red); border-radius: 4px; padding: 4px 10px; cursor: pointer; font-weight: 700; font-size: 0.75rem; transition: all 0.2s;">Xóa</button>
            </td>
          </tr>
        `;
      }).join('');

      tbody.querySelectorAll('.btn-hub-del-acc').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.delId;
          const ok = await showConfirm(`Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản #${id} khỏi shop tuBIzOne?`, {
            title: "Xác Nhận Xóa Acc",
            type: "danger",
            confirmText: "Xóa Vĩnh Viễn",
            cancelText: "Hủy Bỏ"
          });
          if (ok) {
            store.deleteAccount(id);
            this.renderAdminWarehouseHub();
            this.renderWarehouses();
            this.renderHeaderAuth();
            showToast(`Đã xóa tài khoản #${id} thành công!`, "info");
          }
        });
      });
    };

    renderInventoryTable();

    // Bind filters cho Inventory Table
    const invSearchInput = document.getElementById('admin-hub-inv-search');
    const invGameSelect = document.getElementById('admin-hub-inv-filter-game');
    const invStatusSelect = document.getElementById('admin-hub-inv-filter-status');

    if (invSearchInput && !invSearchInput.dataset.bound) {
      invSearchInput.dataset.bound = 'true';
      invSearchInput.addEventListener('input', renderInventoryTable);
    }
    if (invGameSelect && !invGameSelect.dataset.bound) {
      invGameSelect.dataset.bound = 'true';
      invGameSelect.addEventListener('change', renderInventoryTable);
    }
    if (invStatusSelect && !invStatusSelect.dataset.bound) {
      invStatusSelect.dataset.bound = 'true';
      invStatusSelect.addEventListener('change', renderInventoryTable);
    }

    // 5. Panel 2: Duyệt Nạp Tiền
    const depTbody = document.getElementById('admin-hub-deposits-tbody');
    if (depTbody) {
      const depositsList = [...store.depositHistory].sort((a, b) => {
        if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
        if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
        return new Date(b.date || 0) - new Date(a.date || 0);
      });

      if (depositsList.length === 0) {
        depTbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 24px; color: var(--text-muted);">Chưa có yêu cầu nạp tiền nào từ khách hàng.</td></tr>`;
      } else {
        depTbody.innerHTML = depositsList.map(d => {
          const isPending = d.status === 'PENDING';
          const statusBadge = isPending 
            ? `<span style="color: #ffb800; font-weight: 700; background: rgba(255,184,0,0.15); padding: 3px 8px; border-radius: 4px;">⏳ Chờ duyệt</span>`
            : (d.status === 'SUCCESS'
                ? `<span style="color: #00e676; font-weight: 700; background: rgba(0,230,118,0.15); padding: 3px 8px; border-radius: 4px;">✅ Đã duyệt</span>`
                : `<span style="color: #ff3344; font-weight: 700; background: rgba(255,51,68,0.15); padding: 3px 8px; border-radius: 4px;">❌ Đã từ chối</span>`);

          const methodText = d.type === 'card' 
            ? `🎫 Thẻ cào (${d.telco || 'Thẻ'})` 
            : `🏦 Ngân hàng Vietcombank`;

          const detailText = d.type === 'card'
            ? `Mã: <code style="color: var(--neon-cyan);">${d.code || '-'}</code><br>Seri: ${d.serial || '-'}`
            : `STK: ${d.accountNumber || BANK_CONFIG.accountNumber}`;

          const actionButtons = isPending
            ? `<button class="btn-hub-approve-dep" data-id="${d.id}" style="background: #00e676; color: #000; border: none; font-weight: 700; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 0.75rem; margin-right: 6px;">Duyệt</button>` +
              `<button class="btn-hub-reject-dep" data-id="${d.id}" style="background: rgba(255, 51, 68, 0.15); border: 1px solid #ff3344; color: #ff3344; font-weight: 700; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 0.75rem;">Từ chối</button>`
            : `<span style="color: var(--text-muted); font-size: 0.78rem;">-</span>`;

          return `
            <tr>
              <td><strong style="color: var(--primary-blue); font-family: var(--font-mono);">#${d.id}</strong></td>
              <td><strong>${d.username || 'Khách'}</strong></td>
              <td>${methodText}</td>
              <td style="font-family: var(--font-mono); font-weight: 800; color: var(--accent-gold);">+${(d.amount || 0).toLocaleString('vi-VN')} đ</td>
              <td style="font-size: 0.78rem;">${detailText}</td>
              <td style="font-size: 0.78rem; color: var(--text-muted);">${d.date || '-'}</td>
              <td>${statusBadge}</td>
              <td>${actionButtons}</td>
            </tr>
          `;
        }).join('');

        depTbody.querySelectorAll('.btn-hub-approve-dep').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            const dep = store.depositHistory.find(x => x.id === id);
            if (!dep) return;

            const ok = await showConfirm(
              `Bạn đã kiểm tra tài khoản và xác nhận đã nhận được ${(dep.amount || 0).toLocaleString('vi-VN')} đ từ khách "${dep.username}" chưa?`,
              {
                title: "Xác Nhận Đã Nhận Tiền",
                type: "success",
                confirmText: "Duyệt Nạp & Cộng Tiền",
                cancelText: "Kiểm Tra Lại"
              }
            );

            if (ok) {
              const res = store.adminApproveDeposit(id);
              if (res.success) {
                showToast(res.message, "success");
                this.renderAdminWarehouseHub();
                this.renderHeaderAuth();
              } else {
                showToast(res.message, "danger");
              }
            }
          });
        });

        depTbody.querySelectorAll('.btn-hub-reject-dep').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            const ok = await showConfirm(
              `Bạn có chắc chắn muốn TỪ CHỐI yêu cầu nạp tiền #${id}?`,
              {
                title: "Từ Chối Phiếu Nạp",
                type: "danger",
                confirmText: "Từ Chối Phiếu",
                cancelText: "Hủy Bỏ"
              }
            );

            if (ok) {
              const res = store.adminRejectDeposit(id);
              if (res.success) {
                showToast(res.message, "info");
                this.renderAdminWarehouseHub();
                this.renderHeaderAuth();
              } else {
                showToast(res.message, "danger");
              }
            }
          });
        });
      }
    }

    // 6. Panel 3: Doanh Thu Chi Tiết Theo Từng Game
    const gameRevGrid = document.getElementById('admin-hub-game-revenue-grid');
    if (gameRevGrid) {
      gameRevGrid.innerHTML = `
        <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px;">
          <div style="font-size: 0.85rem; color: #ff6600; font-weight: 700;">🔥 Free Fire</div>
          <div style="font-size: 1.35rem; font-weight: 800; color: var(--text-main); margin: 6px 0;">${stats.gameStats.freefire.revenue.toLocaleString('vi-VN')} đ</div>
          <div style="font-size: 0.78rem; color: var(--text-muted);">Đã bán: <strong style="color: var(--accent-gold);">${stats.gameStats.freefire.count} acc</strong></div>
        </div>
        <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px;">
          <div style="font-size: 0.85rem; color: #0084ff; font-weight: 700;">⚔️ Liên Quân</div>
          <div style="font-size: 1.35rem; font-weight: 800; color: var(--text-main); margin: 6px 0;">${stats.gameStats.lienquan.revenue.toLocaleString('vi-VN')} đ</div>
          <div style="font-size: 0.78rem; color: var(--text-muted);">Đã bán: <strong style="color: var(--accent-gold);">${stats.gameStats.lienquan.count} acc</strong></div>
        </div>
        <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px;">
          <div style="font-size: 0.85rem; color: #10b981; font-weight: 700;">⚽ FC Mobile</div>
          <div style="font-size: 1.35rem; font-weight: 800; color: var(--text-main); margin: 6px 0;">${((stats.gameStats.fcmobile?.revenue || 0) + (stats.gameStats.roblox?.revenue || 0)).toLocaleString('vi-VN')} đ</div>
          <div style="font-size: 0.78rem; color: var(--text-muted);">Đã bán: <strong style="color: var(--accent-gold);">${(stats.gameStats.fcmobile?.count || 0) + (stats.gameStats.roblox?.count || 0)} acc</strong></div>
        </div>
      `;
    }

    // 7. Panel 4: Lịch Sử Giao Dịch Toàn Shop
    const ordersTbody = document.getElementById('admin-hub-orders-tbody');
    if (ordersTbody) {
      if (stats.orders.length === 0) {
        ordersTbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 24px; color: var(--text-muted);">Chưa có đơn hàng nào được mua trên hệ thống.</td></tr>`;
      } else {
        ordersTbody.innerHTML = stats.orders.map(ord => `
          <tr>
            <td><strong style="color: var(--primary-blue); font-family: var(--font-mono);">#${ord.orderId}</strong></td>
            <td><strong>${ord.buyer}</strong></td>
            <td><strong>#${ord.accId}</strong> - ${ord.accTitle}</td>
            <td><span style="font-weight: 700; color: var(--primary-blue);">${ord.game.toUpperCase()}</span></td>
            <td style="font-weight: 800; color: var(--accent-gold); font-family: var(--font-mono);">${ord.price.toLocaleString('vi-VN')} đ</td>
            <td style="font-size: 0.8rem; color: var(--text-muted);">${ord.date}</td>
            <td><span style="color: #00e676; font-weight: 700; background: rgba(0,230,118,0.15); padding: 3px 8px; border-radius: 4px;">Thành Công</span></td>
          </tr>
        `).join('');
      }
    }

    // 8. Panel 5: Danh Sách Thành Viên Đã Đăng Ký
    const usersTbody = document.getElementById('admin-hub-users-tbody');
    if (usersTbody) {
      const usersList = store.registeredUsers || [];
      if (usersList.length === 0) {
        usersTbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 24px; color: var(--text-muted);">Chưa có thành viên nào đăng ký.</td></tr>`;
      } else {
        usersTbody.innerHTML = usersList.map((u, idx) => {
          const isAdmin = u.username.toLowerCase() === 'admin';
          const roleBadge = isAdmin
            ? `<span style="color: #ffb703; font-weight: 800; background: rgba(255,183,3,0.15); padding: 3px 8px; border-radius: 4px; border: 1px solid rgba(255,183,3,0.3);">👑 Quản Trị Viên</span>`
            : `<span style="color: #94a3b8; font-weight: 600; background: rgba(255,255,255,0.05); padding: 3px 8px; border-radius: 4px;">👤 Khách hàng</span>`;

          const createdDate = u.createdAt ? new Date(u.createdAt).toLocaleString('vi-VN') : 'Mặc định';

          return `
            <tr>
              <td style="color: var(--text-muted);">${idx + 1}</td>
              <td><strong style="color: var(--text-main); font-family: var(--font-mono);">${u.username}</strong></td>
              <td>${u.displayName || u.username}</td>
              <td style="font-weight: 800; color: var(--accent-gold); font-family: var(--font-mono);">${(u.balance || 0).toLocaleString('vi-VN')} đ</td>
              <td style="font-size: 0.8rem; color: var(--text-muted);">${createdDate}</td>
              <td>${roleBadge}</td>
            </tr>
          `;
        }).join('');
      }
    }
  }

  openAddAccModal() {
    this.openAddAccView();
  }

  openAdminDashboardModal() {
    const modal = document.getElementById('admin-dashboard-modal');
    if (!modal) return;
    this.renderAdminDashboard();
    modal.classList.add('active');
  }

  renderAdminDashboard() {
    const stats = store.getMonthlyRevenue();
    const availableCount = store.accounts.filter(a => a.status === 'AVAILABLE').length;

    // 1. Thống kê tổng
    document.getElementById('metric-total-revenue').textContent = stats.totalRevenue.toLocaleString('vi-VN') + ' đ';
    document.getElementById('metric-total-sold').textContent = stats.totalSold + ' acc';
    document.getElementById('metric-total-available').textContent = availableCount + ' acc';

    // 2. Doanh thu theo từng game
    const gameRevGrid = document.getElementById('admin-game-revenue-grid');
    if (gameRevGrid) {
      gameRevGrid.innerHTML = `
        <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 14px;">
          <div style="font-size: 0.82rem; color: #ff6600; font-weight: 700;">🔥 Free Fire</div>
          <div style="font-size: 1.25rem; font-weight: 800; color: var(--text-main); margin: 4px 0;">${stats.gameStats.freefire.revenue.toLocaleString('vi-VN')} đ</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">Đã bán: <strong>${stats.gameStats.freefire.count} acc</strong></div>
        </div>
        <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 14px;">
          <div style="font-size: 0.82rem; color: #0084ff; font-weight: 700;">⚔️ Liên Quân</div>
          <div style="font-size: 1.25rem; font-weight: 800; color: var(--text-main); margin: 4px 0;">${stats.gameStats.lienquan.revenue.toLocaleString('vi-VN')} đ</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">Đã bán: <strong>${stats.gameStats.lienquan.count} acc</strong></div>
        </div>
        <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 14px;">
          <div style="font-size: 0.82rem; color: #10b981; font-weight: 700;">⚽ FC Mobile</div>
          <div style="font-size: 1.25rem; font-weight: 800; color: var(--text-main); margin: 4px 0;">${((stats.gameStats.fcmobile?.revenue || 0) + (stats.gameStats.roblox?.revenue || 0)).toLocaleString('vi-VN')} đ</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">Đã bán: <strong>${(stats.gameStats.fcmobile?.count || 0) + (stats.gameStats.roblox?.count || 0)} acc</strong></div>
        </div>
      `;
    }

    // 3. Bảng Lịch sử giao dịch
    const ordersTbody = document.getElementById('admin-orders-table-body');
    if (ordersTbody) {
      if (stats.orders.length === 0) {
        ordersTbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 28px; color: var(--text-muted);">Chưa có đơn hàng nào được mua trên hệ thống.</td></tr>`;
      } else {
        ordersTbody.innerHTML = stats.orders.map(ord => `
          <tr>
            <td><strong>#${ord.orderId}</strong></td>
            <td>${ord.buyer}</td>
            <td><strong>#${ord.accId}</strong> - ${ord.accTitle}</td>
            <td><span style="font-weight: 700; color: var(--primary-blue);">${ord.game.toUpperCase()}</span></td>
            <td style="font-weight: 700; color: var(--accent-gold);">${ord.price.toLocaleString('vi-VN')} đ</td>
            <td>${ord.date}</td>
            <td><span class="badge-order-success">Thành Công</span></td>
          </tr>
        `).join('');
      }
    }

    // 4. Bảng Quản lý kho nick
    const invTbody = document.getElementById('admin-inventory-table-body');
    if (invTbody) {
      if (store.accounts.length === 0) {
        invTbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 28px; color: var(--text-muted);">Hiện chưa có tài khoản nào trong kho. Bấm "Thêm Acc Vào Kho" để đăng bán nick đầu tiên!</td></tr>`;
      } else {
        invTbody.innerHTML = store.accounts.map(acc => `
          <tr>
            <td><strong>#${acc.id}</strong></td>
            <td>${acc.game.toUpperCase()}</td>
            <td>${acc.title}</td>
            <td style="font-weight: 700; color: var(--accent-gold);">${acc.price.toLocaleString('vi-VN')} đ</td>
            <td>
              ${acc.status === 'AVAILABLE' ? '<span style="color: #00e676; font-weight: 700;">🟢 Đang bán</span>' : '<span style="color: var(--accent-red); font-weight: 700;">🔴 Đã bán</span>'}
            </td>
            <td>
              <button class="btn-delete-acc" data-del-id="${acc.id}" style="background: rgba(255, 51, 75, 0.15); border: 1px solid var(--accent-red); color: var(--accent-red); border-radius: 4px; padding: 4px 10px; cursor: pointer; font-weight: 700; font-size: 0.72rem;">Xóa</button>
            </td>
          </tr>
        `).join('');

        invTbody.querySelectorAll('.btn-delete-acc').forEach(btn => {
          btn.addEventListener('click', async () => {
            const id = btn.dataset.delId;
            const ok = await showConfirm(`Bạn có chắc muốn xóa nick #${id} khỏi shop?`, {
              title: "Xác Nhận Xóa Nick",
              type: "danger",
              confirmText: "Xóa Vĩnh Viễn",
              cancelText: "Hủy Bỏ"
            });
            if (ok) {
              store.deleteAccount(id);
              this.renderAdminDashboard();
              this.renderWarehouses();
              showToast(`Đã xóa nick #${id} thành công!`, "info");
            }
          });
        });
      }
    }

    // 5. Cập nhật bảng nạp tiền & huy hiệu
    this.renderAdminDeposits();
  }

  renderAdminDeposits() {
    const tbody = document.getElementById('admin-deposits-table-body');
    const badgeEl = document.getElementById('admin-pending-deposit-count');
    const pendingCount = store.getPendingDepositsCount();
    if (badgeEl) badgeEl.textContent = pendingCount;
    if (!tbody) return;

    const list = [...store.depositHistory].sort((a, b) => {
      if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
      if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
      return new Date(b.date || 0) - new Date(a.date || 0);
    });

    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 28px; color: var(--text-muted);">Chưa có yêu cầu nạp tiền nào từ khách hàng.</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(d => {
      const isPending = d.status === 'PENDING';
      const statusBadge = isPending 
        ? `<span style="color: #ffb800; font-weight: 700; background: rgba(255,184,0,0.15); padding: 3px 8px; border-radius: 4px;">⏳ Chờ duyệt</span>`
        : (d.status === 'SUCCESS'
            ? `<span style="color: #00e676; font-weight: 700; background: rgba(0,230,118,0.15); padding: 3px 8px; border-radius: 4px;">✅ Đã duyệt</span>`
            : `<span style="color: #ff3344; font-weight: 700; background: rgba(255,51,68,0.15); padding: 3px 8px; border-radius: 4px;">❌ Đã từ chối</span>`);

      const methodText = d.type === 'card' 
        ? `🎫 Thẻ cào (${d.telco || 'Thẻ'})` 
        : `🏦 Vietcombank`;

      const detailText = d.type === 'card'
        ? `Mã: <code style="color: var(--neon-cyan);">${d.code || '-'}</code><br>Seri: ${d.serial || '-'}`
        : `STK: ${d.accountNumber || BANK_CONFIG.accountNumber}`;

      const actionButtons = isPending
        ? `<button class="btn-action-approve-dep" data-id="${d.id}" style="background: #00e676; color: #000; border: none; font-weight: 700; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 0.75rem; margin-right: 6px;">Duyệt</button>` +
          `<button class="btn-action-reject-dep" data-id="${d.id}" style="background: rgba(255, 51, 68, 0.15); border: 1px solid #ff3344; color: #ff3344; font-weight: 700; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 0.75rem;">Từ chối</button>`
        : `<span style="color: var(--text-muted); font-size: 0.78rem;">-</span>`;

      return `
        <tr>
          <td><strong style="color: var(--primary-blue); font-family: var(--font-mono);">#${d.id}</strong></td>
          <td><strong>${d.username || 'Khách'}</strong></td>
          <td>${methodText}</td>
          <td style="font-family: var(--font-mono); font-weight: 800; color: var(--accent-gold);">+${(d.amount || 0).toLocaleString('vi-VN')} đ</td>
          <td style="font-size: 0.78rem;">${detailText}</td>
          <td style="font-size: 0.78rem; color: var(--text-muted);">${d.date || '-'}</td>
          <td>${statusBadge}</td>
          <td>${actionButtons}</td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('.btn-action-approve-dep').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const dep = store.depositHistory.find(x => x.id === id);
        if (!dep) return;

        const ok = await showConfirm(
          `Bạn đã kiểm tra App Vietcombank và xác nhận đã nhận được ${(dep.amount || 0).toLocaleString('vi-VN')} đ từ khách "${dep.username}" chưa?`,
          {
            title: "Xác Nhận Đã Nhận Tiền",
            type: "success",
            confirmText: "Duyệt Nạp & Cộng Tiền",
            cancelText: "Kiểm Tra Lại"
          }
        );

        if (ok) {
          const res = store.adminApproveDeposit(id);
          if (res.success) {
            showToast(res.message, "success");
            this.renderAdminDashboard();
            this.renderHeaderAuth();
          } else {
            showToast(res.message, "warning");
          }
        }
      });
    });

    tbody.querySelectorAll('.btn-action-reject-dep').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const dep = store.depositHistory.find(x => x.id === id);
        if (!dep) return;

        const ok = await showConfirm(
          `Từ chối yêu cầu nạp tiền #${id} của khách "${dep.username}"?`,
          {
            title: "Từ Chối Phiếu Nạp",
            type: "danger",
            confirmText: "Từ Chối",
            cancelText: "Hủy Bỏ"
          }
        );

        if (ok) {
          const res = store.adminRejectDeposit(id);
          if (res.success) {
            showToast(res.message, "info");
            this.renderAdminDashboard();
          }
        }
      });
    });
  }

  // --- 8. MODAL NẠP TIỀN ---
  attachDepositModalEvents() {
    const modal = document.getElementById('deposit-modal');
    const openBtn = document.getElementById('btn-open-deposit-modal');
    const closeBtn = document.getElementById('deposit-modal-close-btn');

    openBtn?.addEventListener('click', () => this.openDepositModal());
    closeBtn?.addEventListener('click', () => modal.classList.remove('active'));

    const tabCard = document.getElementById('tab-deposit-card');
    const tabBank = document.getElementById('tab-deposit-bank');
    const panelCard = document.getElementById('panel-deposit-card');
    const panelBank = document.getElementById('panel-deposit-bank');

    tabCard?.addEventListener('click', () => {
      tabCard.classList.add('active');
      tabBank.classList.remove('active');
      panelCard.style.display = 'block';
      panelBank.style.display = 'none';
    });

    tabBank?.addEventListener('click', () => {
      tabBank.classList.add('active');
      tabCard.classList.remove('active');
      panelBank.style.display = 'block';
      panelCard.style.display = 'none';
      this.updateBankQR();
    });

    document.querySelectorAll('.provider-item-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.provider-item-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.selectedTelco = btn.dataset.telco;
      });
    });

    document.getElementById('form-deposit-card')?.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!store.user.isLoggedIn) {
        modal.classList.remove('active');
        this.openAuthModal('login', true);
        return;
      }

      if (store.user.isAdmin) {
        showToast("Tài khoản Quản trị viên không cần nạp tiền vào ví!", "warning");
        return;
      }

      const amount = Number(document.getElementById('card-amount-select').value);
      const serial = document.getElementById('card-serial-input').value.trim();
      const code = document.getElementById('card-pin-input').value.trim();

      if (!serial || !code) {
        showToast("Vui lòng nhập đầy đủ số Seri và mã thẻ cào!", "warning");
        return;
      }

      const dep = store.requestCardDeposit({
        telco: this.selectedTelco,
        amount: amount,
        serial: serial,
        code: code
      });

      showPopup({
        title: "🎫 ĐÃ GỬI THẺ CÀO CHỜ DUYỆT!",
        message: `Mã phiếu nạp: #${dep.id}\nNhà mạng: ${this.selectedTelco}\nMệnh giá: ${amount.toLocaleString('vi-VN')} đ\nSeri: ${serial}\n\nHệ thống đã tiếp nhận thẻ cào của bạn. Admin sẽ kiểm tra và cộng tiền vào ví trong 1 - 3 phút.\n\nNếu cần gấp, bạn có thể nhắn Zalo ${BANK_CONFIG.hotline} kèm mã phiếu nạp để được duyệt tức thì!`,
        type: "success",
        confirmText: "Kiểm Tra Trạng Thái"
      });
      modal.classList.remove('active');
      e.target.reset();
    });

    document.getElementById('bank-deposit-amount')?.addEventListener('input', () => {
      this.updateBankQR();
    });

    document.querySelectorAll('.btn-mini-copy').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.dataset.copyVal || document.getElementById('bank-memo-syntax')?.textContent;
        if (val) {
          navigator.clipboard.writeText(val);
          const oldText = btn.textContent;
          btn.textContent = 'Đã chép!';
          showToast("Đã chép thông tin vào bộ nhớ tạm!", "info", 2000);
          setTimeout(() => btn.textContent = oldText, 1500);
        }
      });
    });

    document.getElementById('btn-confirm-bank-transferred')?.addEventListener('click', () => {
      if (!store.user.isLoggedIn) {
        modal.classList.remove('active');
        this.openAuthModal('login', true);
        return;
      }

      if (store.user.isAdmin) {
        showToast("Tài khoản Quản trị viên không cần nạp tiền vào ví!", "warning");
        return;
      }

      const amt = Number(document.getElementById('bank-deposit-amount')?.value) || 50000;
      if (amt < 10000) {
        showToast("Số tiền nạp tối thiểu là 10.000 VNĐ!", "warning");
        return;
      }

      const dep = store.requestBankDeposit(amt);
      modal.classList.remove('active');

      showPopup({
        title: "✅ ĐÃ TIẾP NHẬN YÊU CẦU NẠP TIỀN!",
        message: `Mã phiếu nạp: #${dep.id}\nSố tiền: ${amt.toLocaleString('vi-VN')} đ\nNgân hàng: ${BANK_CONFIG.bankName}\nChủ TK: ${BANK_CONFIG.accountHolderDisplay}\nSố TK: ${BANK_CONFIG.accountNumber}\n\nSau khi bạn hoàn tất chuyển khoản trên App ngân hàng, Admin sẽ kiểm tra và duyệt cộng tiền vào ví của bạn trong 1 - 3 phút!\n\nNếu muốn duyệt ngay trong 30 giây, bạn hãy nhắn tin Zalo cho Admin nhé!`,
        type: "success",
        confirmText: "Xem Lịch Sử Nạp"
      });
    });
  }

  openDepositModal() {
    const modal = document.getElementById('deposit-modal');
    if (modal) {
      modal.classList.add('active');
      this.updateBankQR();
    }
  }

  updateBankQR() {
    const bankNameEl = document.getElementById('bank-display-name');
    if (bankNameEl) {
      bankNameEl.textContent = BANK_CONFIG.bankName;
    }

    const holderEl = document.getElementById('bank-acc-holder');
    if (holderEl) {
      holderEl.textContent = BANK_CONFIG.accountHolderDisplay;
    }

    const amount = Math.max(10000, Number(document.getElementById('bank-deposit-amount')?.value) || 50000);
    const uname = store.user.isLoggedIn ? store.user.username : 'KHACH';
    const memo = `NAP tuBIzOne ${uname.toUpperCase()}`;
    const accountNo = BANK_CONFIG.accountNumber;

    const qrImg = document.getElementById('bank-qr-code-img');
    if (qrImg) {
      const accountName = encodeURIComponent(BANK_CONFIG.accountHolder);
      const addInfo = encodeURIComponent(memo);
      qrImg.src = `https://img.vietqr.io/image/${BANK_CONFIG.bankId}-${accountNo}-qr_only.png?amount=${amount}&addInfo=${addInfo}&accountName=${accountName}`;
    }

    const memoEl = document.getElementById('bank-memo-syntax');
    if (memoEl) memoEl.textContent = memo;

    const accNumEl = document.getElementById('bank-acc-num');
    if (accNumEl) accNumEl.textContent = accountNo;

    const copyAccBtn = document.querySelector('#panel-deposit-bank .btn-mini-copy[data-copy-val]');
    if (copyAccBtn) copyAccBtn.setAttribute('data-copy-val', accountNo);
  }

  // --- 9. MODAL ĐĂNG NHẬP / ĐĂNG KÝ ---
  attachAuthModalEvents() {
    const modal = document.getElementById('auth-modal');
    const closeBtn = document.getElementById('auth-modal-close-btn');
    closeBtn?.addEventListener('click', () => modal.classList.remove('active'));

    const tabLogin = document.getElementById('tab-auth-login');
    const tabRegister = document.getElementById('tab-auth-register');
    const repassGroup = document.getElementById('auth-repass-group');
    const repassInput = document.getElementById('auth-repassword-field');
    const actionBtn = document.getElementById('btn-auth-action-submit');
    const modalTitle = document.getElementById('auth-modal-title');
    const userInput = document.getElementById('auth-username-field');
    const pwdMain = document.getElementById('auth-password-field');
    const pwdRepass = document.getElementById('auth-repassword-field');
    const lockoutBanner = document.getElementById('auth-lockout-banner');
    const lockoutTimerEl = document.getElementById('auth-lockout-timer');
    const strengthContainer = document.getElementById('pwd-strength-container');
    const strengthBar = document.getElementById('pwd-strength-bar');
    const strengthText = document.getElementById('pwd-strength-text');
    const checkLength = document.getElementById('pwd-check-length');
    const checkUpper = document.getElementById('pwd-check-upper');
    const checkLower = document.getElementById('pwd-check-lower');
    const checkNumber = document.getElementById('pwd-check-number');
    const checkSpecial = document.getElementById('pwd-check-special');

    // Hàm đếm ngược thời gian khóa do Brute-force
    const startLockoutCountdown = (remainingSec) => {
      if (this.lockoutInterval) clearInterval(this.lockoutInterval);
      if (!lockoutBanner || !lockoutTimerEl) return;

      lockoutBanner.style.display = 'flex';
      lockoutTimerEl.textContent = remainingSec;
      if (actionBtn) {
        actionBtn.disabled = true;
        actionBtn.style.opacity = '0.5';
        actionBtn.style.cursor = 'not-allowed';
      }

      let currentSec = remainingSec;
      this.lockoutInterval = setInterval(() => {
        currentSec -= 1;
        if (currentSec <= 0) {
          clearInterval(this.lockoutInterval);
          this.lockoutInterval = null;
          lockoutBanner.style.display = 'none';
          if (actionBtn) {
            actionBtn.disabled = false;
            actionBtn.style.opacity = '1';
            actionBtn.style.cursor = 'pointer';
          }
        } else {
          lockoutTimerEl.textContent = currentSec;
        }
      }, 1000);
    };

    const stopLockoutCountdown = () => {
      if (this.lockoutInterval) {
        clearInterval(this.lockoutInterval);
        this.lockoutInterval = null;
      }
      if (lockoutBanner) lockoutBanner.style.display = 'none';
      if (actionBtn) {
        actionBtn.disabled = false;
        actionBtn.style.opacity = '1';
        actionBtn.style.cursor = 'pointer';
      }
    };

    // Hàm kiểm tra và cập nhật giao diện đo độ mạnh mật khẩu theo thời gian thực
    const updatePasswordStrengthUI = (val) => {
      const isRegister = tabRegister?.classList.contains('active');
      if (!isRegister) {
        if (strengthContainer) strengthContainer.style.display = 'none';
        return;
      }
      if (strengthContainer) strengthContainer.style.display = 'block';

      const result = SecurityService.validatePasswordPolicy(val);

      if (strengthBar) {
        strengthBar.style.width = `${result.score}%`;
        strengthBar.className = `pwd-strength-bar ${result.strengthLevel}`;
      }
      if (strengthText) {
        strengthText.textContent = val ? result.strengthLabel : 'Chưa nhập';
        strengthText.className = result.strengthLevel;
      }

      const updateCheckItem = (el, passed) => {
        if (!el) return;
        const icon = el.querySelector('.check-icon');
        if (passed) {
          el.classList.add('passed');
          if (icon) icon.textContent = '✓';
        } else {
          el.classList.remove('passed');
          if (icon) icon.textContent = '✕';
        }
      };

      updateCheckItem(checkLength, result.checklist.length);
      updateCheckItem(checkUpper, result.checklist.hasUpper);
      updateCheckItem(checkLower, result.checklist.hasLower);
      updateCheckItem(checkNumber, result.checklist.hasNumber);
      updateCheckItem(checkSpecial, result.checklist.hasSpecial);
    };

    pwdMain?.addEventListener('input', (e) => {
      updatePasswordStrengthUI(e.target.value);
    });

    userInput?.addEventListener('input', (e) => {
      const isRegister = tabRegister?.classList.contains('active');
      if (!isRegister) {
        const check = SecurityService.checkRateLimit(e.target.value);
        if (check.isLocked) {
          startLockoutCountdown(check.remainingSeconds);
        } else {
          stopLockoutCountdown();
        }
      }
    });

    tabLogin?.addEventListener('click', () => {
      tabLogin.classList.add('active');
      tabRegister?.classList.remove('active');
      if (repassGroup) repassGroup.style.display = 'none';
      if (repassInput) repassInput.removeAttribute('required');
      if (strengthContainer) strengthContainer.style.display = 'none';
      if (actionBtn) actionBtn.textContent = 'Đăng nhập';
      if (modalTitle) modalTitle.textContent = 'Đăng nhập';

      // Kiểm tra trạng thái brute force của username đang nhập
      const userVal = userInput?.value || '';
      const check = SecurityService.checkRateLimit(userVal);
      if (check.isLocked) {
        startLockoutCountdown(check.remainingSeconds);
      } else {
        stopLockoutCountdown();
      }
    });

    tabRegister?.addEventListener('click', () => {
      tabRegister.classList.add('active');
      tabLogin?.classList.remove('active');
      if (repassGroup) repassGroup.style.display = 'block';
      if (repassInput) repassInput.setAttribute('required', 'required');
      if (actionBtn) actionBtn.textContent = 'Đăng ký';
      if (modalTitle) modalTitle.textContent = 'Đăng ký';
      stopLockoutCountdown();
      updatePasswordStrengthUI(pwdMain?.value || '');
    });

    // Nút Hiện / Ẩn Mật Khẩu (Chính)
    const toggleMain = document.getElementById('btn-toggle-pwd-main');
    toggleMain?.addEventListener('click', () => {
      if (!pwdMain) return;
      const isPwd = pwdMain.type === 'password';
      pwdMain.type = isPwd ? 'text' : 'password';
      toggleMain.textContent = isPwd ? 'Ẩn' : 'Hiện';
    });

    // Nút Hiện / Ẩn Mật Khẩu (Xác nhận)
    const toggleRepass = document.getElementById('btn-toggle-pwd-repass');
    toggleRepass?.addEventListener('click', () => {
      if (!pwdRepass) return;
      const isPwd = pwdRepass.type === 'password';
      pwdRepass.type = isPwd ? 'text' : 'password';
      toggleRepass.textContent = isPwd ? 'Ẩn' : 'Hiện';
    });

    // Xử lý gửi Form Đăng nhập / Đăng ký (Bất đồng bộ với Bcrypt)
    document.getElementById('auth-submit-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = (userInput?.value || '').trim();
      const password = (pwdMain?.value || '').trim();
      const isRegister = tabRegister?.classList.contains('active');

      if (!username || !password) {
        showToast("Vui lòng điền đầy đủ thông tin!", "warning");
        return;
      }

      // Trạng thái đang tải (Loading) để tính toán Bcrypt mượt mà
      const originalBtnText = actionBtn ? actionBtn.textContent : '';
      if (actionBtn) {
        actionBtn.disabled = true;
        actionBtn.textContent = 'Đang xử lý... 🔒';
      }

      try {
        if (isRegister) {
          const repass = (pwdRepass?.value || '').trim();
          if (password !== repass) {
            showToast("Mật khẩu xác nhận không trùng khớp! Vui lòng nhập lại.", "danger");
            if (actionBtn) {
              actionBtn.disabled = false;
              actionBtn.textContent = originalBtnText;
            }
            return;
          }

          const res = await store.register(username, password);
          if (!res.success) {
            showToast(res.message, "danger");
            if (actionBtn) {
              actionBtn.disabled = false;
              actionBtn.textContent = originalBtnText;
            }
            return;
          }

          showPopup({
            title: "🎉 TẠO TÀI KHOẢN THÀNH CÔNG!",
            message: `${res.message}\nBạn đã được tự động đăng nhập vào tuBIzOne.com.`,
            type: "success",
            confirmText: "Bắt Đầu Ngay"
          });
        } else {
          const res = await store.login(username, password);
          if (!res.success) {
            if (res.isLocked && res.remainingSeconds) {
              startLockoutCountdown(res.remainingSeconds);
            }
            showToast(res.message, "danger");
            if (actionBtn) {
              actionBtn.disabled = false;
              actionBtn.textContent = originalBtnText;
            }
            return;
          }

          stopLockoutCountdown();
          if (res.isAdmin) {
            showPopup({
              title: "👑 QUẢN TRỊ VIÊN tuBIzOne",
              message: "Chào mừng Quản trị viên Huỳnh Tuấn!\nBạn có toàn quyền quản trị: Thêm acc vào kho, xem doanh thu tháng và kiểm tra toàn bộ lịch sử giao dịch.",
              type: "success",
              confirmText: "Vào Quản Trị"
            });
          } else {
            showToast(`Xin chào ${store.user.displayName}! Bạn đã đăng nhập thành công.`, "success");
          }
        }

        modal?.classList.remove('active');
        e.target.reset();
        stopLockoutCountdown();
        updatePasswordStrengthUI('');
        this.renderHeaderAuth();
        this.renderWarehouses();
      } catch (err) {
        console.error('[Auth Form Error]:', err);
        showToast("Đã có lỗi xảy ra trong quá trình xác thực. Vui lòng thử lại!", "danger");
      } finally {
        if (actionBtn && !actionBtn.disabled) {
          actionBtn.textContent = originalBtnText;
        }
      }
    });
  }

  openAuthModal(mode = 'login', isRequiredForBuy = false) {
    const modal = document.getElementById('auth-modal');
    const warning = document.getElementById('auth-login-required-msg');
    if (!modal) return;

    if (warning) {
      warning.style.display = isRequiredForBuy ? 'flex' : 'none';
    }

    const tabLogin = document.getElementById('tab-auth-login');
    const tabRegister = document.getElementById('tab-auth-register');
    if (mode === 'login') {
      tabLogin?.click();
    } else {
      tabRegister?.click();
    }

    modal.classList.add('active');
  }

  // --- 10. MODAL LỊCH SỬ GIAO DỊCH NGƯỜI DÙNG ---
  attachUserHistoryModalEvents() {
    const modal = document.getElementById('user-history-modal');
    const closeBtn = document.getElementById('user-history-close-btn');
    closeBtn?.addEventListener('click', () => modal?.classList.remove('active'));

    const tabOrders = document.getElementById('tab-user-history-orders');
    const tabDeposits = document.getElementById('tab-user-history-deposits');
    const panelOrders = document.getElementById('panel-user-history-orders');
    const panelDeposits = document.getElementById('panel-user-history-deposits');

    tabOrders?.addEventListener('click', () => {
      tabOrders.classList.add('active');
      tabDeposits?.classList.remove('active');
      if (panelOrders) panelOrders.style.display = 'block';
      if (panelDeposits) panelDeposits.style.display = 'none';
    });

    tabDeposits?.addEventListener('click', () => {
      tabDeposits.classList.add('active');
      tabOrders?.classList.remove('active');
      if (panelDeposits) panelDeposits.style.display = 'block';
      if (panelOrders) panelOrders.style.display = 'none';
    });
  }

  openUserHistoryModal() {
    if (!store.user.isLoggedIn) {
      this.openAuthModal('login');
      return;
    }
    const modal = document.getElementById('user-history-modal');
    if (modal) {
      modal.classList.add('active');
      this.renderUserHistory();
    }
  }

  renderUserHistory() {
    // 1. Render Orders (Nick Đã Mua & Thông Tin Bàn Giao)
    const ordersContainer = document.getElementById('user-orders-list-container');
    if (ordersContainer) {
      const orders = store.getUserOrders();
      if (!orders || orders.length === 0) {
        ordersContainer.innerHTML = `
          <div class="user-empty-history">
            <div class="user-empty-icon">📦</div>
            <div style="font-weight: 700; font-size: 1.1rem; color: var(--text-main); margin-bottom: 6px;">
              Bạn chưa mua tài khoản nào trên tuBIzOne.com
            </div>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px;">
              Khi bạn mua acc, toàn bộ thông tin đăng nhập và mật khẩu nick sẽ được lưu trữ vĩnh viễn tại đây để bạn xem lại bất cứ lúc nào!
            </p>
            <button class="btn-topup-main" id="btn-empty-go-shop" style="margin: 0 auto;">
              🛍️ Khám Phá Kho Nick Ngay
            </button>
          </div>
        `;

        document.getElementById('btn-empty-go-shop')?.addEventListener('click', () => {
          document.getElementById('user-history-modal')?.classList.remove('active');
          window.location.hash = '#kho-freefire';
        });

      } else {
        ordersContainer.innerHTML = orders.map(ord => `
          <div class="user-order-card">
            <div class="user-order-header">
              <div>
                <span class="user-order-id">#${ord.orderId}</span>
                <span style="color: var(--border-color); margin: 0 8px;">•</span>
                <span class="user-order-date">${ord.date}</span>
              </div>
              <span style="font-size: 0.75rem; padding: 3px 10px; border-radius: 4px; background: rgba(0, 230, 118, 0.15); color: #00e676; font-weight: 700;">
                ✅ ĐÃ THANH TOÁN
              </span>
            </div>
            <div class="user-order-body">
              <div class="user-order-title">${ord.accTitle}</div>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 6px;">
                <div>
                  <span class="user-order-game-tag">${ord.game === 'freefire' ? 'Free Fire' : (ord.game === 'lienquan' ? 'Liên Quân' : 'FC Mobile')}</span>
                  <span style="font-size: 0.8rem; color: var(--text-muted);">Mã nick: <strong>#${ord.accId}</strong></span>
                </div>
                <div class="user-order-price">${ord.price.toLocaleString('vi-VN')} đ</div>
              </div>
            </div>
            <div class="user-credentials-box">
              <div class="user-credentials-content">
                <strong style="color: var(--text-main); font-family: var(--font-display);">🔑 THÔNG TIN NICK BÀN GIAO:</strong><br>
                <span>${ord.credentials}</span>
              </div>
              <button class="btn-copy-creds" data-creds="${encodeURIComponent(ord.credentials)}">
                📋 Sao Chép
              </button>
            </div>
          </div>
        `).join('');

        ordersContainer.querySelectorAll('.btn-copy-creds').forEach(btn => {
          btn.addEventListener('click', () => {
            const raw = decodeURIComponent(btn.dataset.creds);
            navigator.clipboard.writeText(raw);
            const oldText = btn.textContent;
            btn.textContent = 'Đã chép! ✓';
            setTimeout(() => btn.textContent = oldText, 2000);
          });
        });
      }
    }

    // 2. Render Deposits (Lịch Sử Nạp Tiền Ví)
    const depositsContainer = document.getElementById('user-deposits-list-container');
    if (depositsContainer) {
      const deposits = store.getUserDeposits();
      if (!deposits || deposits.length === 0) {
        depositsContainer.innerHTML = `
          <div class="user-empty-history">
            <div class="user-empty-icon">💳</div>
            <div style="font-weight: 700; font-size: 1.1rem; color: var(--text-main); margin-bottom: 6px;">
              Chưa có giao dịch nạp tiền nào
            </div>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px;">
              Nạp tiền ngay qua Thẻ cào Viettel, Vina, Mobi hoặc Chuyển khoản ngân hàng ATM nhận tiền tự động 24/7.
            </p>
            <button class="btn-topup-main" id="btn-empty-go-deposit" style="margin: 0 auto;">
              💳 Nạp Tiền Vào Ví Ngay
            </button>
          </div>
        `;

        document.getElementById('btn-empty-go-deposit')?.addEventListener('click', () => {
          document.getElementById('user-history-modal')?.classList.remove('active');
          document.getElementById('btn-open-deposit-modal')?.click();
        });

      } else {
        depositsContainer.innerHTML = `
          <div class="admin-table-container">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Mã GD</th>
                  <th>Hình Thức Nạp</th>
                  <th>Số Tiền</th>
                  <th>Thời Gian</th>
                  <th>Trạng Thái</th>
                </tr>
              </thead>
              <tbody>
                ${deposits.map(d => {
                  const statusBadge = d.status === 'PENDING'
                    ? `<span style="color: #ffb800; font-weight: 700; background: rgba(255,184,0,0.15); padding: 3px 8px; border-radius: 4px;">⏳ Đang chờ duyệt</span>`
                    : (d.status === 'SUCCESS'
                        ? `<span style="color: #00e676; font-weight: 700; background: rgba(0,230,118,0.15); padding: 3px 8px; border-radius: 4px;">✅ Thành công</span>`
                        : `<span style="color: #ff3344; font-weight: 700; background: rgba(255,51,68,0.15); padding: 3px 8px; border-radius: 4px;">❌ Bị từ chối</span>`);

                  const bankText = d.type === 'card'
                    ? `Thẻ cào (${d.telco || 'Thẻ'})`
                    : `Vietcombank (${BANK_CONFIG.accountNumber})`;

                  return `
                    <tr>
                      <td style="font-family: var(--font-mono); font-weight: 700; color: var(--primary-blue);">#${d.id}</td>
                      <td><strong>${bankText}</strong></td>
                      <td style="font-family: var(--font-mono); font-weight: 800; color: var(--accent-gold);">+${(d.amount || 0).toLocaleString('vi-VN')} đ</td>
                      <td style="font-size: 0.8rem; color: var(--text-muted);">${d.date || '-'}</td>
                      <td>${statusBadge}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `;
      }
    }
  }
}

// Khởi tạo ứng dụng an toàn trên mọi trình duyệt (Google Chrome, Cốc Cốc, Edge, Firefox)
function startApp() {
  if (window.__tuBIzOneAppInitialized) return;
  window.__tuBIzOneAppInitialized = true;
  const app = new TuBIzOneApp();
  app.init();
  window.tuBIzOneApp = app;
  window.tuanzoneApp = app;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}

// =========================================================
// tuBIzOne.com - State Store (With Supabase Cloud Sync)
// =========================================================

import {
  dbGetAccounts,
  dbInsertAccount,
  dbDeleteAccount,
  dbUpdateAccountStatus,
  dbGetOrders,
  dbInsertOrder,
  dbClearAllOrders,
  dbGetDeposits,
  dbInsertDeposit,
  dbUpdateDepositStatus,
  dbClearAllDeposits,
  dbGetUsers,
  dbUpsertUser,
  dbUpdateUserBalance,
  dbDeleteUser
} from './supabaseClient.js';
import { SecurityService } from './security.js';

export const BANK_CONFIG = {
  bankId: "VCB",
  bankName: "Vietcombank (Ngoại Thương Việt Nam)",
  accountNumber: "0281000095697",
  accountHolder: "HUYNH VAN UT",
  accountHolderDisplay: "HUỲNH VĂN ÚT",
  adminName: "Huỳnh Tuấn",
  hotline: "0907960586",
  zaloLink: "https://zalo.me/0907960586",
  facebookLink: "https://www.facebook.com/huynh.tuan.84918"
};

export const ADMIN_CONFIG = {
  username: "admin_tuBIzOne",
  altUsername: "admin",
  legacyUsername: "admin_tuanzone",
  password: "TZ@2026#HuynhTuan!SecureX9vK8"
};

class AppStore {
  constructor() {
    this.listeners = [];
    this.init();
  }

  init() {
    // 1. Theme State (Light by default)
    const savedTheme = localStorage.getItem('tz_theme') || localStorage.getItem('tubizone_theme') || localStorage.getItem('tuanzone_theme') || 'light';
    this.theme = savedTheme;
    document.body.setAttribute('data-theme', this.theme);

    // 2. User Authentication State
    const savedUser = localStorage.getItem('tubizone_user_auth') || localStorage.getItem('tuanzone_user_auth');
    this.user = savedUser ? JSON.parse(savedUser) : {
      isLoggedIn: false,
      isAdmin: false,
      username: "Khách",
      displayName: "Khách",
      balance: 0
    };
    if (this.user.isAdmin) {
      this.user.balance = 0;
    }

    // 3. Kho tài khoản thực tế do Admin thêm vào (mặc định rỗng)
    const savedAccounts = localStorage.getItem('tubizone_warehouse_accounts') || localStorage.getItem('tuanzone_warehouse_accounts');
    this.accounts = savedAccounts ? JSON.parse(savedAccounts) : [];

    // 3B. Dọn dẹp triệt để các nick mẫu túi mù ảo tự sinh trước đây (TM-FF-01 -> TM-FF-04)
    const sampleIds = ['TM-FF-01', 'TM-FF-02', 'TM-FF-03', 'TM-FF-04'];
    const hasSampleIds = this.accounts.some(a => sampleIds.includes(String(a.id)));
    if (hasSampleIds || localStorage.getItem('tubizone_sample_bags_purged_v2') !== 'true') {
      this.accounts = this.accounts.filter(a => !sampleIds.includes(String(a.id)));
      try {
        localStorage.setItem('tubizone_warehouse_accounts', JSON.stringify(this.accounts));
        localStorage.setItem('tubizone_sample_bags_purged_v2', 'true');
        let deletedIds = JSON.parse(localStorage.getItem('tubizone_deleted_acc_ids') || '[]');
        sampleIds.forEach(id => {
          if (!deletedIds.includes(id)) deletedIds.push(id);
          dbDeleteAccount(id).catch(() => {});
        });
        localStorage.setItem('tubizone_deleted_acc_ids', JSON.stringify(deletedIds));
      } catch (e) {
        console.warn('[Store] Cleanup sample bags warning:', e);
      }
    }

    // 4. Lịch sử đơn hàng mua nick & Doanh thu
    if (localStorage.getItem('tubizone_orders_reset_v2') !== 'true') {
      this.orders = [];
      localStorage.setItem('tubizone_orders', '[]');
      localStorage.setItem('tubizone_orders_reset_v2', 'true');
      dbClearAllOrders().catch(() => {});
    } else {
      const savedOrders = localStorage.getItem('tubizone_orders') || localStorage.getItem('tuanzone_orders');
      this.orders = savedOrders ? JSON.parse(savedOrders) : [];
    }

    // 5. Search & Filter State
    this.searchQuery = '';

    this.filters = {
      freefire: {
        prime: 'all',
        priceRange: 'all',
        sortBy: 'default',
        search: ''
      },
      lienquan: {
        priceRange: 'all',
        sortBy: 'default',
        search: ''
      },
      fcmobile: {
        category: 'all',
        server: 'all',
        sortBy: 'default',
        search: ''
      },
      blindbag: {
        priceRange: 'all',
        sortBy: 'default',
        search: ''
      },
      roblox: {
        subCategory: 'all',
        priceRange: 'all',
        sortBy: 'default',
        search: ''
      }
    };

    // 6. Lịch sử nạp tiền
    this.depositHistory = JSON.parse(localStorage.getItem('tubizone_deposit_history') || localStorage.getItem('tuanzone_deposit_history') || '[]');

    // 7. Danh sách tài khoản người dùng đã đăng ký
    const savedUsers = localStorage.getItem('tubizone_registered_users') || localStorage.getItem('tuanzone_registered_users');
    this.registeredUsers = savedUsers ? JSON.parse(savedUsers) : [];

    // Tự động đồng bộ với Supabase Cloud
    this.syncFromCloud();
  }

  async syncFromCloud() {
    try {
      // 1. Đồng bộ kho accounts từ Supabase Cloud
      const cloudAccounts = await dbGetAccounts();
      if (cloudAccounts !== null && Array.isArray(cloudAccounts)) {
        // Lấy danh sách ID đã bị xóa gần đây (để tránh phục hồi acc vừa xóa)
        const deletedIds = JSON.parse(localStorage.getItem('tubizone_deleted_acc_ids') || '[]');
        const sampleIds = ['TM-FF-01', 'TM-FF-02', 'TM-FF-03', 'TM-FF-04'];

        // Tự động dọn dẹp các acc mẫu ảo nếu chúng tồn tại trên Cloud
        cloudAccounts.forEach(a => {
          if (sampleIds.includes(String(a.id))) {
            dbDeleteAccount(String(a.id)).catch(() => {});
          }
        });

        // Tạo Map các tài khoản hiện có ở local và cloud
        const localMap = new Map((this.accounts || []).map(a => [String(a.id), a]));
        const cloudMap = new Map(cloudAccounts.map(a => [String(a.id), a]));

        // Danh sách hợp nhất: Bắt đầu từ cloud (lọc bỏ các ID đã xóa và nick mẫu ảo)
        const mergedList = cloudAccounts.filter(a => !deletedIds.includes(String(a.id)) && !sampleIds.includes(String(a.id)));

        // Những tài khoản có ở Local nhưng chưa có trên Cloud (Admin vừa tạo hoặc mạng lag trước đó):
        // Tuyệt đối giữ lại và tự động đẩy lên Supabase Cloud để vĩnh viễn không bao giờ mất!
        for (const [id, localAcc] of localMap.entries()) {
          if (!cloudMap.has(id) && !deletedIds.includes(id) && !sampleIds.includes(id)) {
            mergedList.unshift(localAcc);
            // Tự động đẩy lên Supabase Cloud
            dbInsertAccount(localAcc).catch(e => console.warn('[Supabase Auto Sync] dbInsertAccount error:', e));
          }
        }

        this.accounts = mergedList;
        this.save();
      }

      // 2. Đồng bộ danh sách đơn hàng
      const cloudOrders = await dbGetOrders();
      if (cloudOrders !== null && Array.isArray(cloudOrders)) {
        this.orders = cloudOrders;
        localStorage.setItem('tubizone_orders', JSON.stringify(this.orders));
      }

      // 3. Đồng bộ lịch sử nạp tiền
      const cloudDeposits = await dbGetDeposits();
      if (cloudDeposits !== null && Array.isArray(cloudDeposits)) {
        this.depositHistory = cloudDeposits;
        localStorage.setItem('tubizone_deposit_history', JSON.stringify(this.depositHistory));
      }

      // 4. Đồng bộ danh sách người dùng
      const cloudUsers = await dbGetUsers();
      if (cloudUsers !== null && Array.isArray(cloudUsers)) {
        this.registeredUsers = cloudUsers;
        localStorage.setItem('tubizone_registered_users', JSON.stringify(this.registeredUsers));
        this.syncUserBalance();
      }

      this.notify();
    } catch (err) {
      console.warn('[Store] Supabase syncFromCloud note:', err);
    }
  }

  save() {
    this.syncUserBalance();
    try {
      localStorage.setItem('tz_theme', this.theme);
      localStorage.setItem('tubizone_theme', this.theme);
      localStorage.setItem('tubizone_user_auth', JSON.stringify(this.user));
      localStorage.setItem('tubizone_warehouse_accounts', JSON.stringify(this.accounts));
      localStorage.setItem('tubizone_orders', JSON.stringify(this.orders));
      localStorage.setItem('tubizone_deposit_history', JSON.stringify(this.depositHistory));
      localStorage.setItem('tubizone_registered_users', JSON.stringify(this.registeredUsers));
    } catch (e) {
      console.warn('[Store] LocalStorage save warning (quota):', e);
    }
    this.notify();
  }

  syncUserBalance() {
    if (this.user && !this.user.isAdmin && this.user.username) {
      const u = this.registeredUsers.find(x => x.username.toLowerCase() === this.user.username.toLowerCase());
      if (u) {
        u.balance = this.user.balance;
      }
    }
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(fn => fn(this));
  }

  toggleTheme() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', this.theme);
    this.save();
    return this.theme;
  }

  async register(username, password) {
    const cleanUser = (username || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (!cleanUser || cleanUser.length < 5 || cleanUser.length > 12) {
      return { success: false, message: "Tên đăng nhập phải từ 5 đến 12 ký tự!" };
    }
    if (!/^[a-z][a-z0-9]*$/.test(cleanUser)) {
      return { success: false, message: "Tên đăng nhập phải bắt đầu bằng chữ cái; chỉ dùng chữ thường và số!" };
    }

    // 1. Kiểm tra chính sách mật khẩu (Password Policy)
    const policyResult = SecurityService.validatePasswordPolicy(cleanPass);
    if (!policyResult.isValid) {
      return { 
        success: false, 
        message: policyResult.errors[0] || "Mật khẩu chưa đáp ứng tiêu chuẩn an toàn bảo mật!" 
      };
    }

    if (
      cleanUser === ADMIN_CONFIG.username.toLowerCase() ||
      cleanUser === ADMIN_CONFIG.altUsername.toLowerCase()
    ) {
      return { success: false, message: "Tên tài khoản này đã được bảo lưu cho Quản trị viên!" };
    }

    const existing = this.registeredUsers.find(u => u.username.toLowerCase() === cleanUser);
    if (existing) {
      return { success: false, message: "Tên đăng nhập này đã được đăng ký! Vui lòng chuyển sang tab Đăng nhập." };
    }

    // 2. Băm mật khẩu bằng Bcrypt với Salt ngẫu nhiên và Work factor = 10
    let hashedPassword;
    try {
      hashedPassword = await SecurityService.hashPassword(cleanPass);
    } catch (err) {
      console.error('[Security] Bcrypt hash error:', err);
      return { success: false, message: "Lỗi hệ thống mã hóa bảo mật. Vui lòng thử lại!" };
    }

    const newUser = {
      username: cleanUser,
      password: hashedPassword, // Chuỗi Bcrypt hash an toàn ($2a$10$...)
      displayName: cleanUser,
      balance: 0, // Kinh doanh thực tế: số dư khởi tạo là 0 VNĐ
      createdAt: new Date().toISOString()
    };

    this.registeredUsers.push(newUser);
    this.user = {
      isLoggedIn: true,
      isAdmin: false,
      username: newUser.username,
      displayName: newUser.displayName,
      balance: newUser.balance
    };
    this.save();

    // Lưu online lên Supabase Cloud (mật khẩu đã băm, không bao giờ gửi plain text)
    dbUpsertUser(newUser).catch(e => console.warn('[Supabase] dbUpsertUser error:', e));

    return { success: true, message: `Chào mừng ${newUser.displayName}! Tạo tài khoản thành công.` };
  }

  async login(username, password = '') {
    const cleanUser = (username || '').trim();
    const cleanPass = (password || '').trim();

    if (!cleanUser || !cleanPass) {
      return { success: false, message: "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!" };
    }

    // 1. Kiểm tra giới hạn số lần thử (Chống tấn công Brute-force & Rate Limiting)
    const rateCheck = SecurityService.checkRateLimit(cleanUser);
    if (rateCheck.isLocked) {
      return { 
        success: false, 
        isLocked: true, 
        remainingSeconds: rateCheck.remainingSeconds, 
        message: rateCheck.message 
      };
    }

    // 2. Kiểm tra đăng nhập tài khoản ADMIN
    const isAdminUser = 
      cleanUser.toLowerCase() === ADMIN_CONFIG.username.toLowerCase() || 
      cleanUser.toLowerCase() === ADMIN_CONFIG.altUsername.toLowerCase() ||
      (ADMIN_CONFIG.legacyUsername && cleanUser.toLowerCase() === ADMIN_CONFIG.legacyUsername.toLowerCase());

    if (isAdminUser) {
      const isMatch = await SecurityService.verifyPassword(cleanPass, ADMIN_CONFIG.password);
      if (isMatch) {
        SecurityService.resetRateLimit(cleanUser);
        this.user = {
          isLoggedIn: true,
          isAdmin: true,
          username: ADMIN_CONFIG.username,
          displayName: "Huỳnh Tuấn (Quản Trị Viên)",
          balance: 0 // Admin thực tế: 0đ và không mua nick
        };
        this.save();
        return { success: true, isAdmin: true, message: "Chào mừng Quản trị viên Huỳnh Tuấn!" };
      } else {
        const failRecord = SecurityService.recordFailedAttempt(cleanUser);
        return { 
          success: false, 
          isAdmin: false, 
          isLocked: failRecord.isLocked,
          remainingSeconds: failRecord.remainingSeconds,
          message: failRecord.isLocked ? failRecord.message : SecurityService.getGenericLoginErrorMessage() 
        };
      }
    }

    // 3. Kiểm tra tài khoản người dùng đã đăng ký
    const found = this.registeredUsers.find(u => u.username.toLowerCase() === cleanUser.toLowerCase());
    if (found) {
      const isMatch = await SecurityService.verifyPassword(cleanPass, found.password);
      if (isMatch) {
        SecurityService.resetRateLimit(cleanUser);

        // Tự động nâng cấp (re-hash) sang Bcrypt nếu tài khoản cũ trước đây lưu dạng plain text
        if (!SecurityService.isBcryptHash(found.password)) {
          try {
            const rehashed = await SecurityService.hashPassword(cleanPass);
            found.password = rehashed;
            dbUpsertUser(found).catch(() => {});
          } catch (e) {
            console.warn('[Security] Auto rehash note:', e);
          }
        }

        this.user = {
          isLoggedIn: true,
          isAdmin: false,
          username: found.username,
          displayName: found.displayName || found.username,
          balance: typeof found.balance === 'number' ? found.balance : 0
        };
        this.save();
        return { success: true, isAdmin: false, message: `Xin chào ${this.user.displayName}! Bạn đã đăng nhập thành công.` };
      }
    }

    // 4. Nếu thông tin không khớp hoặc tài khoản không tồn tại:
    // Tuyệt đối KHÔNG tự động đăng ký và KHÔNG báo "tài khoản không tồn tại" (Chống Username Enumeration)
    const failRecord = SecurityService.recordFailedAttempt(cleanUser);
    return { 
      success: false, 
      isAdmin: false, 
      isLocked: failRecord.isLocked,
      remainingSeconds: failRecord.remainingSeconds,
      message: failRecord.isLocked ? failRecord.message : SecurityService.getGenericLoginErrorMessage() 
    };
  }

  logout() {
    this.user = {
      isLoggedIn: false,
      isAdmin: false,
      username: "Khách",
      displayName: "Khách",
      balance: 0
    };
    this.save();
  }

  getUserOrders() {
    if (!this.user.isLoggedIn) return [];
    const currentName = (this.user.username || '').toLowerCase();
    return this.orders.filter(ord => {
      const b = (ord.buyer || '').toLowerCase();
      return b === currentName || (currentName === 'gamer_vip' && b === 'gamer_vip');
    });
  }

  getUserDeposits() {
    if (!this.user.isLoggedIn) return [];
    const currentName = (this.user.username || '').toLowerCase();
    return this.depositHistory.filter(dep => {
      const u = (dep.username || '').toLowerCase();
      return !u || u === currentName;
    });
  }

  // --- ADMIN: THÊM TÀI KHOẢN VÀO KHO ---
  addAccount(data) {
    const defaultImg = this.getDefaultGameImage(data.game);
    const mainImg = data.image ? data.image.trim() : defaultImg;

    // Xử lý danh sách ảnh album (gallery)
    let galleryImages = [];
    if (Array.isArray(data.images) && data.images.length > 0) {
      galleryImages = data.images.filter(url => typeof url === 'string' && url.trim().length > 0);
    } else if (typeof data.images === 'string' && data.images.trim().length > 0) {
      galleryImages = data.images
        .split(/[\n,]+/)
        .map(u => u.trim())
        .filter(u => u.length > 0);
    }

    // Đảm bảo có ít nhất ảnh chính trong album
    if (galleryImages.length === 0) {
      galleryImages = [mainImg];
    } else if (!galleryImages.includes(mainImg)) {
      galleryImages.unshift(mainImg);
    }

    const accId = String(data.id || ('TZ-' + Math.floor(100000 + Math.random() * 900000))).trim();

    // Nếu ID này từng nằm trong danh sách đã xóa, xóa khỏi danh sách đã xóa
    try {
      let deletedIds = JSON.parse(localStorage.getItem('tubizone_deleted_acc_ids') || '[]');
      deletedIds = deletedIds.filter(id => id !== accId);
      localStorage.setItem('tubizone_deleted_acc_ids', JSON.stringify(deletedIds));
    } catch (e) {}

    const newAcc = {
      id: accId,
      game: data.game, // 'freefire' | 'lienquan' | 'fcmobile' | 'blindbag'
      prime: data.prime || 'Prime 1',
      ovr: data.ovr || '125 OVR',
      server: data.server || 'Global',
      subCategory: data.subCategory || 'bloxfruits',
      rank: data.rank || 'Sẵn sàng',
      accountType: data.accountType || 'VIP Tự Chọn',
      title: data.title,
      price: Number(data.price) || 50000,
      image: mainImg,
      images: galleryImages,
      credentials: data.credentials || 'Tài khoản: [Chưa có] | Mật khẩu: [Chưa có]',
      description: data.description || 'Tài khoản chính chủ, bảo mật tuyệt đối 100%.',
      status: 'AVAILABLE', // 'AVAILABLE' | 'SOLD'
      createdAt: new Date().toISOString(),
      createdDate: new Date().toLocaleDateString('vi-VN')
    };

    // Nếu acc đã tồn tại thì ghi đè, chưa có thì thêm lên đầu
    const existingIdx = this.accounts.findIndex(a => String(a.id) === accId);
    if (existingIdx >= 0) {
      this.accounts[existingIdx] = newAcc;
    } else {
      this.accounts.unshift(newAcc);
    }

    this.save();

    // Lưu online lên Supabase Cloud để tất cả người dùng và mọi thiết bị đều thấy vĩnh viễn
    dbInsertAccount(newAcc).catch(e => console.warn('[Supabase] dbInsertAccount error:', e));

    return newAcc;
  }

  deleteAccount(accId) {
    const idStr = String(accId);
    this.accounts = this.accounts.filter(a => String(a.id) !== idStr);

    // Ghi nhớ ID đã xóa để tránh syncFromCloud phục hồi lại
    try {
      const deletedIds = JSON.parse(localStorage.getItem('tubizone_deleted_acc_ids') || '[]');
      if (!deletedIds.includes(idStr)) {
        deletedIds.push(idStr);
        if (deletedIds.length > 100) deletedIds.shift();
        localStorage.setItem('tubizone_deleted_acc_ids', JSON.stringify(deletedIds));
      }
    } catch (e) {
      console.warn('Error saving deleted id:', e);
    }

    this.save();

    // Xóa trên Supabase Cloud
    dbDeleteAccount(idStr).catch(e => console.warn('[Supabase] dbDeleteAccount error:', e));
  }

  getDefaultGameImage(game) {
    if (game === 'freefire') return 'assets/images/cat-freefire.jpg';
    if (game === 'lienquan') return 'assets/images/cat-lienquan.jpg';
    if (game === 'fcmobile') return 'assets/images/cat-fcmobile.jpg';
    if (game === 'blindbag' || game === 'ff-blindbag') return 'assets/images/cat-ff-blindbag.jpg';
    return 'assets/images/cat-ff-blindbag.jpg';
  }

  // --- MUA TÀI KHOẢN ---
  purchaseAccount(accId) {
    const acc = this.accounts.find(a => a.id === accId && a.status === 'AVAILABLE');
    if (!acc) {
      return { success: false, message: "Tài khoản không tồn tại hoặc đã được bán!" };
    }

    if (!this.user.isLoggedIn) {
      return { success: false, message: "Bạn cần đăng nhập để thực hiện mua nick!" };
    }

    // Admin tuyệt đối không được phép mua tài khoản (kinh doanh thực tế)
    if (this.user.isAdmin) {
      return { 
        success: false, 
        isAdminBlocked: true,
        message: "Tài khoản Quản trị viên (Admin) không được phép mua nick trong shop! Bạn là chủ shop, vui lòng đăng xuất và sử dụng tài khoản khách hàng để mua thử nghiệm." 
      };
    }

    // Kiểm tra số dư người mua
    if (this.user.balance < acc.price) {
      return { success: false, message: `Số dư không đủ! Cần thêm ${(acc.price - this.user.balance).toLocaleString('vi-VN')} đ.` };
    }

    // Trừ tiền người mua
    this.user.balance -= acc.price;

    // Cập nhật trạng thái acc
    acc.status = 'SOLD';

    // Tạo bản ghi đơn hàng
    const order = {
      orderId: 'TZ-ORD-' + Date.now().toString().slice(-6),
      buyer: this.user.username,
      buyerName: this.user.displayName,
      accId: acc.id,
      accTitle: acc.title,
      game: acc.game,
      price: acc.price,
      credentials: acc.credentials,
      date: new Date().toLocaleString('vi-VN'),
      status: 'SUCCESS'
    };

    this.orders.unshift(order);
    this.save();

    // Đồng bộ lên Supabase Cloud
    dbUpdateAccountStatus(acc.id, 'SOLD').catch(e => console.warn('[Supabase] dbUpdateAccountStatus error:', e));
    dbInsertOrder(order).catch(e => console.warn('[Supabase] dbInsertOrder error:', e));
    if (!this.user.isAdmin) {
      dbUpdateUserBalance(this.user.username, this.user.balance).catch(e => console.warn('[Supabase] dbUpdateUserBalance error:', e));
    }

    return {
      success: true,
      order: order,
      account: acc,
      message: "Mua tài khoản thành công!"
    };
  }

  // --- THỐNG KÊ TỔNG SỐ NICK TOÀN BỘ SHOP (TẤT CẢ KHO GỘP LẠI) ---
  getTotalAvailableAccounts() {
    return (this.accounts || []).filter(a => a.status === 'AVAILABLE').length;
  }

  // --- ADMIN: BÁO CÁO DOANH THU & GIAO DỊCH ---
  getMonthlyRevenue() {
    const totalRevenue = this.orders.reduce((sum, ord) => sum + (ord.price || 0), 0);
    const totalSold = this.orders.length;

    const gameStats = {
      freefire: { count: 0, revenue: 0 },
      lienquan: { count: 0, revenue: 0 },
      fcmobile: { count: 0, revenue: 0 },
      roblox: { count: 0, revenue: 0 },
      blindbag: { count: 0, revenue: 0 }
    };

    this.orders.forEach(ord => {
      if (gameStats[ord.game]) {
        gameStats[ord.game].count += 1;
        gameStats[ord.game].revenue += (ord.price || 0);
      }
    });

    return {
      totalRevenue,
      totalSold,
      gameStats,
      orders: this.orders
    };
  }

  requestCardDeposit(cardData) {
    const record = {
      id: 'CARD-' + Date.now().toString().slice(-6),
      type: 'card',
      username: this.user.username || 'Khách',
      telco: cardData.telco,
      amount: Number(cardData.amount),
      serial: cardData.serial,
      code: cardData.code,
      date: new Date().toLocaleString('vi-VN'),
      status: 'PENDING' // Chờ Admin kiểm tra mã thẻ
    };

    this.depositHistory.unshift(record);
    this.save();

    // Đồng bộ lên Supabase Cloud
    dbInsertDeposit(record).catch(e => console.warn('[Supabase] dbInsertDeposit error:', e));

    return record;
  }

  // Giữ alias tương thích
  depositCard(cardData) {
    return this.requestCardDeposit(cardData);
  }

  requestBankDeposit(amount) {
    const record = {
      id: 'ATM-' + Date.now().toString().slice(-6),
      type: 'bank',
      username: this.user.username || 'Khách',
      bankName: BANK_CONFIG.bankName,
      accountNumber: BANK_CONFIG.accountNumber,
      accountHolder: BANK_CONFIG.accountHolder,
      amount: Number(amount),
      date: new Date().toLocaleString('vi-VN'),
      status: 'PENDING' // Chờ Admin kiểm tra App Vietcombank
    };

    this.depositHistory.unshift(record);
    this.save();

    // Đồng bộ lên Supabase Cloud
    dbInsertDeposit(record).catch(e => console.warn('[Supabase] dbInsertDeposit error:', e));

    return record;
  }

  // Giữ alias tương thích
  depositBank(amount) {
    return this.requestBankDeposit(amount);
  }

  // --- ADMIN: DUYỆT CỘNG TIỀN NẠP THỰC TẾ ---
  adminApproveDeposit(depositId) {
    const dep = this.depositHistory.find(d => d.id === depositId);
    if (!dep) {
      return { success: false, message: "Không tìm thấy giao dịch nạp tiền này!" };
    }
    if (dep.status === 'SUCCESS') {
      return { success: false, message: "Giao dịch này đã được duyệt trước đó rồi!" };
    }

    dep.status = 'SUCCESS';

    // Tìm tài khoản người dùng để cộng tiền
    const targetUser = this.registeredUsers.find(u => (u.username || '').toLowerCase() === (dep.username || '').toLowerCase());
    if (targetUser) {
      targetUser.balance = (Number(targetUser.balance) || 0) + Number(dep.amount);
      if (this.user && this.user.username && this.user.username.toLowerCase() === targetUser.username.toLowerCase()) {
        this.user.balance = targetUser.balance;
      }
      dbUpdateUserBalance(targetUser.username, targetUser.balance).catch(e => console.warn('[Supabase] dbUpdateUserBalance error:', e));
    }

    this.save();
    dbUpdateDepositStatus(dep.id, 'SUCCESS').catch(e => console.warn('[Supabase] dbUpdateDepositStatus error:', e));

    return {
      success: true,
      deposit: dep,
      message: `Đã duyệt thành công! Đã cộng +${dep.amount.toLocaleString('vi-VN')} đ vào tài khoản ${dep.username}.`
    };
  }

  adminRejectDeposit(depositId, reason = '') {
    const dep = this.depositHistory.find(d => d.id === depositId);
    if (!dep) {
      return { success: false, message: "Không tìm thấy giao dịch nạp tiền này!" };
    }

    dep.status = 'REJECTED';
    this.save();
    dbUpdateDepositStatus(dep.id, 'REJECTED').catch(e => console.warn('[Supabase] dbUpdateDepositStatus error:', e));

    return {
      success: true,
      deposit: dep,
      message: `Đã từ chối đơn nạp #${dep.id} của khách ${dep.username}.`
    };
  }

  getPendingDepositsCount() {
    return this.depositHistory.filter(d => d.status === 'PENDING').length;
  }

  // --- ADMIN: XÓA THÀNH VIÊN ---
  adminDeleteUser(username) {
    if (!username) return { success: false, message: "Tên đăng nhập không hợp lệ!" };
    const clean = username.toLowerCase().trim();
    if (clean === 'admin' || clean === ADMIN_CONFIG.username.toLowerCase()) {
      return { success: false, message: "Tuyệt đối không thể xóa tài khoản Quản trị viên!" };
    }

    const prevCount = this.registeredUsers.length;
    this.registeredUsers = this.registeredUsers.filter(u => (u.username || '').toLowerCase() !== clean);
    
    if (this.registeredUsers.length === prevCount) {
      return { success: false, message: `Không tìm thấy thành viên "${username}" trong hệ thống!` };
    }

    // Nếu người dùng bị xóa đang đăng nhập trên trình duyệt hiện tại thì đăng xuất
    if (this.user && (this.user.username || '').toLowerCase() === clean) {
      this.logout();
    } else {
      this.save();
    }

    // Xóa trên Supabase Cloud
    dbDeleteUser(clean).catch(e => console.warn('[Supabase] dbDeleteUser error:', e));

    return { success: true, message: `Đã xóa thành viên "${username}" thành công!` };
  }

  // --- ADMIN: RESET DOANH THU & LỊCH SỬ ĐƠN HÀNG VỀ 0 ---
  async adminResetOrders() {
    this.orders = [];
    try {
      localStorage.setItem('tubizone_orders', '[]');
      localStorage.setItem('tubizone_orders_reset_v2', 'true');
    } catch (e) {}
    this.save();
    try {
      await dbClearAllOrders();
    } catch (e) {
      console.warn('[Supabase] dbClearAllOrders error:', e);
    }
    return { success: true, message: "Đã reset toàn bộ doanh thu và lịch sử đơn hàng về 0đ!" };
  }

  // --- ADMIN: RESET TOÀN BỘ PHIẾU NẠP TIỀN ---
  async adminResetDeposits() {
    this.depositHistory = [];
    try {
      localStorage.setItem('tubizone_deposit_history', '[]');
    } catch (e) {}
    this.save();
    try {
      await dbClearAllDeposits();
    } catch (e) {
      console.warn('[Supabase] dbClearAllDeposits error:', e);
    }
    return { success: true, message: "Đã reset toàn bộ danh sách phiếu nạp tiền thành công!" };
  }
}

export const store = new AppStore();

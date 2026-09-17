// =========================================================
// tuBIzOne.com - SECURITY SERVICE
// TIÊU CHUẨN AN TOÀN CÔNG NGHIỆP (INDUSTRY STANDARD SECURITY)
// 1. Băm mật khẩu (Bcrypt Hashing with Work Factor 10 + Random Salt)
// 2. Chính sách mật khẩu mạnh (Password Policy Validator)
// 3. Chống Brute-force & Khóa tạm thời (Rate Limiting & Cooldown)
// 4. Phòng chống rò quét tài khoản (Username Enumeration Protection)
// =========================================================

const BCRYPT_SALT_ROUNDS = 10;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 phút khóa tạm thời

/**
 * Lấy đối tượng bcrypt từ môi trường trình duyệt
 */
function getBcryptInstance() {
  if (typeof window !== 'undefined') {
    if (window.dcodeIO && window.dcodeIO.bcrypt) {
      return window.dcodeIO.bcrypt;
    }
    if (window.bcrypt) {
      return window.bcrypt;
    }
  }
  return null;
}

/**
 * Dự phòng băm mật khẩu chuẩn Web Crypto PBKDF2 nếu CDN chưa kịp tải xong
 */
async function fallbackWebCryptoHash(password, saltStr = null) {
  const enc = new TextEncoder();
  const salt = saltStr 
    ? enc.encode(saltStr) 
    : window.crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  const derivedKey = await window.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );
  const hashArray = Array.from(new Uint8Array(derivedKey));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  return `$pbkdf2$100000$${saltHex}$${hashHex}`;
}

async function fallbackWebCryptoVerify(password, storedHash) {
  try {
    const parts = storedHash.split('$');
    if (parts.length !== 5 || parts[1] !== 'pbkdf2') return false;
    const saltHex = parts[3];
    const saltBytes = new Uint8Array(saltHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    const saltStr = new TextDecoder().decode(saltBytes);
    const computed = await fallbackWebCryptoHash(password, saltStr);
    return computed === storedHash;
  } catch {
    return false;
  }
}

export const SecurityService = {
  /**
   * 1. BĂM MẬT KHẨU (PASSWORD HASHING & SALTING)
   * Sử dụng Bcrypt với Work Factor = 10, tự động sinh salt ngẫu nhiên.
   */
  async hashPassword(plainPassword) {
    if (!plainPassword || typeof plainPassword !== 'string') {
      throw new Error('Mật khẩu không hợp lệ để băm!');
    }

    const bcrypt = getBcryptInstance();
    if (bcrypt && typeof bcrypt.hash === 'function') {
      return new Promise((resolve, reject) => {
        bcrypt.genSalt(BCRYPT_SALT_ROUNDS, (err, salt) => {
          if (err) return reject(err);
          bcrypt.hash(plainPassword, salt, (err, hash) => {
            if (err) return reject(err);
            resolve(hash);
          });
        });
      });
    }

    // Nếu bcrypt chưa tải xong trên CDN, dùng Web Crypto PBKDF2 tiêu chuẩn
    return await fallbackWebCryptoHash(plainPassword);
  },

  /**
   * XÁC THỰC MẬT KHẨU
   * So sánh an toàn mật khẩu nhập vào với chuỗi băm lưu trữ.
   * Hỗ trợ tương thích ngược cho tài khoản cũ chưa băm.
   */
  async verifyPassword(plainPassword, storedHash) {
    if (!plainPassword || !storedHash) return false;

    const bcrypt = getBcryptInstance();

    // 1. Kiểm tra nếu là mã băm chuẩn Bcrypt ($2a$, $2b$, $2y$)
    if (typeof storedHash === 'string' && /^\$2[aby]\$\d{2}\$/.test(storedHash)) {
      if (bcrypt && typeof bcrypt.compare === 'function') {
        return new Promise((resolve) => {
          bcrypt.compare(plainPassword, storedHash, (err, same) => {
            if (err) resolve(false);
            else resolve(!!same);
          });
        });
      }
    }

    // 2. Kiểm tra nếu là mã băm PBKDF2 Web Crypto dự phòng
    if (typeof storedHash === 'string' && storedHash.startsWith('$pbkdf2$')) {
      return await fallbackWebCryptoVerify(plainPassword, storedHash);
    }

    // 3. Tương thích ngược: Nếu tài khoản cũ đang lưu plain text
    // Sau khi đăng nhập thành công, hệ thống sẽ tự động re-hash sang Bcrypt
    if (plainPassword === storedHash) {
      return true;
    }

    return false;
  },

  /**
   * Kiểm tra xem chuỗi mật khẩu có phải đã được băm chuẩn Bcrypt hay chưa
   */
  isBcryptHash(hashStr) {
    return typeof hashStr === 'string' && /^\$2[aby]\$\d{2}\$[./0-9A-Za-z]{53}$/.test(hashStr);
  },

  /**
   * 2. CHÍNH SÁCH MẬT KHẨU MẠNH (PASSWORD POLICY)
   * - Tối thiểu 8 ký tự, tối đa 64 ký tự.
   * - Ít nhất 1 chữ cái in hoa (A-Z).
   * - Ít nhất 1 chữ cái in thường (a-z).
   * - Ít nhất 1 chữ số (0-9).
   * - Ít nhất 1 ký tự đặc biệt (@$!%*?&#...)
   */
  validatePasswordPolicy(password) {
    const pwd = password || '';
    const checklist = {
      length: pwd.length >= 8 && pwd.length <= 64,
      hasUpper: /[A-Z]/.test(pwd),
      hasLower: /[a-z]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd),
      hasSpecial: /[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(pwd)
    };

    const errors = [];
    if (!checklist.length) {
      errors.push('Độ dài mật khẩu từ 8 đến 64 ký tự.');
    }
    if (!checklist.hasUpper) {
      errors.push('Ít nhất 1 chữ cái viết hoa (A–Z).');
    }
    if (!checklist.hasLower) {
      errors.push('Ít nhất 1 chữ cái viết thường (a–z).');
    }
    if (!checklist.hasNumber) {
      errors.push('Ít nhất 1 chữ số (0–9).');
    }
    if (!checklist.hasSpecial) {
      errors.push('Ít nhất 1 ký tự đặc biệt (@$!%*?&#...).');
    }

    // Tính điểm độ mạnh từ 0 đến 100%
    const passedCount = Object.values(checklist).filter(Boolean).length;
    let score = (passedCount / 5) * 100;
    let strengthLevel = 'weak'; // 'weak' | 'medium' | 'strong'
    let strengthLabel = 'Yếu';

    if (passedCount >= 5) {
      strengthLevel = 'strong';
      strengthLabel = 'Rất mạnh (An toàn)';
    } else if (passedCount >= 3) {
      strengthLevel = 'medium';
      strengthLabel = 'Trung bình';
    }

    return {
      isValid: errors.length === 0,
      errors,
      score,
      strengthLevel,
      strengthLabel,
      checklist
    };
  },

  /**
   * 3. CHỐNG BRUTE-FORCE & RATE LIMITING
   */
  _getRateLimitStorageKey(identifier) {
    return `tz_ratelimit_${(identifier || 'guest').toLowerCase().trim()}`;
  },

  checkRateLimit(identifier) {
    const key = this._getRateLimitStorageKey(identifier);
    try {
      const recordStr = localStorage.getItem(key);
      if (!recordStr) return { isLocked: false, attemptsLeft: MAX_FAILED_ATTEMPTS };

      const record = JSON.parse(recordStr);
      const now = Date.now();

      // Nếu đang trong thời gian bị khóa
      if (record.lockedUntil && record.lockedUntil > now) {
        const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
        return {
          isLocked: true,
          remainingSeconds,
          message: `Tài khoản tạm thời bị khóa do nhập sai nhiều lần. Vui lòng thử lại sau ${remainingSeconds} giây.`
        };
      }

      // Nếu đã hết thời gian khóa, tự động reset
      if (record.lockedUntil && record.lockedUntil <= now) {
        localStorage.removeItem(key);
        return { isLocked: false, attemptsLeft: MAX_FAILED_ATTEMPTS };
      }

      const attemptsLeft = Math.max(0, MAX_FAILED_ATTEMPTS - (record.count || 0));
      return { isLocked: false, attemptsLeft };
    } catch {
      return { isLocked: false, attemptsLeft: MAX_FAILED_ATTEMPTS };
    }
  },

  recordFailedAttempt(identifier) {
    const key = this._getRateLimitStorageKey(identifier);
    try {
      const now = Date.now();
      let record = { count: 0, firstFail: now, lockedUntil: null };

      const existingStr = localStorage.getItem(key);
      if (existingStr) {
        record = JSON.parse(existingStr);
      }

      record.count = (record.count || 0) + 1;

      if (record.count >= MAX_FAILED_ATTEMPTS) {
        // Khóa trong 5 phút
        record.lockedUntil = now + LOCKOUT_DURATION_MS;
        localStorage.setItem(key, JSON.stringify(record));
        return {
          isLocked: true,
          remainingSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000),
          message: `Bạn đã nhập sai ${record.count} lần liên tiếp! Hệ thống tạm khóa đăng nhập trong 5 phút để bảo vệ tài khoản.`
        };
      }

      localStorage.setItem(key, JSON.stringify(record));
      const attemptsLeft = MAX_FAILED_ATTEMPTS - record.count;
      return {
        isLocked: false,
        attemptsLeft,
        message: `Tên đăng nhập hoặc mật khẩu không chính xác. Bạn còn ${attemptsLeft} lần thử trước khi bị khóa tạm thời.`
      };
    } catch {
      return { isLocked: false, attemptsLeft: 0, message: "Tên đăng nhập hoặc mật khẩu không chính xác." };
    }
  },

  resetRateLimit(identifier) {
    const key = this._getRateLimitStorageKey(identifier);
    try {
      localStorage.removeItem(key);
    } catch {
      // Bỏ qua nếu môi trường không cho phép truy cập localStorage
    }
  },

  /**
   * 4. THÔNG BÁO LỖI BẢO MẬT CHUNG (GENERIC SECURITY MESSAGE)
   * Chống dò quét tài khoản (Username Enumeration)
   */
  getGenericLoginErrorMessage() {
    return "Tên đăng nhập hoặc mật khẩu không chính xác.";
  }
};

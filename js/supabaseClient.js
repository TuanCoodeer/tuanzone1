// =========================================================
// tuBIzOne.com - Supabase Client Configuration & Services
// =========================================================

export const SUPABASE_CONFIG = {
  url: "https://uhyovzhmbeioqgxpmpqi.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoeW92emhtYmVpb3FneHBtcHFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMTg5NTAsImV4cCI6MjEwNDc5NDk1MH0.kmvFHFkviZ2q58oSjo2SmKHPAJLesaIaKCZuc7GLMpA"
};

// Lấy instance của Supabase SDK
export function getSupabase() {
  if (typeof window !== 'undefined' && window.supabase && window.supabase.createClient) {
    if (!window._tz_supabase_instance) {
      window._tz_supabase_instance = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    }
    return window._tz_supabase_instance;
  }
  return null;
}

// =========================================================
// API SERVICES: ACCOUNTS (KHO TÀI KHOẢN)
// =========================================================

export async function dbGetAccounts() {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data, error } = await sb
      .from('accounts')
      .select('*')
      .order('createdAt', { ascending: false });
    if (error) {
      console.warn('[Supabase] dbGetAccounts warning:', error.message);
      return null;
    }
    if (!data || !Array.isArray(data)) return [];

    // Giải nén metadata mở rộng (rank, accountType, images) từ trường description nếu có
    return data.map(acc => {
      const copy = { ...acc };
      if (typeof copy.description === 'string' && copy.description.includes('<!--tz_meta:')) {
        try {
          const match = copy.description.match(/<!--tz_meta:(.*?)-->/s);
          if (match && match[1]) {
            const meta = JSON.parse(match[1]);
            if (meta.rank && !copy.rank) copy.rank = meta.rank;
            if (meta.accountType && !copy.accountType) copy.accountType = meta.accountType;
            if (meta.images && Array.isArray(meta.images) && (!copy.images || copy.images.length === 0)) copy.images = meta.images;
            copy.description = copy.description.replace(/<!--tz_meta:.*?-->/s, '').trim();
          }
        } catch (e) {
          console.warn('[Supabase] Error unpacking tz_meta:', e);
        }
      }
      if (!copy.images || !Array.isArray(copy.images) || copy.images.length === 0) {
        copy.images = copy.image ? [copy.image] : [];
      }
      return copy;
    });
  } catch (err) {
    console.warn('[Supabase] dbGetAccounts network error:', err);
    return null;
  }
}

export async function dbInsertAccount(account) {
  const sb = getSupabase();
  if (!sb) return false;
  try {
    // Đóng gói các thuộc tính mở rộng (rank, accountType, images) vào tag metadata trong description
    // Nhằm tương thích 100% với cấu trúc bảng Supabase hiện tại
    let cleanDesc = account.description || '';
    const metaObj = {};
    if (account.rank) metaObj.rank = account.rank;
    if (account.accountType) metaObj.accountType = account.accountType;
    if (account.images && Array.isArray(account.images) && account.images.length > 0) {
      metaObj.images = account.images;
    }

    cleanDesc = cleanDesc.replace(/<!--tz_meta:.*?-->/s, '').trim();
    if (Object.keys(metaObj).length > 0) {
      cleanDesc += (cleanDesc ? '\n' : '') + `<!--tz_meta:${JSON.stringify(metaObj)}-->`;
    }

    const payload = {
      id: String(account.id),
      game: String(account.game || 'freefire'),
      prime: String(account.prime || ''),
      ovr: String(account.ovr || ''),
      server: String(account.server || ''),
      subCategory: String(account.subCategory || ''),
      title: String(account.title || ''),
      price: Number(account.price) || 0,
      image: String(account.image || ''),
      credentials: String(account.credentials || ''),
      description: cleanDesc,
      status: String(account.status || 'AVAILABLE'),
      createdAt: account.createdAt || new Date().toISOString(),
      createdDate: account.createdDate || new Date().toLocaleDateString('vi-VN')
    };

    // Dùng upsert để nếu ID đã tồn tại thì cập nhật, chưa có thì thêm mới
    const { error } = await sb.from('accounts').upsert([payload]);

    if (error) {
      console.error('[Supabase] dbInsertAccount error:', error.message);
      return false;
    }
    console.log('[Supabase] Đã đồng bộ tài khoản lên Supabase Cloud thành công! ID:', payload.id);
    return true;
  } catch (err) {
    console.error('[Supabase] dbInsertAccount exception:', err);
    return false;
  }
}

export async function dbDeleteAccount(id) {
  const sb = getSupabase();
  if (!sb) return false;
  try {
    const { error } = await sb.from('accounts').delete().eq('id', id);
    if (error) {
      console.error('[Supabase] dbDeleteAccount error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Supabase] dbDeleteAccount exception:', err);
    return false;
  }
}

export async function dbUpdateAccountStatus(id, status) {
  const sb = getSupabase();
  if (!sb) return false;
  try {
    const { error } = await sb.from('accounts').update({ status }).eq('id', id);
    if (error) {
      console.error('[Supabase] dbUpdateAccountStatus error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Supabase] dbUpdateAccountStatus exception:', err);
    return false;
  }
}

// =========================================================
// API SERVICES: ORDERS (ĐƠN HÀNG MUA NICK)
// =========================================================

export async function dbGetOrders() {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data, error } = await sb
      .from('orders')
      .select('*')
      .order('createdAt', { ascending: false });
    if (error) {
      console.warn('[Supabase] dbGetOrders warning:', error.message);
      return null;
    }
    return data || [];
  } catch (err) {
    console.warn('[Supabase] dbGetOrders network error:', err);
    return null;
  }
}

export async function dbInsertOrder(order) {
  const sb = getSupabase();
  if (!sb) return false;
  try {
    const { error } = await sb.from('orders').insert([{
      orderId: order.orderId,
      buyer: order.buyer,
      buyerName: order.buyerName || '',
      accId: order.accId,
      accTitle: order.accTitle || '',
      game: order.game || '',
      price: Number(order.price) || 0,
      credentials: order.credentials || '',
      date: order.date || '',
      status: order.status || 'SUCCESS',
      createdAt: new Date().toISOString()
    }]);
    if (error) {
      console.error('[Supabase] dbInsertOrder error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Supabase] dbInsertOrder exception:', err);
    return false;
  }
}

// =========================================================
// API SERVICES: DEPOSITS (LỊCH SỬ NẠP TIỀN)
// =========================================================

export async function dbGetDeposits() {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data, error } = await sb
      .from('deposits')
      .select('*')
      .order('createdAt', { ascending: false });
    if (error) {
      console.warn('[Supabase] dbGetDeposits warning:', error.message);
      return null;
    }
    return data || [];
  } catch (err) {
    console.warn('[Supabase] dbGetDeposits network error:', err);
    return null;
  }
}

export async function dbInsertDeposit(deposit) {
  const sb = getSupabase();
  if (!sb) return false;
  try {
    const { error } = await sb.from('deposits').insert([{
      id: deposit.id,
      type: deposit.type || 'card',
      username: deposit.username || 'Khách',
      amount: Number(deposit.amount) || 0,
      code: deposit.code || '',
      serial: deposit.serial || '',
      telco: deposit.telco || '',
      bankName: deposit.bankName || '',
      accountNumber: deposit.accountNumber || '',
      accountHolder: deposit.accountHolder || '',
      date: deposit.date || '',
      status: deposit.status || 'SUCCESS',
      createdAt: new Date().toISOString()
    }]);
    if (error) {
      console.error('[Supabase] dbInsertDeposit error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Supabase] dbInsertDeposit exception:', err);
    return false;
  }
}

export async function dbUpdateDepositStatus(id, status) {
  const sb = getSupabase();
  if (!sb) return false;
  try {
    const { error } = await sb.from('deposits').update({ status }).eq('id', id);
    if (error) {
      console.error('[Supabase] dbUpdateDepositStatus error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Supabase] dbUpdateDepositStatus exception:', err);
    return false;
  }
}

// =========================================================
// API SERVICES: USERS (NGƯỜI DÙNG ĐĂNG KÝ)
// =========================================================

export async function dbGetUsers() {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data, error } = await sb.from('users').select('*');
    if (error) {
      console.warn('[Supabase] dbGetUsers warning:', error.message);
      return null;
    }
    return data || [];
  } catch (err) {
    console.warn('[Supabase] dbGetUsers network error:', err);
    return null;
  }
}

export async function dbGetUserByUsername(username) {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const cleanUser = (username || '').toLowerCase().trim();
    if (!cleanUser) return null;
    const { data, error } = await sb
      .from('users')
      .select('*')
      .eq('username', cleanUser)
      .maybeSingle();
    if (error) {
      console.warn('[Supabase] dbGetUserByUsername warning:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('[Supabase] dbGetUserByUsername network error:', err);
    return null;
  }
}

export async function dbUpsertUser(user) {
  const sb = getSupabase();
  if (!sb) return false;
  try {
    const { error } = await sb.from('users').upsert({
      username: user.username.toLowerCase(),
      password: user.password,
      displayName: user.displayName || user.username,
      balance: Number(user.balance) || 0,
      createdAt: user.createdAt || new Date().toISOString()
    }, { onConflict: 'username' });
    if (error) {
      console.error('[Supabase] dbUpsertUser error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Supabase] dbUpsertUser exception:', err);
    return false;
  }
}

export async function dbUpdateUserBalance(username, balance) {
  const sb = getSupabase();
  if (!sb) return false;
  try {
    const { error } = await sb
      .from('users')
      .update({ balance: Number(balance) || 0 })
      .eq('username', username.toLowerCase());
    if (error) {
      console.error('[Supabase] dbUpdateUserBalance error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Supabase] dbUpdateUserBalance exception:', err);
    return false;
  }
}

export async function dbDeleteUser(username) {
  const sb = getSupabase();
  if (!sb) return false;
  try {
    const cleanUser = (username || '').toLowerCase().trim();
    if (!cleanUser || cleanUser === 'admin') return false;
    const { error } = await sb.from('users').delete().eq('username', cleanUser);
    if (error) {
      console.warn('[Supabase] dbDeleteUser warning:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] dbDeleteUser exception:', err);
    return false;
  }
}

export async function dbClearAllDeposits() {
  const sb = getSupabase();
  if (!sb) return false;
  try {
    const { error } = await sb.from('deposits').delete().neq('id', '___none___');
    if (error) {
      console.warn('[Supabase] dbClearAllDeposits warning:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] dbClearAllDeposits exception:', err);
    return false;
  }
}

export async function dbClearAllOrders() {
  const sb = getSupabase();
  if (!sb) return false;
  try {
    const { error } = await sb.from('orders').delete().neq('id', '___none___');
    if (error) {
      console.warn('[Supabase] dbClearAllOrders warning:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] dbClearAllOrders exception:', err);
    return false;
  }
}

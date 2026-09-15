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
    return data || [];
  } catch (err) {
    console.warn('[Supabase] dbGetAccounts network error:', err);
    return null;
  }
}

export async function dbInsertAccount(account) {
  const sb = getSupabase();
  if (!sb) return false;
  try {
    const payload = {
      id: account.id,
      game: account.game,
      prime: account.prime || '',
      ovr: account.ovr || '',
      server: account.server || '',
      subCategory: account.subCategory || '',
      title: account.title,
      price: Number(account.price) || 0,
      image: account.image || '',
      credentials: account.credentials || '',
      description: account.description || '',
      status: account.status || 'AVAILABLE',
      createdAt: account.createdAt || new Date().toISOString(),
      createdDate: account.createdDate || new Date().toLocaleDateString('vi-VN')
    };

    // Thử gửi kèm các trường mở rộng nếu có
    if (account.images && Array.isArray(account.images)) {
      payload.images = account.images;
    }
    if (account.rank) {
      payload.rank = account.rank;
    }
    if (account.accountType) {
      payload.accountType = account.accountType;
    }

    let { error } = await sb.from('accounts').insert([payload]);
    
    // Nếu bảng Supabase chưa có cột mở rộng (schema strict) thì tự động fallback chỉ lưu các cột chuẩn
    if (error && error.message && (error.message.includes('column') && error.message.includes('does not exist'))) {
      delete payload.images;
      delete payload.rank;
      delete payload.accountType;
      const retry = await sb.from('accounts').insert([payload]);
      error = retry.error;
    }

    if (error) {
      console.error('[Supabase] dbInsertAccount error:', error.message);
      return false;
    }
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

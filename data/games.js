// =========================================================
// tuanzOne.com - 3 Kho Nick Duy Nhất
// 1. Kho Nick Free Fire
// 2. Kho Nick Liên Quân
// 3. Kho Nick FC Mobile (OVR Đội Hình, Server)
// =========================================================

export const WAREHOUSES = {
  freefire: {
    id: "freefire",
    name: "Kho Nick Free Fire",
    icon: "🔥",
    color: "#ff6600",
    banner: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80",
    description: "Kho tài khoản Free Fire chính chủ, hỗ trợ phân loại theo Prime (1-8) và mức giá.",
    primes: ["Prime 1", "Prime 2", "Prime 3", "Prime 4", "Prime 5", "Prime 6", "Prime 7", "Prime 8"],
    priceRanges: [
      { id: "all", label: "Tất cả mức giá" },
      { id: "under-50k", label: "Dưới 50K", max: 50000 },
      { id: "50k-200k", label: "50K - 200K", min: 50000, max: 200000 },
      { id: "200k-500k", label: "200K - 500K", min: 200000, max: 500000 },
      { id: "500k-1m", label: "500K - 1 Triệu", min: 500000, max: 1000000 },
      { id: "1m-5m", label: "1 Triệu - 5 Triệu", min: 1000000, max: 5000000 },
      { id: "5m-10m", label: "5 Triệu - 10 Triệu", min: 5000000, max: 10000000 },
      { id: "10m-15m", label: "10 Triệu - 15 Triệu", min: 10000000, max: 15000000 },
      { id: "15m-20m", label: "15 Triệu - 20 Triệu", min: 15000000, max: 20000000 },
      { id: "over-20m", label: "Trên 20 Triệu", min: 20000000 }
    ]
  },
  lienquan: {
    id: "lienquan",
    name: "Kho Nick Liên Quân",
    icon: "⚔️",
    color: "#0084ff",
    banner: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80",
    description: "Kho tài khoản Liên Quân Mobile trắng thông tin, phân loại theo mức giá và sắp xếp linh hoạt.",
    priceRanges: [
      { id: "all", label: "Tất cả mức giá" },
      { id: "under-50k", label: "Dưới 50K", max: 50000 },
      { id: "50k-200k", label: "50K - 200K", min: 50000, max: 200000 },
      { id: "200k-500k", label: "200K - 500K", min: 200000, max: 500000 },
      { id: "500k-1m", label: "500K - 1 Triệu", min: 500000, max: 1000000 },
      { id: "1m-5m", label: "1 Triệu - 5 Triệu", min: 1000000, max: 5000000 },
      { id: "5m-10m", label: "5 Triệu - 10 Triệu", min: 5000000, max: 10000000 },
      { id: "10m-15m", label: "10 Triệu - 15 Triệu", min: 10000000, max: 15000000 },
      { id: "15m-20m", label: "15 Triệu - 20 Triệu", min: 15000000, max: 20000000 },
      { id: "over-20m", label: "Trên 20 Triệu", min: 20000000 }
    ]
  },
  fcmobile: {
    id: "fcmobile",
    name: "Kho Nick FC Mobile",
    icon: "⚽",
    color: "#10b981",
    banner: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&auto=format&fit=crop&q=80",
    description: "Kho tài khoản FC Mobile chính chủ, phân loại theo chỉ số OVR đội hình, Server và mức giá.",
    ovrLevels: [
      { id: "all", label: "Tất cả OVR" },
      { id: "100-110", label: "OVR 100 - 110", min: 100, max: 110 },
      { id: "111-120", label: "OVR 111 - 120", min: 111, max: 120 },
      { id: "121-130", label: "OVR 121 - 130", min: 121, max: 130 },
      { id: "over-130", label: "OVR 130+", min: 130 }
    ],
    servers: [
      { id: "all", label: "Tất cả Server" },
      { id: "global", label: "Bản Quốc Tế (Global)" },
      { id: "korea", label: "Bản Hàn Quốc (Nexon)" }
    ],
    priceRanges: [
      { id: "all", label: "Tất cả mức giá" },
      { id: "under-50k", label: "Dưới 50K", max: 50000 },
      { id: "50k-200k", label: "50K - 200K", min: 50000, max: 200000 },
      { id: "200k-500k", label: "200K - 500K", min: 200000, max: 500000 },
      { id: "500k-1m", label: "500K - 1 Triệu", min: 500000, max: 1000000 },
      { id: "1m-5m", label: "1 Triệu - 5 Triệu", min: 1000000, max: 5000000 },
      { id: "5m-10m", label: "5 Triệu - 10 Triệu", min: 5000000, max: 10000000 },
      { id: "10m-15m", label: "10 Triệu - 15 Triệu", min: 10000000, max: 15000000 },
      { id: "15m-20m", label: "15 Triệu - 20 Triệu", min: 15000000, max: 20000000 },
      { id: "over-20m", label: "Trên 20 Triệu", min: 20000000 }
    ]
  }
};

// Top Nạp Tiền Tháng (Chưa có giao dịch - để trống theo yêu cầu)
export const TOP_DEPOSIT_USERS = [];

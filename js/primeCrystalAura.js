// =========================================================
// tuBIzOne.com - Hiệu Ứng Các Viên Pha Lê 2D Ánh Kim (Prime 6 - 8)
// Thiết kế 2D Crystal Gemstones & Prismatic Rainbow Shards
// Nhanh, bùng nổ, sắc nét, phân cấp độ đẹp & sặc sỡ rõ rệt
// =========================================================

export class PrimeCrystalAura {
  constructor(canvasId = 'prime-crystal-canvas') {
    this.canvasId = canvasId;
    this.canvas = null;
    this.ctx = null;
    this.animationId = null;
    this.isRunning = false;
    this.width = 0;
    this.height = 0;
    this.dpr = 1;

    this.crystals = [];
    this.currentLevel = 6;
    this.startTime = 0;
    this.duration = 750; // Nhanh & dứt khoát (< 1 giây)

    this.init();
  }

  init() {
    this.canvas = document.getElementById(this.canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d', { alpha: true });
    if (!this.ctx) return;

    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.resize();

    window.addEventListener('resize', () => {
      this.resize();
    });
  }

  resize() {
    if (!this.canvas) return;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
  }

  /**
   * Sinh các viên pha lê 2D phân cấp sắc độ và độ đẹp theo từng Prime
   * @param {number} level - Cấp Prime (6, 7, 8)
   */
  createCrystals(level) {
    this.crystals = [];
    
    // 1. Số lượng viên pha lê theo cấp:
    // Prime 6: ~30 viên (nhẹ nhàng, vàng thanh khiết)
    // Prime 7: ~50 viên (đậm đà, vàng cam lửa)
    // Prime 8: ~80 viên (sặc sỡ nhất, bùng nổ cầu vồng kim cương lộng lẫy)
    let count = 30;
    if (level === 7) count = 50;
    if (level === 8) count = 80;

    const types = ['shard', 'diamond', 'hexagon', 'star'];

    // Bảng màu 2D Crystal Palettes
    // Palette Prime 6: Vàng Kim Tinh Khiết (Pure Golden Citrine)
    const p6Palettes = [
      { main: '#ffd700', light: '#fff8b0', dark: '#cc9900', edge: '#ffffff', glow: 'rgba(255, 215, 0, 0.45)' },
      { main: '#ffc107', light: '#ffecb3', dark: '#b28704', edge: '#fff9c4', glow: 'rgba(255, 193, 7, 0.45)' },
      { main: '#ffea00', light: '#ffffff', dark: '#c4b000', edge: '#ffff8d', glow: 'rgba(255, 234, 0, 0.45)' }
    ];

    // Palette Prime 7: Lửa Hổ Phách Đậm Sắc (Fiery Amber & Solar Gold)
    const p7Palettes = [
      { main: '#ff6d00', light: '#ffd180', dark: '#b34700', edge: '#ffffff', glow: 'rgba(255, 109, 0, 0.65)' },
      { main: '#ff9100', light: '#ffe082', dark: '#c46200', edge: '#fff3e0', glow: 'rgba(255, 145, 0, 0.6)' },
      { main: '#ffd600', light: '#ffff8d', dark: '#cc9900', edge: '#ffffff', glow: 'rgba(255, 214, 0, 0.55)' },
      { main: '#ff3d00', light: '#ff9e80', dark: '#992200', edge: '#ffebee', glow: 'rgba(255, 61, 0, 0.6)' }
    ];

    // Palette Prime 8: KIM CƯƠNG CẦU VỒNG THẦN THOẠI (Mythic Prismatic Rainbow Diamond) - SẶC SỠ VÀ ĐẸP NHẤT!
    const p8Palettes = [
      // 1. Kim cương Vàng Ánh Kim Hoàng Gia
      { main: '#ffd700', light: '#ffffff', dark: '#c48b00', edge: '#ffffff', glow: 'rgba(255, 215, 0, 0.85)' },
      // 2. Tinh thể Tím Thần Thoại (Mythic Amethyst)
      { main: '#e040fb', light: '#f8bbd0', dark: '#7b1fa2', edge: '#ffffff', glow: 'rgba(224, 64, 251, 0.8)' },
      // 3. Tinh thể Xanh Quang Học Cyan (Celestial Cyan Diamond)
      { main: '#00e5ff', light: '#e0f7fa', dark: '#00838f', edge: '#ffffff', glow: 'rgba(0, 229, 255, 0.85)' },
      // 4. Pha lê Hồng Ngọc Neon (Neon Ruby / Rose Quartz)
      { main: '#ff4081', light: '#fce4ec', dark: '#ad1457', edge: '#ffffff', glow: 'rgba(255, 64, 129, 0.8)' },
      // 5. Pha lê Ngọc Lục Bảo (Emerald Prismatic)
      { main: '#00e676', light: '#b9f6ca', dark: '#00701a', edge: '#ffffff', glow: 'rgba(0, 230, 118, 0.8)' },
      // 6. Pha lê Lăng Kính Ánh Tím Lam (Royal Sapphire Violet)
      { main: '#7c4dff', light: '#ede7f6', dark: '#4a148c', edge: '#ffffff', glow: 'rgba(124, 77, 255, 0.85)' }
    ];

    let selectedPalettes = p6Palettes;
    if (level === 7) selectedPalettes = p7Palettes;
    if (level === 8) selectedPalettes = p8Palettes;

    for (let i = 0; i < count; i++) {
      // Phân bổ các viên pha lê trên toàn màn hình với sự nhấn nhá tự nhiên
      const x = Math.random() * this.width;
      const y = Math.random() * this.height;

      // Kích thước viên pha lê: từ 16px đến 48px (Prime 8 có những viên lớn tới 55px lộng lẫy)
      const baseSize = level === 8 
        ? Math.random() * 32 + 20 
        : (level === 7 ? Math.random() * 26 + 18 : Math.random() * 22 + 16);

      // Vận tốc trôi nhẹ tạo cảm giác sống động (burst outwards)
      const moveAngle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2.5 + 1.2;
      const vx = Math.cos(moveAngle) * speed;
      const vy = Math.sin(moveAngle) * speed - 0.8; // Hơi bay nhẹ lên trên

      const type = types[Math.floor(Math.random() * types.length)];
      const palette = selectedPalettes[Math.floor(Math.random() * selectedPalettes.length)];

      this.crystals.push({
        x,
        y,
        vx,
        vy,
        size: baseSize,
        angle: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * (level === 8 ? 0.12 : 0.07),
        type,
        palette,
        sparkleOffset: Math.random() * Math.PI * 2,
        scale: 0
      });
    }
  }

  /**
   * Kích hoạt hiệu ứng các viên pha lê 2D
   * @param {number} level - Cấp Prime (6, 7, 8)
   */
  trigger(level = 6) {
    if (!this.canvas || !this.ctx) return;
    this.currentLevel = level;
    this.createCrystals(level);

    // Thời lượng hiệu ứng: Nhanh, dứt khoát và bắt mắt (< 1 giây)
    // Prime 6: 650ms, Prime 7: 750ms, Prime 8: 850ms
    if (level === 6) this.duration = 650;
    else if (level === 7) this.duration = 750;
    else if (level === 8) this.duration = 850;

    this.startTime = performance.now();

    if (!this.isRunning) {
      this.isRunning = true;
      this.render();
    }
  }

  stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    this.crystals = [];
  }

  render() {
    if (!this.isRunning) return;

    const now = performance.now();
    const elapsed = now - this.startTime;
    const progress = Math.min(1, elapsed / this.duration);

    if (progress >= 1) {
      this.stop();
      return;
    }

    const ctx = this.ctx;
    ctx.save();
    ctx.scale(this.dpr, this.dpr);
    ctx.clearRect(0, 0, this.width, this.height);

    // Tính toán độ mờ & scale tổng thể:
    // Nở bung cực nhanh trong 15% thời gian đầu, lấp lánh ở giữa, rồi tan biến nhanh ở cuối
    let alpha = 1;
    let globalScale = 1;

    if (progress < 0.15) {
      const pIn = progress / 0.15;
      alpha = pIn;
      globalScale = 0.4 + pIn * 0.6; // Nở to nhanh
    } else if (progress < 0.55) {
      alpha = 1;
      globalScale = 1 + Math.sin((progress - 0.15) * Math.PI) * 0.08;
    } else {
      const pOut = (progress - 0.55) / 0.45;
      alpha = 1 - Math.pow(pOut, 1.4);
      globalScale = 1 - pOut * 0.25;
    }

    // Vẽ từng viên pha lê 2D
    for (let i = 0; i < this.crystals.length; i++) {
      const c = this.crystals[i];

      // Cập nhật vị trí & góc xoay
      c.x += c.vx;
      c.y += c.vy;
      c.angle += c.rotSpeed;

      const currentSize = c.size * globalScale;
      if (currentSize <= 0) continue;

      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.angle);
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

      // Đổ bóng phát quang hào quang pha lê
      if (c.palette.glow) {
        ctx.shadowColor = c.palette.glow;
        ctx.shadowBlur = this.currentLevel === 8 ? 16 : (this.currentLevel === 7 ? 12 : 8);
      }

      // Vẽ hình dạng pha lê 2D tương ứng
      if (c.type === 'shard') {
        this.drawCrystalShard(ctx, currentSize, c.palette);
      } else if (c.type === 'diamond') {
        this.drawDiamondGem(ctx, currentSize, c.palette);
      } else if (c.type === 'hexagon') {
        this.drawHexagonGem(ctx, currentSize, c.palette);
      } else {
        this.drawStarGem(ctx, currentSize, c.palette);
      }

      // Điểm lóe sáng lấp lánh (Sparkle Glint) ở đỉnh viên pha lê
      const glintPulse = Math.sin(progress * 15 + c.sparkleOffset);
      if (glintPulse > 0.4) {
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(0, -currentSize * 0.45, Math.max(1.5, currentSize * 0.08), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    ctx.restore();
    this.animationId = requestAnimationFrame(() => this.render());
  }

  // --- CÁC HÀM VẼ TỪNG DẠNG VIÊN PHA LÊ 2D CHUẨN ĐỒ HỌA GAMING ---

  /**
   * 1. Trụ / Mảnh Pha Lê Nhọn 2 Đầu (Crystal Shard)
   */
  drawCrystalShard(ctx, size, pal) {
    const w = size * 0.45;
    const h = size * 1.1;

    // Mặt cắt bên trái (Highlight Facet)
    ctx.beginPath();
    ctx.moveTo(0, -h * 0.5);
    ctx.lineTo(-w * 0.5, -h * 0.15);
    ctx.lineTo(-w * 0.5, h * 0.15);
    ctx.lineTo(0, h * 0.5);
    ctx.closePath();
    ctx.fillStyle = pal.light;
    ctx.fill();

    // Mặt cắt bên phải (Shadow / Main Facet)
    ctx.beginPath();
    ctx.moveTo(0, -h * 0.5);
    ctx.lineTo(w * 0.5, -h * 0.15);
    ctx.lineTo(w * 0.5, h * 0.15);
    ctx.lineTo(0, h * 0.5);
    ctx.closePath();
    ctx.fillStyle = pal.main;
    ctx.fill();

    // Sống lưng pha lê ở giữa (Ridge line)
    ctx.beginPath();
    ctx.moveTo(0, -h * 0.5);
    ctx.lineTo(0, h * 0.5);
    ctx.strokeStyle = pal.edge;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Viền bao ngoài tinh thể
    ctx.beginPath();
    ctx.moveTo(0, -h * 0.5);
    ctx.lineTo(w * 0.5, -h * 0.15);
    ctx.lineTo(w * 0.5, h * 0.15);
    ctx.lineTo(0, h * 0.5);
    ctx.lineTo(-w * 0.5, h * 0.15);
    ctx.lineTo(-w * 0.5, -h * 0.15);
    ctx.closePath();
    ctx.strokeStyle = pal.edge;
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  /**
   * 2. Viên Kim Cương Giác Cắt 2D (Diamond Gem)
   */
  drawDiamondGem(ctx, size, pal) {
    const w = size * 0.75;
    const h = size * 0.95;

    // Mặt tam giác trên-trái (Sáng nhất)
    ctx.beginPath();
    ctx.moveTo(0, -h * 0.5);
    ctx.lineTo(-w * 0.5, 0);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fillStyle = pal.light;
    ctx.fill();

    // Mặt tam giác trên-phải (Vừa)
    ctx.beginPath();
    ctx.moveTo(0, -h * 0.5);
    ctx.lineTo(w * 0.5, 0);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fillStyle = pal.main;
    ctx.fill();

    // Mặt tam giác dưới-phải (Tối hơn)
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(w * 0.5, 0);
    ctx.lineTo(0, h * 0.5);
    ctx.closePath();
    ctx.fillStyle = pal.dark;
    ctx.fill();

    // Mặt tam giác dưới-trái
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-w * 0.5, 0);
    ctx.lineTo(0, h * 0.5);
    ctx.closePath();
    ctx.fillStyle = pal.main;
    ctx.fill();

    // Viền giác cắt kim cương sắc sảo
    ctx.beginPath();
    ctx.moveTo(0, -h * 0.5);
    ctx.lineTo(w * 0.5, 0);
    ctx.lineTo(0, h * 0.5);
    ctx.lineTo(-w * 0.5, 0);
    ctx.closePath();
    ctx.moveTo(-w * 0.5, 0);
    ctx.lineTo(w * 0.5, 0);
    ctx.moveTo(0, -h * 0.5);
    ctx.lineTo(0, h * 0.5);
    ctx.strokeStyle = pal.edge;
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  /**
   * 3. Viên Pha Lê Lục Giác Đa Diện (Hexagon Gem)
   */
  drawHexagonGem(ctx, size, pal) {
    const r = size * 0.5;
    const innerR = r * 0.5;

    // 6 mặt tam giác bao quanh
    for (let i = 0; i < 6; i++) {
      const a1 = (i * Math.PI) / 3;
      const a2 = ((i + 1) * Math.PI) / 3;

      ctx.beginPath();
      ctx.moveTo(Math.cos(a1) * r, Math.sin(a1) * r);
      ctx.lineTo(Math.cos(a2) * r, Math.sin(a2) * r);
      ctx.lineTo(Math.cos(a2) * innerR, Math.sin(a2) * innerR);
      ctx.lineTo(Math.cos(a1) * innerR, Math.sin(a1) * innerR);
      ctx.closePath();

      ctx.fillStyle = (i % 2 === 0) ? pal.light : (i % 3 === 0 ? pal.dark : pal.main);
      ctx.fill();

      ctx.strokeStyle = pal.edge;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }

    // Mặt bàn giác cắt trung tâm (Table facet)
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      const x = Math.cos(a) * innerR;
      const y = Math.sin(a) * innerR;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = pal.light;
    ctx.fill();
    ctx.strokeStyle = pal.edge;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  /**
   * 4. Ngôi Sao Pha Lê Lấp Lánh 4 Cánh (Prismatic Star Gem)
   */
  drawStarGem(ctx, size, pal) {
    const outer = size * 0.55;
    const inner = size * 0.12;

    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const r = (i % 2 === 0) ? outer : inner;
      const a = (i * Math.PI) / 4;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = pal.light;
    ctx.fill();

    ctx.strokeStyle = pal.edge;
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }
}

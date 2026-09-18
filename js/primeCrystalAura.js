// =========================================================
// tuBIzOne.com - Hiệu Ứng Lưới Mặt Cắt Pha Lê Đa Giác (Prime 6 - 8)
// Cấu trúc: Các phiến pha lê / kim cương giác cắt 4 mặt (Faceted Crystal Diamonds)
// Phủ toàn màn hình, NHÁY LÊN chớp sáng bùng nổ rồi tan biến dứt khoát
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

    this.crystalGems = [];
    this.currentLevel = 6;
    this.startTime = 0;
    this.duration = 650; // Nhanh & dứt khoát

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
    this.buildCrystalMesh();
  }

  /**
   * Xây dựng mạng lưới các khối pha lê giác cắt (Faceted Crystal Gems)
   * Mỗi ô là một hình thoi / kim cương pha lê đa diện gồm 4 mặt cắt hướng tâm (Apex)
   */
  buildCrystalMesh() {
    this.crystalGems = [];

    // Kích thước mỗi khối pha lê từ 60px đến 85px
    const step = Math.max(60, Math.min(85, Math.floor(this.width / 20)));
    const cols = Math.ceil(this.width / step) + 2;
    const rows = Math.ceil(this.height / step) + 2;

    // 1. Tạo ma trận các đỉnh góc (Corners Grid)
    const corners = [];
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        let x = c * step;
        let y = r * step;

        // Làm lệch nhẹ các điểm bên trong để góc pha lê tự nhiên, không cứng nhắc
        if (c > 0 && c < cols - 1) {
          x += Math.sin(c * 13.7 + r * 19.3) * 0.22 * step;
        }
        if (r > 0 && r < rows - 1) {
          y += Math.cos(c * 17.5 + r * 11.2) * 0.22 * step;
        }

        row.push({ x, y });
      }
      corners.push(row);
    }

    // 2. Tạo từng khối pha lê 4 mặt cắt (4-Facet Diamond Gem)
    for (let r = 0; r < rows - 1; r++) {
      for (let c = 0; c < cols - 1; c++) {
        const tl = corners[r][c];
        const tr = corners[r][c + 1];
        const bl = corners[r + 1][c];
        const br = corners[r + 1][c + 1];

        // Đỉnh chóp trung tâm của viên pha lê (Crystal Apex)
        const cx = (tl.x + tr.x + bl.x + br.x) / 4 + Math.sin(r * 3.1 + c * 7.7) * 0.16 * step;
        const cy = (tl.y + tr.y + bl.y + br.y) / 4 + Math.cos(r * 5.3 + c * 2.9) * 0.16 * step;
        const apex = { x: cx, y: cy };

        // Hệ số phản quang và biến thể màu cho viên pha lê này
        const seed = Math.abs(Math.sin(cx * 12.9898 + cy * 78.233));
        const colorVariant = Math.floor(seed * 100) % 6;

        // 4 mặt cắt của viên pha lê (Top, Right, Bottom, Left facets)
        const facets = [
          { pts: [tl, tr, apex], type: 'top' },    // Mặt trên hứng sáng mạnh nhất
          { pts: [tr, br, apex], type: 'right' },  // Mặt phải phản xạ góc nghiêng
          { pts: [br, bl, apex], type: 'bottom' }, // Mặt đáy tông màu trầm đầm
          { pts: [bl, tl, apex], type: 'left' }    // Mặt trái khúc xạ ánh sáng
        ];

        this.crystalGems.push({
          apex,
          facets,
          seed,
          colorVariant
        });
      }
    }
  }

  /**
   * Kích hoạt hiệu ứng NHÁY LÊN của các khối pha lê
   * @param {number} level - Cấp Prime (6, 7, 8)
   */
  trigger(level = 6) {
    if (!this.canvas || !this.ctx) return;
    this.currentLevel = level;

    // Thời lượng hiệu ứng nhanh gọn:
    // Prime 6: 550ms, Prime 7: 650ms, Prime 8: 750ms
    if (level === 6) this.duration = 550;
    else if (level === 7) this.duration = 650;
    else if (level === 8) this.duration = 750;

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

    // Đường cong NHÁY LÊN (FLASH CURVE):
    // 0 -> 0.12 (khoảng 70ms): Bùng sáng chớp nhoáng lên mức cực đại
    // 0.12 -> 0.40: Duy trì độ sáng pha lê lấp lánh
    // 0.40 -> 1.00: Mờ dần và tan biến thanh thoát
    let flashAlpha = 0;
    if (progress < 0.12) {
      flashAlpha = progress / 0.12;
    } else if (progress < 0.4) {
      flashAlpha = 1.0;
    } else {
      const pOut = (progress - 0.4) / 0.6;
      flashAlpha = 1 - Math.pow(pOut, 1.4);
    }

    const level = this.currentLevel;

    // Duyệt qua tất cả các khối pha lê giác cắt
    for (let i = 0; i < this.crystalGems.length; i++) {
      const gem = this.crystalGems[i];
      const apex = gem.apex;
      const seed = gem.seed;
      const variant = gem.colorVariant;

      // Xác định bảng màu cơ sở cho viên pha lê này
      let baseR, baseG, baseB, strokeColor;

      if (level === 8) {
        // === PRIME 8: SẶC SỠ & ĐẸP NHẤT ===
        // Tán sắc lăng kính cầu vồng thần thoại (Prismatic Rainbow Diamond Facets):
        switch (variant) {
          case 0: // Kim cương Vàng Hoàng Gia
            baseR = 255; baseG = 215; baseB = 0;
            break;
          case 1: // Thạch Anh Tím Thần Thoại (Amethyst)
            baseR = 224; baseG = 64; baseB = 251;
            break;
          case 2: // Kim Cương Xanh Cyan Quang Học (Celestial Cyan)
            baseR = 0; baseG = 229; baseB = 255;
            break;
          case 3: // Pha Lê Hồng Ngọc Neon (Neon Ruby)
            baseR = 255; baseG = 64; baseB = 129;
            break;
          case 4: // Ngọc Lục Bảo Tinh Thể (Emerald)
            baseR = 0; baseG = 230; baseB = 118;
            break;
          default: // Kim Cương Lam Sapphire
            baseR = 124; baseG = 77; baseB = 255;
            break;
        }
        strokeColor = `rgba(255, 255, 255, ${(0.3 + seed * 0.45) * flashAlpha})`;

      } else if (level === 7) {
        // === PRIME 7: HỔ PHÁCH & LỬA RỰC RỠ ===
        // Sắc thái lửa vàng cam đậm đà (Amber & Solar Flare Gold)
        if (seed > 0.6) {
          baseR = 255; baseG = 175; baseB = 10;
        } else if (seed > 0.3) {
          baseR = 255; baseG = 120; baseB = 0;
        } else {
          baseR = 255; baseG = 80; baseB = 0;
        }
        strokeColor = `rgba(255, 230, 160, ${(0.25 + seed * 0.35) * flashAlpha})`;

      } else {
        // === PRIME 6: VÀNG HOÀNG KIM THANH NHÃ ===
        // Sắc thái vàng kim citrine tinh khiết, nhẹ nhàng
        if (seed > 0.5) {
          baseR = 255; baseG = 220; baseB = 40;
        } else {
          baseR = 240; baseG = 180; baseB = 20;
        }
        strokeColor = `rgba(255, 240, 180, ${(0.18 + seed * 0.28) * flashAlpha})`;
      }

      // Vẽ 4 mặt cắt của viên pha lê hình thoi (Mỗi mặt cắt có độ sáng khác nhau tạo chiều sâu 3D)
      for (let f = 0; f < gem.facets.length; f++) {
        const facet = gem.facets[f];
        const pts = facet.pts;

        let lumMultiplier = 1;
        let alphaMultiplier = 1;

        if (facet.type === 'top') {
          lumMultiplier = 1.35; // Mặt trên sáng nhất
          alphaMultiplier = 0.72;
        } else if (facet.type === 'left') {
          lumMultiplier = 1.15; // Mặt trái sáng trung bình
          alphaMultiplier = 0.58;
        } else if (facet.type === 'right') {
          lumMultiplier = 0.95; // Mặt phải phản quang
          alphaMultiplier = 0.48;
        } else {
          lumMultiplier = 0.75; // Mặt đáy tối nhất
          alphaMultiplier = 0.36;
        }

        const r = Math.min(255, Math.floor(baseR * lumMultiplier));
        const g = Math.min(255, Math.floor(baseG * lumMultiplier));
        const b = Math.min(255, Math.floor(baseB * lumMultiplier));
        const a = (alphaMultiplier * (0.6 + seed * 0.4)) * flashAlpha;

        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        ctx.lineTo(pts[1].x, pts[1].y);
        ctx.lineTo(pts[2].x, pts[2].y);
        ctx.closePath();

        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
        ctx.fill();

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = level === 8 ? 0.95 : 0.75;
        ctx.stroke();
      }

      // Điểm chóp đỉnh kim cương (Apex Glint) nhấp nháy ở giữa mỗi viên pha lê
      if (progress > 0.08 && progress < 0.45 && seed > 0.45) {
        const glintSize = level === 8 ? 2.2 : 1.5;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(apex.x, apex.y, glintSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
    this.animationId = requestAnimationFrame(() => this.render());
  }
}

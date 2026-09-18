// =========================================================
// tuBIzOne.com - Hiệu Ứng Lưới Tinh Thể Pha Lê Đa Giác (Prime 6 - 8)
// Cấu trúc Low-Poly Faceted Crystal (Mặt cắt pha lê đa giác chuẩn theo ảnh mẫu)
// Chế độ: NHÁY LÊN BÙNG SÁNG TOÀN MÀN HÌNH (Flash) - Nhanh, sắc nét & phân cấp
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

    this.triangles = [];
    this.currentLevel = 6;
    this.startTime = 0;
    this.duration = 650; // Nhanh & dứt khoát: nháy lên chớp sáng rồi tan biến

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
    this.buildMesh();
  }

  /**
   * Xây dựng mạng lưới mặt cắt pha lê đa giác (Low-Poly Crystal Facets)
   * Phủ kín toàn bộ màn hình chuẩn theo hình ảnh mẫu
   */
  buildMesh() {
    this.triangles = [];
    // Bước lưới từ 50px đến 70px tạo độ chi tiết mặt cắt hoàn hảo
    const step = Math.max(50, Math.min(70, Math.floor(this.width / 24)));
    const cols = Math.ceil(this.width / step) + 2;
    const rows = Math.ceil(this.height / step) + 2;

    // Sinh ma trận các điểm tọa độ với độ lệch ngẫu nhiên có trật tự
    const grid = [];
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        let x = c * step;
        let y = r * step;

        // Chỉ làm lệch các điểm bên trong để mép biên màn hình luôn kín khít
        if (c > 0 && c < cols - 1) {
          x += (Math.sin(c * 17.1 + r * 31.7) * 0.42) * step;
        }
        if (r > 0 && r < rows - 1) {
          y += (Math.cos(c * 23.3 + r * 19.5) * 0.42) * step;
        }

        row.push({ x, y });
      }
      grid.push(row);
    }

    // Ghép các điểm thành các tam giác mặt cắt tinh thể (Facets)
    for (let r = 0; r < rows - 1; r++) {
      for (let c = 0; c < cols - 1; c++) {
        const p1 = grid[r][c];
        const p2 = grid[r][c + 1];
        const p3 = grid[r + 1][c];
        const p4 = grid[r + 1][c + 1];

        // 2 tam giác cho mỗi ô lưới
        const triA = [p1, p2, p3];
        const triB = [p2, p4, p3];

        [triA, triB].forEach((pts, idx) => {
          const cx = (pts[0].x + pts[1].x + pts[2].x) / 3;
          const cy = (pts[0].y + pts[1].y + pts[2].y) / 3;
          // Hệ số phản quang cơ sở của từng mặt cắt pha lê
          const seed = Math.abs(Math.sin(cx * 12.9898 + cy * 78.233 + idx * 43.123));
          const colorVariant = Math.floor(seed * 100) % 6;

          this.triangles.push({
            pts,
            cx,
            cy,
            seed,
            colorVariant
          });
        });
      }
    }
  }

  /**
   * Kích hoạt hiệu ứng NHÁY LÊN (Flash) của mạng lưới pha lê đa giác
   * @param {number} level - Cấp Prime (6, 7, 8)
   */
  trigger(level = 6) {
    if (!this.canvas || !this.ctx) return;
    this.currentLevel = level;

    // Thời lượng hiệu ứng nhanh & dứt khoát:
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

    // Duyệt qua tất cả các mặt cắt đa giác tam giác phủ toàn màn hình
    for (let i = 0; i < this.triangles.length; i++) {
      const tri = this.triangles[i];
      const pts = tri.pts;
      const seed = tri.seed;
      const variant = tri.colorVariant;

      let r, g, b, a, strokeStyle;

      if (level === 8) {
        // === PRIME 8: SẶC SỠ & ĐẸP NHẤT ===
        // Tán sắc lăng kính cầu vồng thần thoại (Prismatic Rainbow Diamond Facets):
        // Các mặt cắt đan xen đa sắc lộng lẫy (vàng kim, tím thần thoại, xanh cyan, hồng neon, ngọc lục bảo, trắng tuyết)
        switch (variant) {
          case 0: // Vàng Kim Hoàng Gia
            r = 255; g = 215; b = 0;
            break;
          case 1: // Tím Thần Thoại (Amethyst)
            r = 224; g = 64; b = 251;
            break;
          case 2: // Xanh Cyan Quang Học (Celestial Cyan)
            r = 0; g = 229; b = 255;
            break;
          case 3: // Hồng Ngọc Neon (Neon Ruby)
            r = 255; g = 64; b = 129;
            break;
          case 4: // Ngọc Lục Bảo (Emerald)
            r = 0; g = 230; b = 118;
            break;
          default: // Ánh Kim Cương Trắng Tuyết
            r = 255; g = 250; b = 230;
            break;
        }

        // Độ đậm nhạt từng mặt cắt theo hệ số phản quang
        if (seed > 0.75) {
          a = (0.55 + seed * 0.25) * flashAlpha; // Mặt cắt chói sáng
        } else if (seed > 0.4) {
          a = (0.35 + seed * 0.2) * flashAlpha;
        } else {
          a = (0.2 + seed * 0.15) * flashAlpha;  // Mặt cắt chìm
        }

        // Đường viền mặt cắt phát sáng kim cương
        const strokeA = (0.25 + seed * 0.4) * flashAlpha;
        strokeStyle = `rgba(255, 255, 255, ${strokeA.toFixed(3)})`;

      } else if (level === 7) {
        // === PRIME 7: HỔ PHÁCH & LỬA RỰC RỠ ===
        // Sắc thái lửa vàng cam đậm đà (Amber & Solar Flare Gold Facets)
        if (seed > 0.7) {
          r = 255; g = 240; b = 140; a = 0.65 * flashAlpha; // Vàng ánh dương rực sáng
        } else if (seed > 0.4) {
          r = 255; g = 150; b = 15; a = 0.52 * flashAlpha;  // Cam hổ phách đậm
        } else if (seed > 0.2) {
          r = 215; g = 90; b = 5; a = 0.38 * flashAlpha;   // Đỏ cam lửa
        } else {
          r = 140; g = 50; b = 0; a = 0.25 * flashAlpha;   // Đồng đậm sẫm
        }

        const strokeA = (0.2 + seed * 0.35) * flashAlpha;
        strokeStyle = `rgba(255, 220, 140, ${strokeA.toFixed(3)})`;

      } else {
        // === PRIME 6: VÀNG HOÀNG KIM THANH NHÃ ===
        // Sắc thái vàng kim citrine tinh khiết, nhẹ nhàng (Citrine Gold Facets)
        if (seed > 0.7) {
          r = 255; g = 235; b = 120; a = 0.52 * flashAlpha; // Vàng sáng
        } else if (seed > 0.4) {
          r = 245; g = 190; b = 30; a = 0.38 * flashAlpha;  // Vàng hoàng kim
        } else if (seed > 0.18) {
          r = 195; g = 135; b = 15; a = 0.26 * flashAlpha;  // Vàng đồng
        } else {
          r = 125; g = 75; b = 8; a = 0.16 * flashAlpha;   // Nền trầm
        }

        const strokeA = (0.15 + seed * 0.25) * flashAlpha;
        strokeStyle = `rgba(255, 235, 160, ${strokeA.toFixed(3)})`;
      }

      // Vẽ mặt cắt tam giác đa giác
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      ctx.lineTo(pts[1].x, pts[1].y);
      ctx.lineTo(pts[2].x, pts[2].y);
      ctx.closePath();

      // Đổ màu mặt cắt
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
      ctx.fill();

      // Vẽ đường viền cạnh đa giác sắc sảo (Tạo hình các mặt cắt đa giác chuẩn ảnh mẫu)
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = level === 8 ? 1.0 : 0.8;
      ctx.stroke();
    }

    ctx.restore();
    this.animationId = requestAnimationFrame(() => this.render());
  }
}

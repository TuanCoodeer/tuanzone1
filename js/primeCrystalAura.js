// =========================================================
// tuBIzOne.com - Hiệu Ứng Lưới Đa Giác Tinh Thể Vàng Ánh Kim (Prime 6 - 8)
// Cấu trúc Low-Poly Faceted Crystal phản quang kim cương theo chuẩn giao diện VIP
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
    this.duration = 2000; // 2 giây cho một chu kỳ tỏa sáng

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
   * Xây dựng mạng lưới tam giác đa giác (Low-Poly Crystal Mesh)
   * Tương thích hoàn hảo với hoa văn mặt cắt tinh thể trong game
   */
  buildMesh() {
    this.triangles = [];
    const step = Math.max(55, Math.min(75, Math.floor(this.width / 22)));
    const cols = Math.ceil(this.width / step) + 2;
    const rows = Math.ceil(this.height / step) + 2;

    // Sinh ma trận các điểm với độ lệch ngẫu nhiên có kiểm soát
    const grid = [];
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        let x = c * step;
        let y = r * step;

        // Chỉ làm lệch các điểm bên trong để mép màn hình luôn kín khít
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

    // Kết nối các điểm thành các tam giác mặt cắt (Facets)
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
          // Hệ số phản quang cơ sở của từng mặt cắt
          const seed = Math.abs(Math.sin(cx * 12.9898 + cy * 78.233 + idx * 43.123));

          this.triangles.push({
            pts,
            cx,
            cy,
            seed
          });
        });
      }
    }
  }

  /**
   * Kích hoạt hiệu ứng chớp lưới tinh thể đa giác theo cấp Prime
   * @param {number} level - Cấp Prime (6, 7, 8)
   */
  trigger(level = 6) {
    if (!this.canvas || !this.ctx) return;
    this.currentLevel = level;
    this.startTime = performance.now();

    // Thời lượng hiệu ứng tùy theo cấp độ Prime
    if (level === 6) this.duration = 1800;
    else if (level === 7) this.duration = 2100;
    else if (level === 8) this.duration = 2400;

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

    // Tính đường cong độ mờ: Vào nhanh (0 -> 0.15), sáng rực rỡ, rồi tan biến dần
    let masterAlpha = 0;
    if (progress < 0.15) {
      masterAlpha = progress / 0.15;
    } else if (progress < 0.5) {
      masterAlpha = 1;
    } else {
      masterAlpha = 1 - Math.pow((progress - 0.5) / 0.5, 1.5);
    }

    // Tọa độ nguồn sáng quét qua mặt cắt kim cương
    const sweepX = (progress * 1.6 - 0.3) * this.width;
    const sweepY = (progress * 1.5 - 0.25) * this.height;
    const lightRadius = Math.max(this.width, this.height) * 0.75;

    // Bảng màu cho từng cấp Prime
    const isP6 = this.currentLevel === 6;
    const isP7 = this.currentLevel === 7;
    const isP8 = this.currentLevel === 8;

    for (let i = 0; i < this.triangles.length; i++) {
      const tri = this.triangles[i];
      const pts = tri.pts;

      // Khoảng cách từ tâm tam giác đến nguồn sáng quét
      const dx = tri.cx - sweepX;
      const dy = tri.cy - sweepY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const lightFactor = Math.max(0, 1 - dist / lightRadius);

      // Kết hợp giữa độ phản quang cơ sở của mặt cắt + nguồn sáng quét qua
      const facetShine = Math.pow((tri.seed * 0.5 + lightFactor * 0.5), 1.8);

      // Tính màu sắc vàng ánh kim đa giác
      let r, g, b, a, strokeA;

      if (isP8) {
        // Prime 8: Tinh thể Kim Cương Vàng Hoàng Gia (Mythic Diamond Gold)
        if (facetShine > 0.75) {
          r = 255; g = 250; b = 220; a = 0.78 * masterAlpha; // Điểm phản quang chói sáng
        } else if (facetShine > 0.45) {
          r = 255; g = 215; b = 30; a = 0.65 * masterAlpha;  // Vàng rực kim loại
        } else if (facetShine > 0.2) {
          r = 220; g = 145; b = 10; a = 0.48 * masterAlpha;  // Cam hổ phách
        } else {
          r = 135; g = 75; b = 5; a = 0.32 * masterAlpha;    // Đồng sẫm
        }
        strokeA = (0.2 + facetShine * 0.45) * masterAlpha;
      } else if (isP7) {
        // Prime 7: Tinh thể Ánh Dương Lửa (Solar Amber Gold)
        if (facetShine > 0.72) {
          r = 255; g = 238; b = 140; a = 0.72 * masterAlpha;
        } else if (facetShine > 0.42) {
          r = 255; g = 180; b = 20; a = 0.58 * masterAlpha;
        } else if (facetShine > 0.18) {
          r = 210; g = 120; b = 8; a = 0.42 * masterAlpha;
        } else {
          r = 120; g = 60; b = 4; a = 0.28 * masterAlpha;
        }
        strokeA = (0.16 + facetShine * 0.38) * masterAlpha;
      } else {
        // Prime 6: Tinh thể Vàng Hoàng Kim (Golden Facet Mesh)
        if (facetShine > 0.7) {
          r = 255; g = 230; b = 120; a = 0.65 * masterAlpha;
        } else if (facetShine > 0.4) {
          r = 245; g = 175; b = 25; a = 0.5 * masterAlpha;
        } else if (facetShine > 0.15) {
          r = 190; g = 110; b = 10; a = 0.35 * masterAlpha;
        } else {
          r = 110; g = 55; b = 5; a = 0.22 * masterAlpha;
        }
        strokeA = (0.12 + facetShine * 0.32) * masterAlpha;
      }

      // Vẽ hình tam giác đa giác
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      ctx.lineTo(pts[1].x, pts[1].y);
      ctx.lineTo(pts[2].x, pts[2].y);
      ctx.closePath();

      // Đổ màu mặt cắt
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
      ctx.fill();

      // Vẽ đường viền cạnh tinh thể mỏng sắc nét (Tạo hiệu ứng lưới 3D đặc trưng)
      ctx.strokeStyle = `rgba(255, 240, 160, ${strokeA.toFixed(3)})`;
      ctx.lineWidth = 0.75;
      ctx.stroke();
    }

    ctx.restore();
    this.animationId = requestAnimationFrame(() => this.render());
  }
}

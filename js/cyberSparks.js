// =========================================================
// tuBIzOne.com - Hiệu Ứng Phong Thủy Cyber Sparks & Neon Embers
// Hạt năng lượng Gaming & Ánh sáng Tài Lộc bay bổng lơ lửng
// =========================================================

export class CyberSparks {
  constructor(canvasId = 'cyber-sparks-canvas') {
    this.canvasId = canvasId;
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.animationFrameId = null;
    this.isRunning = false;
    this.width = 0;
    this.height = 0;
    this.dpr = 1;

    // Bảng màu phong thủy Cyber Gaming: Vàng Hoàng Kim, Xanh Cyan Năng Lượng, Cam Lửa Chiến Đấu, Tím Thần Thoại
    this.colorPalettes = [
      // 1. Vàng Hoàng Kim (Tài Lộc, May Mắn, Kim Cương)
      { r: 255, g: 215, b: 0, glowR: 255, glowG: 180, glowB: 0 },
      // 2. Xanh Cyan Cyber (Công Nghệ, Esports, Tốc Độ)
      { r: 0, g: 240, b: 255, glowR: 0, glowG: 140, glowB: 255 },
      // 3. Cam Lửa Gaming (Chiến Binh Free Fire, Nhiệt Huyết)
      { r: 255, g: 110, b: 20, glowR: 255, glowG: 60, glowB: 0 },
      // 4. Xanh Điện Tử (Electric Blue, Uy Lực)
      { r: 30, g: 144, b: 255, glowR: 0, glowG: 100, glowB: 255 },
      // 5. Tím Thần Thoại (Mythic Skin, Huyền Bí)
      { r: 200, g: 120, b: 255, glowR: 150, glowG: 50, glowB: 255 }
    ];

    this.init();
  }

  init() {
    this.canvas = document.getElementById(this.canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    if (!this.ctx) return;

    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.resize();

    // Khởi tạo danh sách hạt
    this.createParticles();

    // Lắng nghe sự kiện đổi kích thước màn hình
    window.addEventListener('resize', () => {
      this.resize();
    });

    // Tiết kiệm CPU/Pin: Tự động tạm dừng khi chuyển sang tab khác
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.stop();
      } else {
        this.start();
      }
    });

    this.start();
  }

  resize() {
    if (!this.canvas) return;
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    this.ctx.scale(this.dpr, this.dpr);
  }

  createParticles() {
    // Tối ưu số lượng hạt: 42 hạt trên Desktop, 20 hạt trên Mobile để chạy siêu mượt 60fps
    const isMobile = window.innerWidth < 768;
    const count = isMobile ? 22 : 42;
    this.particles = [];

    for (let i = 0; i < count; i++) {
      this.particles.push(this.createSingleParticle(true));
    }
  }

  createSingleParticle(initialScatter = false) {
    const palette = this.colorPalettes[Math.floor(Math.random() * this.colorPalettes.length)];
    const isStar = Math.random() < 0.28; // 28% là ngôi sao 4 cánh lấp lánh

    return {
      x: Math.random() * this.width,
      baseX: Math.random() * this.width,
      // Nếu là lần đầu thì rải đều màn hình, các lần sau thì xuất phát từ đáy màn hình bay lên
      y: initialScatter ? Math.random() * this.height : this.height + Math.random() * 60,
      radius: isStar ? (Math.random() * 2.5 + 2.5) : (Math.random() * 2.2 + 1.2),
      speedY: -(Math.random() * 0.55 + 0.35), // Tốc độ bay lên êm dịu, thư thả
      swaySpeed: Math.random() * 0.015 + 0.008, // Tần số lắc lư ngang
      swayRange: Math.random() * 35 + 15, // Biên độ lượn sóng ngang
      swayAngle: Math.random() * Math.PI * 2,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.02,
      opacity: Math.random() * 0.4 + 0.2,
      maxOpacity: Math.random() * 0.45 + 0.45,
      pulseSpeed: Math.random() * 0.025 + 0.012,
      pulseAngle: Math.random() * Math.PI * 2,
      isStar: isStar,
      color: palette
    };
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.animate();
  }

  stop() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  animate() {
    if (!this.isRunning) return;

    this.ctx.clearRect(0, 0, this.width, this.height);

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // Cập nhật vị trí bay lên & lắc lư sóng nước
      p.y += p.speedY;
      p.swayAngle += p.swaySpeed;
      p.x = p.baseX + Math.sin(p.swayAngle) * p.swayRange;
      p.rotation += p.rotationSpeed;

      // Hiệu ứng nhấp nháy phát quang
      p.pulseAngle += p.pulseSpeed;
      const currentOpacity = Math.max(0, Math.min(1, p.maxOpacity * (0.65 + 0.35 * Math.sin(p.pulseAngle))));

      // Giảm mờ dần khi chạm đỉnh màn hình (100px trên cùng)
      let finalAlpha = currentOpacity;
      if (p.y < 120) {
        finalAlpha = currentOpacity * Math.max(0, p.y / 120);
      }

      // Vẽ hạt lên màn hình
      if (finalAlpha > 0.01) {
        const { r, g, b, glowR, glowG, glowB } = p.color;

        if (p.isStar) {
          // Vẽ Ngôi Sao Năng Lượng Cyber 4 Cánh (Four-point star)
          this.drawSparkStar(p.x, p.y, p.radius, p.rotation, r, g, b, glowR, glowG, glowB, finalAlpha);
        } else {
          // Vẽ Tinh Thể Năng Lượng Neon (Glowing Orb with halo)
          this.drawGlowingOrb(p.x, p.y, p.radius, r, g, b, glowR, glowG, glowB, finalAlpha);
        }
      }

      // Tái tạo lại hạt khi đã bay lên khỏi màn hình
      if (p.y < -30) {
        this.particles[i] = this.createSingleParticle(false);
      }
    }

    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }

  drawGlowingOrb(x, y, radius, r, g, b, glowR, glowG, glowB, alpha) {
    const ctx = this.ctx;
    const glowRadius = radius * 3.5;

    const grad = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
    grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha * 0.95})`);
    grad.addColorStop(0.35, `rgba(${glowR}, ${glowG}, ${glowB}, ${alpha * 0.5})`);
    grad.addColorStop(1, `rgba(${glowR}, ${glowG}, ${glowB}, 0)`);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    // Hạt lõi phát sáng trắng rực rỡ ở giữa
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.65, 0, Math.PI * 2);
    ctx.fill();
  }

  drawSparkStar(x, y, radius, rotation, r, g, b, glowR, glowG, glowB, alpha) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    // Vầng sáng hào quang xung quanh ngôi sao
    const glowRadius = radius * 3.2;
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, glowRadius);
    grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha * 0.7})`);
    grad.addColorStop(1, `rgba(${glowR}, ${glowG}, ${glowB}, 0)`);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    // Vẽ hình ngôi sao 4 cánh Cyber sắc sảo
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
    ctx.beginPath();
    const rOuter = radius * 2.2;
    const rInner = radius * 0.45;

    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      ctx.lineTo(Math.cos(angle) * rOuter, Math.sin(angle) * rOuter);
      ctx.lineTo(Math.cos(angle + Math.PI / 4) * rInner, Math.sin(angle + Math.PI / 4) * rInner);
    }
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}

// Khởi tạo tiện ích hiệu ứng tự động
export function initCyberSparks() {
  if (typeof window === 'undefined') return null;
  return new CyberSparks('cyber-sparks-canvas');
}

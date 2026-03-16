// ============================================================================
// effects.js — Particle system, gradient mesh animation, document scan effect
// ============================================================================

// ---------- Particle System ----------
class ParticleSystem {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.mouse = { x: null, y: null };
    this.maxParticles = 90;
    this.connectionDistance = 140;
    this.animationId = null;
    this._active = true;

    this.resize();
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });

    this.init();
    this.animate();
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  init() {
    this.particles = [];
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push(this.createParticle());
    }
  }

  createParticle() {
    const colors = [
      'rgba(139, 92, 246, ',   // purple
      'rgba(6, 182, 212, ',    // cyan
      'rgba(59, 130, 246, ',   // blue
      'rgba(20, 184, 166, ',   // teal
      'rgba(236, 72, 153, ',   // pink
    ];
    return {
      x: Math.random() * this.canvas.width,
      y: Math.random() * this.canvas.height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      radius: Math.random() * 1.8 + 0.4,
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: Math.random() * 0.5 + 0.15,
      pulsePhase: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.018 + 0.008,
    };
  }

  animate() {
    if (!this._active) return;
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // Pulse opacity
      p.pulsePhase += p.pulseSpeed;
      const pulse = Math.sin(p.pulsePhase) * 0.15 + 0.85;

      // Move
      p.x += p.vx;
      p.y += p.vy;

      // Mouse attraction (subtle)
      if (this.mouse.x !== null) {
        const dx = this.mouse.x - p.x;
        const dy = this.mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 220) {
          p.vx += dx * 0.000025;
          p.vy += dy * 0.000025;
        }
      }

      // Soft speed limit
      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (speed > 0.8) {
        p.vx = (p.vx / speed) * 0.8;
        p.vy = (p.vy / speed) * 0.8;
      }

      // Damping
      p.vx *= 0.999;
      p.vy *= 0.999;

      // Wrap edges
      if (p.x < -10) p.x = canvas.width + 10;
      if (p.x > canvas.width + 10) p.x = -10;
      if (p.y < -10) p.y = canvas.height + 10;
      if (p.y > canvas.height + 10) p.y = -10;

      // Draw particle
      const alpha = p.opacity * pulse;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color + alpha + ')';
      ctx.fill();

      // Soft glow halo
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 3.5, 0, Math.PI * 2);
      ctx.fillStyle = p.color + (alpha * 0.12) + ')';
      ctx.fill();
    }

    // Draw connections between close particles
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const a = this.particles[i];
        const b = this.particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.connectionDistance) {
          const opacity = (1 - dist / this.connectionDistance) * 0.12;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(139, 92, 246, ${opacity})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    // Mouse connections
    if (this.mouse.x !== null) {
      for (const p of this.particles) {
        const dx = this.mouse.x - p.x;
        const dy = this.mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 160) {
          const opacity = (1 - dist / 160) * 0.25;
          ctx.beginPath();
          ctx.moveTo(this.mouse.x, this.mouse.y);
          ctx.lineTo(p.x, p.y);
          ctx.strokeStyle = `rgba(6, 182, 212, ${opacity})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }

    this.animationId = requestAnimationFrame(() => this.animate());
  }

  destroy() {
    this._active = false;
    if (this.animationId) cancelAnimationFrame(this.animationId);
  }
}


// ---------- Gradient Mesh Animator ----------
class GradientMeshAnimator {
  constructor() {
    this.blobs = document.querySelectorAll('.mesh-blob');
    this.time = 0;
    this._active = true;
    if (this.blobs.length) this.animate();
  }

  animate() {
    if (!this._active) return;
    this.time += 0.004;
    this.blobs.forEach((blob, i) => {
      const offsetX = Math.sin(this.time + i * 1.4) * 18;
      const offsetY = Math.cos(this.time * 0.72 + i * 2) * 12;
      const scale = 1 + Math.sin(this.time * 0.45 + i) * 0.06;
      blob.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
    });
    requestAnimationFrame(() => this.animate());
  }

  destroy() { this._active = false; }
}


// ---------- Document Scan Effect ----------
export function triggerScanEffect(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  let scanLine = container.querySelector('.scan-line');
  if (!scanLine) {
    scanLine = document.createElement('div');
    scanLine.className = 'scan-line';
    container.appendChild(scanLine);
  }

  let overlay = container.querySelector('.scan-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'scan-overlay';
    container.appendChild(overlay);
  }

  container.classList.add('scan-container');
  scanLine.classList.remove('scanning');
  overlay.classList.remove('active');

  void scanLine.offsetWidth; // Force reflow

  scanLine.classList.add('scanning');
  overlay.classList.add('active');

  setTimeout(() => {
    scanLine.classList.remove('scanning');
    overlay.classList.remove('active');
  }, 2800);
}


// ---------- Animated Counter ----------
export function animateCounter(element, target, duration = 1800, suffix = '') {
  if (!element) return;
  const startTime = performance.now();
  const isFloat = String(target).includes('.');
  const decimals = isFloat ? 1 : 0;

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease-out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = target * eased;
    element.textContent = current.toFixed(decimals) + suffix;
    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}


// ---------- Stagger Fade-in ----------
export function staggerFadeIn(selector, delay = 100) {
  const elements = document.querySelectorAll(selector);
  elements.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = '';
    setTimeout(() => {
      el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, i * delay + 50);
  });
}


// ---------- Init Effects ----------
let particleSystem = null;
let meshAnimator = null;

export function initEffects() {
  particleSystem = new ParticleSystem('particle-canvas');
  meshAnimator = new GradientMeshAnimator();
}

export function destroyEffects() {
  if (particleSystem) particleSystem.destroy();
  if (meshAnimator) meshAnimator.destroy();
}

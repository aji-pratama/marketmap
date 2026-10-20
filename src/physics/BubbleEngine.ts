import { CryptoCoin, Timeframe, SizeByMetric, ContentDisplay, Currency, ColorMode, PhysicsSettings, ThemeMode } from '../types/crypto';
import { formatPrice, formatPercent, formatNumber } from '../data/cryptoData';
import { sound } from '../utils/audio';
import { getBubbleIconDataUrl } from '../components/BubbleIcon';
import { loadCryptoCanvasIcon } from '../utils/cryptoIcons';

export interface BubbleEntity {
  coin: CryptoCoin;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  targetRadius: number;
  lerpRate: number;
  isHovered: boolean;
  isDragging: boolean;

  // Fully asynchronous & random wandering kinematics
  heading: number;
  turnRate: number;
  cruiseSpeed: number;
  impulseTimer: number;
  breathPhase: number;
  breathFreq: number;
  breathAmp: number;

  // Organic liquid bubble wobble & surface tension dynamics
  wobblePhase: number;
  wobbleFreq: number;
  wobbleAmp: number;
  wobbleAngle: number;

  // Natural organic resting lean & dynamic roll tilt for apples
  restTilt: number;
  currentTilt: number;
}

export class BubbleSimulation {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animFrameId: number | null = null;
  private lastTime: number = 0;
  private iconCache: Map<string, HTMLImageElement> = new Map();
  public theme: ThemeMode = 'dark';

  public bubbles: BubbleEntity[] = [];
  public coins: CryptoCoin[] = [];

  // Configuration
  public timeframe: Timeframe = '1D';
  public sizeBy: SizeByMetric = 'performance';
  public contentDisplay: ContentDisplay = 'performance';
  public currency: Currency = 'IDR';
  public colorMode: ColorMode = 'classic';
  public physics: PhysicsSettings;
  public favorites: Set<string> = new Set();

  // Callbacks
  public onSelectCoin: (coin: CryptoCoin) => void = () => { };
  public onHoverCoin: (coin: CryptoCoin | null) => void = () => { };

  // Dragging state
  private draggedBubble: BubbleEntity | null = null;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private dragHasMoved: boolean = false;
  private mouseX: number = -1000;
  private mouseY: number = -1000;
  private prevMouseX: number = 0;
  private prevMouseY: number = 0;
  private mouseSpeedX: number = 0;
  private mouseSpeedY: number = 0;

  constructor(canvas: HTMLCanvasElement, physics: PhysicsSettings) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Failed to get 2d canvas context');
    this.ctx = context;
    this.physics = physics;

    this.setupListeners();
  }

  public setCoins(coins: CryptoCoin[]) {
    this.coins = coins;
    this.syncBubbles(true);
  }

  /**
   * Smoothly update price and performance numbers of existing bubbles without
   * teleporting positions or triggering sudden overlap snaps.
   */
  public updateCoinData(coins: CryptoCoin[]) {
    this.coins = coins;
    const bySymbol = new Map(coins.map((c) => [c.symbol.toUpperCase(), c]));
    const byId = new Map(coins.map((c) => [c.id.toLowerCase(), c]));

    for (const b of this.bubbles) {
      const fresh = bySymbol.get(b.coin.symbol.toUpperCase()) || byId.get(b.coin.id.toLowerCase());
      if (fresh) {
        b.coin = fresh;
      }
    }
    // Smoothly recalculate target radii without positional jerking
    this.recalculateTargetRadii(false);
  }

  public searchQuery: string = '';

  public updateConfig(
    timeframe: Timeframe,
    sizeBy: SizeByMetric,
    contentDisplay: ContentDisplay,
    currency: Currency,
    colorMode: ColorMode,
    physics: PhysicsSettings,
    favorites: string[],
    theme?: ThemeMode,
    searchQuery: string = ''
  ) {
    const sizeByChanged = this.sizeBy !== sizeBy || this.timeframe !== timeframe;
    this.timeframe = timeframe;
    this.sizeBy = sizeBy;
    this.contentDisplay = contentDisplay;
    this.currency = currency;
    this.colorMode = colorMode;
    this.physics = physics;
    this.favorites = new Set(
      favorites.flatMap((f) => [f.toLowerCase(), f.toUpperCase()])
    );
    if (theme) this.theme = theme;
    this.searchQuery = searchQuery.trim().toLowerCase();

    // Only resolve overlaps if the sizing metric itself changed
    this.recalculateTargetRadii(sizeByChanged);
  }


  public viewMode: 'bubbles' | 'apples' = 'bubbles';

  public setViewMode(mode: 'bubbles' | 'apples') {
    if (this.viewMode === mode) return;
    this.viewMode = mode;
    for (const b of this.bubbles) {
      if (mode === 'apples') {
        b.vx = (Math.random() - 0.5) * 0.8;
        b.vy = Math.random() * 0.5;
      } else {
        // Floating upward and blooming across the screen
        b.vx = (Math.random() - 0.5) * 1.8;
        b.vy = -Math.random() * 2.2 - 0.5;
      }
    }
    this.resolveAllOverlaps(30);
  }

  /**
   * Complete multi-pass circle separation to guarantee NO overlaps between bubbles/apples.
   */
  public resolveAllOverlaps(iterations: number = 30) {
    if (this.bubbles.length < 2) return;
    const width = this.canvas.width / (window.devicePixelRatio || 1);
    const height = this.canvas.height / (window.devicePixelRatio || 1);
    const len = this.bubbles.length;
    const padding = 1.0;

    for (let iter = 0; iter < iterations; iter++) {
      for (let i = 0; i < len; i++) {
        const b1 = this.bubbles[i];
        for (let j = i + 1; j < len; j++) {
          const b2 = this.bubbles[j];
          const dx = b2.x - b1.x;
          const dy = b2.y - b1.y;
          const distSq = dx * dx + dy * dy;
          const r1 = b1.targetRadius || b1.radius;
          const r2 = b2.targetRadius || b2.radius;
          const minDist = r1 + r2 + padding;

          if (distSq < minDist * minDist) {
            let dist = Math.sqrt(distSq);
            let nx = 0;
            let ny = -1;
            if (dist < 0.001) {
              nx = Math.random() - 0.5;
              ny = Math.random() - 0.5;
              const nl = Math.hypot(nx, ny) || 1;
              nx /= nl;
              ny /= nl;
            } else {
              nx = dx / dist;
              ny = dy / dist;
            }
            const overlap = minDist - dist;
            const m1 = r1 * r1;
            const m2 = r2 * r2;
            const totalM = m1 + m2;
            const sep1 = (m2 / totalM) * overlap;
            const sep2 = (m1 / totalM) * overlap;

            b1.x -= nx * sep1;
            b1.y -= ny * sep1;
            b2.x += nx * sep2;
            b2.y += ny * sep2;
          }
        }
      }

      // Constrain inside bounds
      for (let i = 0; i < len; i++) {
        const b = this.bubbles[i];
        const r = b.targetRadius || b.radius;
        const pad = r + 1.5;
        if (b.x < pad) b.x = pad;
        else if (b.x > width - pad) b.x = width - pad;
        if (b.y < pad) b.y = pad;
        else if (b.y > height - pad) b.y = height - pad;
      }
    }
  }

  private syncBubbles(resolveOverlaps = true) {
    const existingMap = new Map<string, BubbleEntity>();
    for (const b of this.bubbles) {
      existingMap.set(b.coin.id.toLowerCase(), b);
      existingMap.set(b.coin.symbol.toUpperCase(), b);
    }

    const width = this.canvas.width / (window.devicePixelRatio || 1);
    const height = this.canvas.height / (window.devicePixelRatio || 1);

    const newBubbles: BubbleEntity[] = [];
    const countToSpawn = Math.min(this.coins.length, this.physics.bubbleCount);

    // Calculate grid dimensions for clean initial dispersal
    const cols = Math.ceil(Math.sqrt(countToSpawn * (width / Math.max(1, height))));
    const rows = Math.ceil(countToSpawn / cols);
    const cellW = width / Math.max(1, cols);
    const cellH = height / Math.max(1, rows);

    for (let i = 0; i < countToSpawn; i++) {
      const coin = this.coins[i];
      const existing = existingMap.get(coin.id.toLowerCase()) || existingMap.get(coin.symbol.toUpperCase());

      if (existing) {
        existing.coin = coin;
        newBubbles.push(existing);
      } else {
        // Disperse along grid cells with jitter to prevent initial pileup
        const c = i % cols;
        const r = Math.floor(i / cols);
        const pad = 25;
        const baseX = (c + 0.5) * cellW;
        const baseY = (r + 0.5) * cellH;
        const jitterX = (Math.random() - 0.5) * cellW * 0.45;
        const jitterY = (Math.random() - 0.5) * cellH * 0.45;
        const x = Math.max(pad, Math.min(width - pad, baseX + jitterX));
        const y = Math.max(pad, Math.min(height - pad, baseY + jitterY));

        newBubbles.push({
          coin,
          x,
          y,
          vx: (Math.random() - 0.5) * 0.8,
          vy: (Math.random() - 0.5) * 0.8,
          radius: 24,
          targetRadius: 48,
          lerpRate: 0.04 + Math.random() * 0.04,
          isHovered: false,
          isDragging: false,
          heading: Math.random() * Math.PI * 2,
          turnRate: (Math.random() - 0.5) * 0.035,
          cruiseSpeed: 0.25 + Math.random() * 0.6,
          impulseTimer: 800 + Math.random() * 2500,
          breathPhase: Math.random() * Math.PI * 2,
          breathFreq: 0.015 + Math.random() * 0.025,
          breathAmp: 0.4 + Math.random() * 1.0,
          wobblePhase: Math.random() * Math.PI * 2,
          wobbleFreq: 0.045 + Math.random() * 0.04,
          wobbleAmp: 0.025 + Math.random() * 0.02,
          wobbleAngle: Math.random() * Math.PI * 2,
          restTilt: (((i * 37) % 21) - 10) * (Math.PI / 180), // -10 to +10 deg organic lean
          currentTilt: (((i * 37) % 21) - 10) * (Math.PI / 180),
        });
      }
    }

    this.bubbles = newBubbles;
    this.recalculateTargetRadii(resolveOverlaps);
  }

  /**
   * Bring a specific coin's bubble to the top rendering layer (index = length - 1)
   */
  public bringToFront(coinId: string) {
    const idx = this.bubbles.findIndex(
      (b) => b.coin.id.toLowerCase() === coinId.toLowerCase() || b.coin.symbol.toLowerCase() === coinId.toLowerCase()
    );
    if (idx !== -1 && idx !== this.bubbles.length - 1) {
      const [bubble] = this.bubbles.splice(idx, 1);
      this.bubbles.push(bubble);
    }
  }

  public recalculateTargetRadii(resolveOverlaps = false) {
    if (this.bubbles.length === 0) return;

    const width = this.canvas.width / (window.devicePixelRatio || 1);
    const height = this.canvas.height / (window.devicePixelRatio || 1);
    const area = width * height;
    const isMobile = width < 640;
    const isTablet = width >= 640 && width < 1024;

    // Responsive area coverage strictly in the 70% - 80% screen range:
    const fillRatio = isMobile ? 0.72 : (isTablet ? 0.75 : 0.77);
    const totalTargetCircleArea = area * fillRatio;
    const count = this.bubbles.length;

    // 1. Calculate proportional statistical weight for each coin according to active metric
    const weights: number[] = new Array(count);

    if (this.sizeBy === 'performance') {
      const absChanges = this.bubbles.map((b) => Math.abs(b.coin.changes[this.timeframe] || 0));
      const sorted = [...absChanges].sort((a, b) => a - b);
      const minVal = sorted[0] || 0;
      const maxVal = sorted[sorted.length - 1] || 1;

      // 10th and 90th percentile normalization to handle extreme meme coin spikes
      const p10 = sorted[Math.floor(sorted.length * 0.10)] || minVal;
      const p90 = sorted[Math.floor(sorted.length * 0.90)] || maxVal;
      const range = Math.max(0.5, p90 - p10);

      for (let i = 0; i < count; i++) {
        const val = absChanges[i];
        const norm = Math.max(0, Math.min(2.0, (val - p10) / range));
        weights[i] = 1.0 + 3.2 * Math.pow(norm, 0.75);
      }
    } else {
      // Market Cap or 24h Volume: Logarithmic scaling
      const values = this.bubbles.map((b) =>
        Math.max(1000, this.sizeBy === 'market_cap' ? b.coin.marketCap : b.coin.volume24h)
      );
      const logValues = values.map((v) => Math.log10(v));
      const minLog = Math.min(...logValues);
      const maxLog = Math.max(...logValues);
      const range = maxLog - minLog || 1;

      for (let i = 0; i < count; i++) {
        const norm = Math.max(0, Math.min(1, (logValues[i] - minLog) / range));
        weights[i] = 1.0 + 4.2 * Math.pow(norm, 1.15);
      }
    }

    // 2. Distribute totalTargetCircleArea proportionally across all bubbles
    const totalWeight = weights.reduce((acc, w) => acc + w, 0) || 1;
    const rawRadii: number[] = new Array(count);

    for (let i = 0; i < count; i++) {
      const bubbleArea = totalTargetCircleArea * (weights[i] / totalWeight);
      rawRadii[i] = Math.sqrt(bubbleArea / Math.PI);
    }

    // 3. Enforce responsive readable minimum and viewport maximum bounds
    const minDim = Math.min(width, height);
    const avgRadius = Math.sqrt((totalTargetCircleArea / count) / Math.PI);
    const minR = isMobile
      ? Math.max(13, Math.min(22, avgRadius * 0.45))
      : Math.max(18, Math.min(36, avgRadius * 0.45));
    const maxR = Math.min(minDim * 0.42, isMobile ? 80 : 180);

    let boundedRadii = rawRadii.map((r) => Math.max(minR, Math.min(maxR, r)));

    // 4. Exact calibration pass: ensure total circle area stays precisely within 70% - 80% screen area
    const currentArea = boundedRadii.reduce((acc, r) => acc + Math.PI * r * r, 0);
    if (currentArea > 0) {
      const scaleFactor = Math.sqrt(totalTargetCircleArea / currentArea);
      boundedRadii = boundedRadii.map((r) => Math.max(minR * 0.9, Math.min(maxR, r * scaleFactor)));
    }

    // 5. Apply target radii to entities smoothly
    for (let i = 0; i < count; i++) {
      const b = this.bubbles[i];
      b.targetRadius = boundedRadii[i];
      if (!b.radius) {
        b.radius = b.targetRadius;
      }
    }

    // Only resolve hard overlaps if explicitly requested (e.g. initial load or category change)
    if (resolveOverlaps) {
      this.resolveAllOverlaps(25);
    }
  }


  private setupListeners() {
    const getPos = (e: MouseEvent | Touch): { x: number; y: number } => {
      const rect = this.canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handlePointerDown = (clientX: number, clientY: number) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      this.dragStartX = x;
      this.dragStartY = y;
      this.dragHasMoved = false;

      // Find top bubble under cursor (check in reverse so top-drawn is caught)
      for (let i = this.bubbles.length - 1; i >= 0; i--) {
        const b = this.bubbles[i];
        const dx = x - b.x;
        const dy = y - b.y;
        if (dx * dx + dy * dy <= b.radius * b.radius) {
          this.draggedBubble = b;
          b.isDragging = true;
          this.prevMouseX = x;
          this.prevMouseY = y;
          this.mouseSpeedX = 0;
          this.mouseSpeedY = 0;

          // Instantly bring clicked bubble to top layer (index = length - 1)
          this.bubbles.splice(i, 1);
          this.bubbles.push(b);
          break;
        }
      }
    };

    const handlePointerMove = (clientX: number, clientY: number) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      this.mouseX = x;
      this.mouseY = y;
      this.mouseSpeedX = x - this.prevMouseX;
      this.mouseSpeedY = y - this.prevMouseY;
      this.prevMouseX = x;
      this.prevMouseY = y;

      if (this.draggedBubble) {
        const distMoved = Math.hypot(x - this.dragStartX, y - this.dragStartY);
        if (distMoved > 4) {
          this.dragHasMoved = true;
        }
        // Smooth drag attraction
        this.draggedBubble.x += (x - this.draggedBubble.x) * 0.45;
        this.draggedBubble.y += (y - this.draggedBubble.y) * 0.45;
        this.draggedBubble.vx = this.mouseSpeedX * 0.8;
        this.draggedBubble.vy = this.mouseSpeedY * 0.8;
      } else {
        // Hover state
        let hovered: BubbleEntity | null = null;
        for (let i = this.bubbles.length - 1; i >= 0; i--) {
          const b = this.bubbles[i];
          const dx = x - b.x;
          const dy = y - b.y;
          const isInside = dx * dx + dy * dy <= b.radius * b.radius;
          b.isHovered = isInside && !hovered;
          if (isInside && !hovered) {
            hovered = b;
          }
        }
        this.onHoverCoin(hovered ? hovered.coin : null);
      }
    };

    const handlePointerUp = () => {
      if (this.draggedBubble) {
        if (!this.dragHasMoved) {
          // Click triggered!
          sound.playBubblePop(50 / this.draggedBubble.radius);
          this.onSelectCoin(this.draggedBubble.coin);
        } else {
          // Thrown! Impart velocity and play whoosh if fast enough
          const speed = Math.hypot(this.draggedBubble.vx, this.draggedBubble.vy);
          if (speed > 4) {
            sound.playThrowWhoosh();
          }
          this.draggedBubble.wobbleAmp = 0.16;
          this.draggedBubble.wobbleAngle = Math.atan2(this.draggedBubble.vy, this.draggedBubble.vx);
        }
        this.draggedBubble.isDragging = false;
        this.draggedBubble = null;
      }
    };

    // Mouse events
    this.canvas.addEventListener('mousedown', (e) => handlePointerDown(e.clientX, e.clientY));
    window.addEventListener('mousemove', (e) => handlePointerMove(e.clientX, e.clientY));
    window.addEventListener('mouseup', handlePointerUp);

    // Touch events for mobile/tablet
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    window.addEventListener('touchend', handlePointerUp);
  }

  public resize(width: number, height: number) {
    const dpr = window.devicePixelRatio || 1;
    const oldW = this.canvas.width / dpr;
    const oldH = this.canvas.height / dpr;

    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.scale(dpr, dpr);

    // Scale bubble positions proportionally so they never get trapped outside or clump into a single pixel
    if (oldW > 0 && oldH > 0 && (oldW !== width || oldH !== height)) {
      const scaleX = width / oldW;
      const scaleY = height / oldH;
      for (const b of this.bubbles) {
        b.x = Math.max(b.radius + 2, Math.min(width - b.radius - 2, b.x * scaleX));
        b.y = Math.max(b.radius + 2, Math.min(height - b.radius - 2, b.y * scaleY));
        // Dampen velocity during screen rotation or resize
        b.vx *= 0.4;
        b.vy *= 0.4;
      }
    }

    this.recalculateTargetRadii();
  }

  public start() {
    if (this.animFrameId) return;
    this.lastTime = performance.now();
    const loop = (timestamp: number) => {
      const dt = Math.min(32, timestamp - this.lastTime);
      this.lastTime = timestamp;
      this.update(dt);
      this.render();
      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  public stop() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  private update(dt: number) {
    const width = this.canvas.width / (window.devicePixelRatio || 1);
    const height = this.canvas.height / (window.devicePixelRatio || 1);
    const centerX = width / 2;
    const centerY = height / 2;

    const damping = this.physics.damping;
    const centerAttraction = this.physics.centerAttraction;
    const driftForce = this.physics.driftForce;

    // 1. Organic Random Fluid Motion & Independent Kinematics
    for (let i = 0; i < this.bubbles.length; i++) {
      const b = this.bubbles[i];

      // Smooth organic radius lerp
      b.radius += (b.targetRadius - b.radius) * b.lerpRate;

      // Organic liquid bubble wobble & dynamic damping
      b.wobblePhase += b.wobbleFreq;
      b.wobbleAmp += (0.02 - b.wobbleAmp) * 0.04;

      if (b.isDragging) continue;

      if (this.viewMode === 'apples') {
        // Apples View: Downward gravity to the floor! ("yg Apple buat gravitasi ke bawah dong, tapi apple enggak melayang2")
        const gravity = 0.32;
        b.vy += gravity;

        // Air damping for natural falling deceleration
        b.vx *= 0.982;
        b.vy *= 0.992;

        // Organic apple tilt: leans naturally at b.restTilt (-10° to +10°), with subtle roll responsiveness
        const rollTilt = Math.max(-0.25, Math.min(0.25, b.vx * 0.04));
        b.currentTilt += ((b.restTilt + rollTilt) - b.currentTilt) * 0.08;

        // Cursor stirring / fling effect - allows picking up and flinging apples upwards!
        if (this.mouseX > 0 && this.mouseY > 0) {
          const cdx = b.x - this.mouseX;
          const cdy = b.y - this.mouseY;
          const cdist = Math.hypot(cdx, cdy);
          const stirRadius = b.radius + 45;
          if (cdist < stirRadius && cdist > 1) {
            const force = (1 - cdist / stirRadius) * 0.45;
            b.vx += (cdx / cdist) * force;
            b.vy += (cdy / cdist) * force - 0.25; // Gentle upward loft when stirred
          }
        }

        if (this.searchQuery && (b.coin.symbol.toLowerCase().includes(this.searchQuery) || b.coin.name.toLowerCase().includes(this.searchQuery))) {
          b.vx += ((width / 2) - b.x) * 0.0006;
          b.vy += ((height / 2) - b.y) * 0.0006;
        }

        b.x += b.vx;
        b.y += b.vy;

        // Ground collision & roll friction
        const pad = b.radius + 1.5;
        if (b.y > height - pad) {
          b.y = height - pad;
          if (b.vy > 0) {
            if (b.vy < 0.7) {
              b.vy = 0; // Settle cleanly without micro-shudder
            } else {
              b.vy = -b.vy * 0.18;
              b.wobbleAmp = Math.min(0.12, b.wobbleAmp + 0.04);
              if (Math.abs(b.vy) > 1.2) sound.playBubbleBounce(Math.abs(b.vy), b.radius);
            }
            b.vx *= 0.82; // Ground roll friction
          }
        }

        // Left & Right walls
        if (b.x < pad) {
          b.x = pad;
          if (b.vx < 0) {
            b.vx = -b.vx * 0.25;
            if (Math.abs(b.vx) > 0.8) sound.playBubbleBounce(Math.abs(b.vx), b.radius);
          }
        } else if (b.x > width - pad) {
          b.x = width - pad;
          if (b.vx > 0) {
            b.vx = -b.vx * 0.25;
            if (Math.abs(b.vx) > 0.8) sound.playBubbleBounce(Math.abs(b.vx), b.radius);
          }
        }

        // Ceiling
        if (b.y < pad) {
          b.y = pad;
          if (b.vy < 0) b.vy = -b.vy * 0.2;
        }
      } else {
        // Bubbles View: Floating zero-gravity wandering kinematics (melayang-layang bebas!)
        b.impulseTimer -= dt;
        if (b.impulseTimer <= 0) {
          b.turnRate = (Math.random() - 0.5) * 0.045;
          b.cruiseSpeed = 0.25 + Math.random() * 0.95;
          if (Math.random() < 0.35) {
            b.heading += (Math.random() - 0.5) * Math.PI * 0.9;
          }
          b.impulseTimer = 800 + Math.random() * 2600;
        }

        b.heading += b.turnRate;

        // Independent wandering thrust
        const wanderForce = driftForce * b.cruiseSpeed * 0.45;
        b.vx += Math.cos(b.heading) * wanderForce;
        b.vy += Math.sin(b.heading) * wanderForce;

        // Fill rectangular screen with gentle inward steering
        const marginX = b.radius + 12;
        const marginY = b.radius + 12;
        if (b.x < marginX) b.vx += 0.07;
        else if (b.x > width - marginX) b.vx -= 0.07;
        if (b.y < marginY) b.vy += 0.07;
        else if (b.y > height - marginY) b.vy -= 0.07;

        // Cursor stirring effect
        if (this.mouseX > 0 && this.mouseY > 0) {
          const cdx = b.x - this.mouseX;
          const cdy = b.y - this.mouseY;
          const cdist = Math.hypot(cdx, cdy);
          const stirRadius = b.radius + 45;
          if (cdist < stirRadius && cdist > 1) {
            const force = (1 - cdist / stirRadius) * 0.45;
            b.vx += (cdx / cdist) * force;
            b.vy += (cdy / cdist) * force;
          }
        }

        // Apply damping & velocity
        b.vx *= damping;
        b.vy *= damping;
        if (this.searchQuery && (b.coin.symbol.toLowerCase().includes(this.searchQuery) || b.coin.name.toLowerCase().includes(this.searchQuery))) {
          b.vx += ((width / 2) - b.x) * 0.0008;
          b.vy += ((height / 2) - b.y) * 0.0008;
        }

        b.x += b.vx;
        b.y += b.vy;

        // Wall boundary collisions with deflection and bubble deformation
        const pad = b.radius + 2;
        const restitution = this.physics.bounceRestitution;

        if (b.x < pad) {
          b.x = pad;
          if (b.vx < 0) {
            b.vx = -b.vx * restitution;
            b.heading = Math.PI - b.heading + (Math.random() - 0.5) * 0.5;
            b.wobbleAmp = Math.min(0.2, b.wobbleAmp + 0.09);
            b.wobbleAngle = Math.PI;
            if (Math.abs(b.vx) > 1.2) sound.playBubbleBounce(Math.abs(b.vx), b.radius);
          }
        } else if (b.x > width - pad) {
          b.x = width - pad;
          if (b.vx > 0) {
            b.vx = -b.vx * restitution;
            b.heading = Math.PI - b.heading + (Math.random() - 0.5) * 0.5;
            b.wobbleAmp = Math.min(0.2, b.wobbleAmp + 0.09);
            b.wobbleAngle = 0;
            if (Math.abs(b.vx) > 1.2) sound.playBubbleBounce(Math.abs(b.vx), b.radius);
          }
        }

        if (b.y < pad) {
          b.y = pad;
          if (b.vy < 0) {
            b.vy = -b.vy * restitution;
            b.heading = -b.heading + (Math.random() - 0.5) * 0.5;
            b.wobbleAmp = Math.min(0.2, b.wobbleAmp + 0.09);
            b.wobbleAngle = -Math.PI / 2;
            if (Math.abs(b.vy) > 1.2) sound.playBubbleBounce(Math.abs(b.vy), b.radius);
          }
        } else if (b.y > height - pad) {
          b.y = height - pad;
          if (b.vy > 0) {
            b.vy = -b.vy * restitution;
            b.heading = -b.heading + (Math.random() - 0.5) * 0.5;
            b.wobbleAmp = Math.min(0.2, b.wobbleAmp + 0.09);
            b.wobbleAngle = Math.PI / 2;
            if (Math.abs(b.vy) > 1.2) sound.playBubbleBounce(Math.abs(b.vy), b.radius);
          }
        }
      }

      // Safe Velocity Clamp
      const maxSpeed = this.viewMode === 'apples' ? 7.5 : 5.5;
      const currentSpeed = Math.hypot(b.vx, b.vy);
      if (currentSpeed > maxSpeed) {
        const ratio = maxSpeed / currentSpeed;
        b.vx *= ratio;
        b.vy *= ratio;
      }
    }

    // 2. High-Precision Multi-Pass Collision & Stacking Solver
    // 10 relaxation passes in apples mode guarantees rigid, non-penetrating apple stacking from the floor up!
    // 6 relaxation passes in bubbles mode guarantees zero overlap with 70-80% screen coverage
    const iterations = this.viewMode === 'apples' ? 10 : 6;
    const len = this.bubbles.length;
    const padding = 1.0; // 1.0px hairline spacing cushion

    for (let iter = 0; iter < iterations; iter++) {
      for (let i = 0; i < len; i++) {
        const b1 = this.bubbles[i];
        for (let j = i + 1; j < len; j++) {
          const b2 = this.bubbles[j];

          const dx = b2.x - b1.x;
          const dy = b2.y - b1.y;
          const distSq = dx * dx + dy * dy;
          const minDist = b1.radius + b2.radius + padding;

          if (distSq < minDist * minDist) {
            let dist = Math.sqrt(distSq);
            let nx = 0;
            let ny = -1;
            if (dist < 0.001) {
              nx = (Math.random() - 0.5) * 0.2;
              ny = -1;
              const nl = Math.hypot(nx, ny) || 1;
              nx /= nl;
              ny /= nl;
            } else {
              nx = dx / dist;
              ny = dy / dist;
            }

            const overlap = minDist - dist;
            const m1 = b1.radius * b1.radius;
            const m2 = b2.radius * b2.radius;
            const totalMass = m1 + m2;
            const ratio1 = m2 / totalMass;
            const ratio2 = m1 / totalMass;

            // Full, uncapped positional separation
            if (!b1.isDragging && !b2.isDragging) {
              b1.x -= nx * overlap * ratio1;
              b1.y -= ny * overlap * ratio1;
              b2.x += nx * overlap * ratio2;
              b2.y += ny * overlap * ratio2;
            } else if (!b1.isDragging) {
              b1.x -= nx * overlap;
              b1.y -= ny * overlap;
            } else if (!b2.isDragging) {
              b2.x += nx * overlap;
              b2.y += ny * overlap;
            }
          }
        }
      }

      // CRITICAL: Ground and boundary constraints inside the relaxation iteration!
      // This enforces normal reaction force from the floor to propagate upwards through stacked apples
      for (let i = 0; i < len; i++) {
        const b = this.bubbles[i];
        const pad = b.radius + 1.5;
        if (b.y > height - pad) {
          b.y = height - pad;
          if (b.vy > 0 && iter === iterations - 1) b.vy = 0;
        }
        if (b.x < pad) {
          b.x = pad;
          if (b.vx < 0 && iter === iterations - 1) b.vx = 0;
        } else if (b.x > width - pad) {
          b.x = width - pad;
          if (b.vx > 0 && iter === iterations - 1) b.vx = 0;
        }
        if (b.y < pad) {
          b.y = pad;
          if (b.vy < 0 && iter === iterations - 1) b.vy = 0;
        }
      }
    }

    // Velocity reflection & resting contact stabilization
    for (let i = 0; i < len; i++) {
      const b1 = this.bubbles[i];
      for (let j = i + 1; j < len; j++) {
        const b2 = this.bubbles[j];
        const dx = b2.x - b1.x;
        const dy = b2.y - b1.y;
        const distSq = dx * dx + dy * dy;
        const minDist = b1.radius + b2.radius + padding + 1.5;

        if (distSq < minDist * minDist && distSq > 0.0001) {
          const dist = Math.sqrt(distSq);
          const nx = dx / dist;
          const ny = dy / dist;

          const rvx = b2.vx - b1.vx;
          const rvy = b2.vy - b1.vy;
          const velAlongNormal = rvx * nx + rvy * ny;

          if (velAlongNormal < 0) {
            const m1 = b1.radius * b1.radius;
            const m2 = b2.radius * b2.radius;

            if (this.viewMode === 'apples' && Math.abs(velAlongNormal) < 0.6) {
              // Stable resting contact in the apple pile (no jitter or micro-vibrations)
              const restingImpulse = -velAlongNormal / (1 / m1 + 1 / m2);
              if (!b1.isDragging) {
                b1.vx -= (restingImpulse / m1) * nx * 0.95;
                b1.vy -= (restingImpulse / m1) * ny * 0.95;
                b1.vx *= 0.95;
              }
              if (!b2.isDragging) {
                b2.vx += (restingImpulse / m2) * nx * 0.95;
                b2.vy += (restingImpulse / m2) * ny * 0.95;
                b2.vx *= 0.95;
              }
            } else {
              // Dynamic elastic bounce
              const restitution = this.viewMode === 'apples' ? 0.22 : 0.65;
              const impulseMag = -(1 + restitution) * velAlongNormal / (1 / m1 + 1 / m2);
              const ix = impulseMag * nx;
              const iy = impulseMag * ny;

              if (!b1.isDragging) {
                b1.vx -= ix / m1;
                b1.vy -= iy / m1;
              }
              if (!b2.isDragging) {
                b2.vx += ix / m2;
                b2.vy += iy / m2;
              }

              const relSpeed = Math.hypot(rvx, rvy);
              if (relSpeed > 0.4) {
                const impactWobble = Math.min(0.12, relSpeed * 0.025);
                b1.wobbleAmp = Math.max(b1.wobbleAmp, impactWobble);
                b2.wobbleAmp = Math.max(b2.wobbleAmp, impactWobble);
              }
              if (relSpeed > 2.0) {
                sound.playBubbleBounce(relSpeed, (b1.radius + b2.radius) * 0.5);
              }
            }
          }
        }
      }
    }
  }

  private getColorConfig(changeVal: number) {
    const isGain = changeVal >= 0;
    const absChange = Math.abs(changeVal);
    const isDark = this.theme === 'dark';

    // Proportional intensity factor: small changes (< 1%) are soft and gentle,
    // large changes (15%+) scale up gracefully without harsh over-saturation.
    const t = Math.min(1.0, Math.max(0.18, Math.sqrt(absChange / 16)));

    if (this.colorMode === 'classic') {
      if (isGain) {
        // GREEN: Scaled from soft, muted sage to rich emerald
        const sat = Math.round(28 + t * 48); // 28% -> 76% saturation
        const alphaMid = isDark ? (0.40 + t * 0.20) : (0.72 + t * 0.16);
        const alphaOuter = isDark ? (0.22 + t * 0.18) : (0.82 + t * 0.14);

        if (!isDark) {
          // LIGHT THEME BUBBLES: Glossy jewel marble, clean bright highlight, no dark soot!
          return {
            center: 'rgba(255, 255, 255, 0.78)',
            mid: `hsla(145, ${sat}%, ${Math.round(52 - t * 8)}%, ${alphaMid})`,
            outer: `hsla(148, ${sat}%, ${Math.round(40 - t * 6)}%, ${alphaOuter})`,
            rim: `hsla(150, ${Math.min(85, sat + 10)}%, 28%, 0.92)`,
            border: `hsla(150, ${sat}%, 32%, 0.75)`,
            glow: `hsla(145, ${sat}%, 45%, ${0.12 + t * 0.15})`,
            text: '#FFFFFF',
            glint: 'rgba(255, 255, 255, 0.95)',
          };
        }

        // DARK THEME BUBBLES: Translucent glass, soft proportional glow
        return {
          center: 'rgba(0, 0, 0, 0.35)',
          mid: `hsla(145, ${sat}%, ${Math.round(18 + t * 6)}%, ${alphaMid})`,
          outer: `hsla(148, ${sat}%, ${Math.round(36 + t * 8)}%, ${alphaOuter})`,
          rim: `hsla(145, ${sat}%, ${Math.round(46 + t * 10)}%, 0.85)`,
          border: `hsla(145, ${sat}%, ${Math.round(46 + t * 10)}%, 0.70)`,
          glow: `hsla(145, ${sat}%, 48%, ${0.15 + t * 0.22})`,
          text: '#FFFFFF',
          glint: 'rgba(255, 255, 255, 0.90)',
        };
      }

      // RED: Scaled from soft muted rose/coral to deep ruby
      const sat = Math.round(30 + t * 48); // 30% -> 78% saturation
      const alphaMid = isDark ? (0.40 + t * 0.20) : (0.72 + t * 0.16);
      const alphaOuter = isDark ? (0.22 + t * 0.18) : (0.82 + t * 0.14);

      if (!isDark) {
        // LIGHT THEME BUBBLES: Glossy ruby marble, luminous highlight, no dark soot!
        return {
          center: 'rgba(255, 255, 255, 0.78)',
          mid: `hsla(354, ${sat}%, ${Math.round(54 - t * 8)}%, ${alphaMid})`,
          outer: `hsla(352, ${sat}%, ${Math.round(44 - t * 6)}%, ${alphaOuter})`,
          rim: `hsla(350, ${Math.min(85, sat + 10)}%, 30%, 0.92)`,
          border: `hsla(350, ${sat}%, 34%, 0.75)`,
          glow: `hsla(354, ${sat}%, 50%, ${0.12 + t * 0.15})`,
          text: '#FFFFFF',
          glint: 'rgba(255, 255, 255, 0.95)',
        };
      }

      // DARK THEME BUBBLES: Translucent dark glass, soft proportional glow
      return {
        center: 'rgba(0, 0, 0, 0.35)',
        mid: `hsla(354, ${sat}%, ${Math.round(20 + t * 6)}%, ${alphaMid})`,
        outer: `hsla(352, ${sat}%, ${Math.round(40 + t * 8)}%, ${alphaOuter})`,
        rim: `hsla(354, ${sat}%, ${Math.round(50 + t * 10)}%, 0.85)`,
        border: `hsla(354, ${sat}%, ${Math.round(50 + t * 10)}%, 0.70)`,
        glow: `hsla(354, ${sat}%, 52%, ${0.15 + t * 0.22})`,
        text: '#FFFFFF',
        glint: 'rgba(255, 255, 255, 0.90)',
      };
    }

    if (this.colorMode === 'colorblind') {
      const sat = Math.round(35 + t * 45);
      if (isGain) {
        return {
          center: isDark ? 'rgba(0, 0, 0, 0.35)' : 'rgba(255, 255, 255, 0.75)',
          mid: isDark ? `hsla(217, ${sat}%, 22%, 0.55)` : `hsla(217, ${sat}%, 55%, 0.75)`,
          outer: isDark ? `hsla(217, ${sat}%, 45%, 0.36)` : `hsla(217, ${sat}%, 42%, 0.85)`,
          rim: `hsla(217, ${sat}%, 55%, 0.88)`,
          border: `hsla(217, ${sat}%, 55%, 0.75)`,
          glow: `hsla(217, ${sat}%, 55%, 0.30)`,
          text: '#FFFFFF',
          glint: 'rgba(255, 255, 255, 0.95)',
        };
      }
      return {
        center: isDark ? 'rgba(0, 0, 0, 0.35)' : 'rgba(255, 255, 255, 0.75)',
        mid: isDark ? `hsla(38, ${sat}%, 20%, 0.55)` : `hsla(38, ${sat}%, 52%, 0.75)`,
        outer: isDark ? `hsla(38, ${sat}%, 45%, 0.36)` : `hsla(38, ${sat}%, 40%, 0.85)`,
        rim: `hsla(38, ${sat}%, 55%, 0.88)`,
        border: `hsla(38, ${sat}%, 55%, 0.75)`,
        glow: `hsla(38, ${sat}%, 55%, 0.30)`,
        text: '#FFFFFF',
        glint: 'rgba(255, 255, 255, 0.95)',
      };
    }

    if (this.colorMode === 'neon') {
      const sat = Math.round(50 + t * 45);
      if (isGain) {
        return {
          center: isDark ? 'rgba(0, 0, 0, 0.40)' : 'rgba(255, 255, 255, 0.80)',
          mid: isDark ? 'rgba(0, 36, 24, 0.65)' : `hsla(160, ${sat}%, 48%, 0.75)`,
          outer: isDark ? 'rgba(0, 245, 155, 0.42)' : `hsla(160, ${sat}%, 38%, 0.85)`,
          rim: 'rgba(0, 245, 155, 0.95)',
          border: 'rgba(0, 245, 155, 0.85)',
          glow: 'rgba(0, 245, 155, 0.45)',
          text: '#FFFFFF',
          glint: '#FFFFFF',
        };
      }
      return {
        center: isDark ? 'rgba(0, 0, 0, 0.40)' : 'rgba(255, 255, 255, 0.80)',
        mid: isDark ? 'rgba(40, 5, 18, 0.65)' : `hsla(340, ${sat}%, 50%, 0.75)`,
        outer: isDark ? 'rgba(255, 42, 109, 0.42)' : `hsla(340, ${sat}%, 40%, 0.85)`,
        rim: 'rgba(255, 42, 109, 0.95)',
        border: 'rgba(255, 42, 109, 0.85)',
        glow: 'rgba(255, 42, 109, 0.45)',
        text: '#FFFFFF',
        glint: '#FFFFFF',
      };
    }

    // Monochrome Glass
    if (isGain) {
      return {
        center: isDark ? 'rgba(0, 0, 0, 0.35)' : 'rgba(255, 255, 255, 0.80)',
        mid: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(100, 116, 139, 0.40)',
        outer: isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(71, 85, 105, 0.75)',
        rim: isDark ? 'rgba(255, 255, 255, 0.75)' : 'rgba(51, 65, 85, 0.90)',
        border: isDark ? 'rgba(255, 255, 255, 0.60)' : 'rgba(51, 65, 85, 0.70)',
        glow: isDark ? 'rgba(255, 255, 255, 0.20)' : 'rgba(71, 85, 105, 0.20)',
        text: '#FFFFFF',
        glint: '#FFFFFF',
      };
    }
    return {
      center: isDark ? 'rgba(0, 0, 0, 0.40)' : 'rgba(255, 255, 255, 0.80)',
      mid: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(100, 116, 139, 0.30)',
      outer: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(71, 85, 105, 0.65)',
      rim: isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(51, 65, 85, 0.80)',
      border: isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(51, 65, 85, 0.60)',
      glow: 'rgba(0, 0, 0, 0.2)',
      text: '#FFFFFF',
      glint: 'rgba(255, 255, 255, 0.8)',
    };
  }

  private drawApplePath(rx: number, ry: number) {
    this.ctx.beginPath();
    // 1. Top central cleft where stem emerges
    this.ctx.moveTo(0, -ry * 0.70);

    // Normal smooth right shoulder
    this.ctx.bezierCurveTo(
      rx * 0.40, -ry * 1.05,
      rx * 1.05, -ry * 0.78,
      rx * 1.00, -ry * 0.12
    );

    // Smooth taper down to bottom right
    this.ctx.bezierCurveTo(
      rx * 0.95, ry * 0.42,
      rx * 0.62, ry * 0.92,
      rx * 0.28, ry * 0.98
    );

    // Rounded bottom base indentation
    this.ctx.bezierCurveTo(
      rx * 0.10, ry * 1.00,
      -rx * 0.10, ry * 1.00,
      -rx * 0.28, ry * 0.98
    );

    // Smooth taper up along left side to wide left shoulder
    this.ctx.bezierCurveTo(
      -rx * 0.62, ry * 0.92,
      -rx * 0.95, ry * 0.42,
      -rx * 1.00, -ry * 0.12
    );

    // Left shoulder back into top central cleft
    this.ctx.bezierCurveTo(
      -rx * 1.05, -ry * 0.78,
      -rx * 0.40, -ry * 1.05,
      0, -ry * 0.70
    );

    this.ctx.closePath();
  }

  private drawBubblePath(rx: number, ry: number) {
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    this.ctx.closePath();
  }

  private drawStar(
    cx: number,
    cy: number,
    spikes: number,
    outerRadius: number,
    innerRadius: number,
    color: string
  ) {
    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      this.ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      this.ctx.lineTo(x, y);
      rot += step;
    }
    this.ctx.lineTo(cx, cy - outerRadius);
    this.ctx.closePath();
    this.ctx.fillStyle = color;
    this.ctx.shadowColor = '#F59E0B';
    this.ctx.shadowBlur = 10;
    this.ctx.fill();
    this.ctx.lineWidth = Math.max(1.2, outerRadius * 0.14);
    this.ctx.strokeStyle = '#78350F';
    this.ctx.stroke();
    this.ctx.restore();
  }

  private render() {
    const width = this.canvas.width / (window.devicePixelRatio || 1);
    const height = this.canvas.height / (window.devicePixelRatio || 1);

    this.ctx.clearRect(0, 0, width, height);

    const hasSearch = this.searchQuery.length > 0;

    // Render bubbles sorted by radius, keeping search match assets LAST so they render on top!
    const sorted = [...this.bubbles].sort((a, b) => {
      if (hasSearch) {
        const aMatch = (
          a.coin.symbol.toLowerCase().includes(this.searchQuery) ||
          a.coin.name.toLowerCase().includes(this.searchQuery)
        );
        const bMatch = (
          b.coin.symbol.toLowerCase().includes(this.searchQuery) ||
          b.coin.name.toLowerCase().includes(this.searchQuery)
        );
        if (aMatch !== bMatch) return aMatch ? 1 : -1;
      }
      return a.radius - b.radius;
    });

    for (let i = 0; i < sorted.length; i++) {
      const b = sorted[i];
      const changeVal = b.coin.changes[this.timeframe] || 0;
      const colors = this.getColorConfig(changeVal);
      const isFav = this.favorites.has(b.coin.id.toLowerCase()) || this.favorites.has(b.coin.symbol.toUpperCase());

      const isSearchMatch = hasSearch && (
        b.coin.symbol.toLowerCase().includes(this.searchQuery) ||
        b.coin.name.toLowerCase().includes(this.searchQuery)
      );

      // Search Highlighting & Contextual Dimming:
      // Matching assets remain at 100% brightness while non-matching assets are gently dimmed to 22%
      if (hasSearch) {
        this.ctx.globalAlpha = isSearchMatch ? 1.0 : 0.22;
      } else {
        this.ctx.globalAlpha = 1.0;
      }

      this.ctx.save();
      this.ctx.translate(b.x, b.y);

      // Subtle organic breathing radius (smaller amplitude in apples mode)
      const breathScale = this.viewMode === 'apples' ? 0.45 : 1.0;
      const baseR = Math.max(16, b.radius + Math.sin(b.breathPhase) * (b.breathAmp * breathScale));

      // Liquid soap bubble dynamic wobble / surface tension
      const wobble = Math.sin(b.wobblePhase) * b.wobbleAmp;
      const rx = baseR * (1 + wobble);
      const ry = baseR * (1 - wobble * 0.85);

      // Subtle bubble rim aura glow
      if (b.isHovered || b.isDragging) {
        this.ctx.shadowColor = colors.glow;
        this.ctx.shadowBlur = 24;
      } else {
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
      }

      // Rotate canvas for dynamic movement
      if (this.viewMode === 'bubbles') {
        this.ctx.rotate(b.wobbleAngle);
      } else if (this.viewMode === 'apples') {
        // Gentle organic apple sway rocking tilt with individual resting lean (-10° to +10°)
        const appleSway = Math.sin(b.breathPhase * 0.65 + i * 0.8) * 0.025;
        this.ctx.rotate((b.currentTilt || 0) + appleSway);
      }

      if (this.viewMode === 'apples') {
        // AUTHENTIC APPLE RENDERING: Matching user reference image
        const appleRx = baseR * 1.02;
        const appleRy = baseR * 1.04;

        // Rich 3D Apple Fruit Gradient
        const appleGrad = this.ctx.createRadialGradient(
          -appleRx * 0.22,
          -appleRy * 0.26,
          baseR * 0.08,
          0,
          appleRy * 0.08,
          Math.max(appleRx, appleRy) * 1.05
        );

        const absChange = Math.abs(changeVal);
        const isDark = this.theme === 'dark';
        const t = Math.min(1.0, Math.max(0.18, Math.sqrt(absChange / 16)));

        if (changeVal >= 0) {
          // Proportional green apple: soft sage when small/stable, rich Granny Smith when big
          const sat = Math.round(28 + t * 46);
          const topLight = isDark ? Math.round(52 + (1 - t) * 8) : Math.round(62 + (1 - t) * 8);
          const midLight = isDark ? Math.round(36 + (1 - t) * 5) : Math.round(40 + (1 - t) * 5);
          const baseLight = isDark ? Math.round(20 + (1 - t) * 4) : Math.round(24 + (1 - t) * 4);

          appleGrad.addColorStop(0, `hsl(142, ${sat}%, ${topLight}%)`);
          appleGrad.addColorStop(0.28, `hsl(145, ${sat}%, ${midLight}%)`);
          appleGrad.addColorStop(0.72, `hsl(150, ${Math.min(85, sat + 6)}%, ${baseLight}%)`);
          appleGrad.addColorStop(1, isDark ? '#052e16' : '#064e3b');
        } else {
          // Proportional red apple: soft rose when small, deep Honeycrisp ruby when big
          const sat = Math.round(30 + t * 46);
          const topLight = isDark ? Math.round(54 + (1 - t) * 8) : Math.round(64 + (1 - t) * 8);
          const midLight = isDark ? Math.round(38 + (1 - t) * 5) : Math.round(42 + (1 - t) * 5);
          const baseLight = isDark ? Math.round(22 + (1 - t) * 4) : Math.round(26 + (1 - t) * 4);

          appleGrad.addColorStop(0, `hsl(356, ${sat}%, ${topLight}%)`);
          appleGrad.addColorStop(0.28, `hsl(354, ${sat}%, ${midLight}%)`);
          appleGrad.addColorStop(0.72, `hsl(350, ${Math.min(85, sat + 6)}%, ${baseLight}%)`);
          appleGrad.addColorStop(1, isDark ? '#450a0a' : '#4c0519');
        }

        // 1. Fill apple body silhouette
        this.ctx.fillStyle = appleGrad;
        this.drawApplePath(appleRx, appleRy);
        this.ctx.fill();

        // 2. Glowing yellow border for favorites, or crisp cartoon border outline
        if (isFav) {
          this.ctx.save();
          this.ctx.shadowColor = '#FACC15';
          this.ctx.shadowBlur = Math.min(22, Math.max(10, baseR * 0.38));
          this.ctx.lineWidth = Math.max(3.5, baseR * 0.08);
          this.ctx.strokeStyle = '#FACC15';
          this.drawApplePath(appleRx, appleRy);
          this.ctx.stroke();
          this.ctx.restore();
        } else {
          this.ctx.lineWidth = b.isHovered ? 2.5 : Math.max(1.6, baseR * 0.038);
          this.ctx.strokeStyle = b.isHovered
            ? '#FFFFFF'
            : (isDark ? 'rgba(20, 10, 5, 0.75)' : 'rgba(30, 20, 15, 0.40)');
          this.drawApplePath(appleRx, appleRy);
          this.ctx.stroke();
        }

        // 3. Apple Wood Stem (dark brown, curved naturally)
        this.ctx.save();
        this.ctx.strokeStyle = '#3a2010';
        this.ctx.lineWidth = Math.max(2.8, baseR * 0.07);
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(0, -appleRy * 0.68);
        this.ctx.quadraticCurveTo(appleRx * 0.07, -appleRy * 0.95, appleRx * 0.12, -appleRy * 1.25);
        this.ctx.stroke();
        this.ctx.restore();

        // 4. Apple Green Leaf with coin rank #number inside!
        if (baseR >= 13) {
          this.ctx.save();
          const leafX = appleRx * 0.08;
          const leafY = -appleRy * 1.02;
          this.ctx.translate(leafX, leafY);
          this.ctx.rotate(0.26);

          const rankStr = `#${b.coin.rank}`;
          // Scale leaf width & height roomily so rank fits comfortably with ample padding
          const minW = rankStr.length >= 5 ? 46 : (rankStr.length >= 4 ? 38 : (rankStr.length >= 3 ? 32 : 26));
          const leafW = Math.max(minW, baseR * (rankStr.length >= 4 ? 0.48 : 0.40));
          const leafH = Math.max(14, baseR * 0.22);

          // 4a. Plump organic leaf path: broad belly with smooth pointed tip for optimal text padding
          this.ctx.beginPath();
          this.ctx.moveTo(0, 0);
          this.ctx.bezierCurveTo(leafW * 0.20, -leafH * 0.85, leafW * 0.65, -leafH * 0.80, leafW, 0);
          this.ctx.bezierCurveTo(leafW * 0.65, leafH * 0.80, leafW * 0.20, leafH * 0.85, 0, 0);
          this.ctx.closePath();

          // Fresh vivid green leaf gradient
          const leafGrad = this.ctx.createLinearGradient(0, -leafH * 0.5, leafW, leafH * 0.5);
          leafGrad.addColorStop(0, '#34d399'); // emerald-400
          leafGrad.addColorStop(0.45, '#22c55e'); // green-500
          leafGrad.addColorStop(1, '#15803d'); // green-700

          this.ctx.fillStyle = leafGrad;
          this.ctx.fill();

          // 4b. Leaf border outline
          this.ctx.lineWidth = Math.max(1.2, baseR * 0.026);
          this.ctx.strokeStyle = isDark ? 'rgba(5, 35, 15, 0.90)' : 'rgba(15, 50, 25, 0.70)';
          this.ctx.stroke();

          // 4c. Rank #angka embedded directly inside the leaf with balanced, comfortable fit
          const rankFontSize = Math.min(11, Math.max(8, Math.round(leafH * 0.48)));
          this.ctx.font = `800 ${rankFontSize}px 'JetBrains Mono', -apple-system, sans-serif`;
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillStyle = '#FFFFFF';
          this.ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
          this.ctx.shadowBlur = 3;
          this.ctx.shadowOffsetX = 0;
          this.ctx.shadowOffsetY = 1;
          this.ctx.fillText(rankStr, leafW * 0.48, 0);

          this.ctx.restore();
        }

        // 5. Glowing highlight beacon if this asset matches the search query!
        if (isSearchMatch) {
          const pulse = (Math.sin(Date.now() * 0.006) + 1) / 2; // 0 to 1
          this.ctx.save();

          // Expanding cyan radar wave
          this.ctx.beginPath();
          const radarR = Math.max(appleRx, appleRy) + 7 + pulse * 15;
          this.ctx.arc(0, 0, radarR, 0, Math.PI * 2);
          this.ctx.strokeStyle = `rgba(0, 240, 255, ${0.85 - pulse * 0.75})`;
          this.ctx.lineWidth = 2.2;
          this.ctx.stroke();

          // Neon inner spotlight stroke
          this.ctx.shadowColor = '#00f0ff';
          this.ctx.shadowBlur = 28;
          this.ctx.strokeStyle = '#ffffff';
          this.ctx.lineWidth = 3.6;
          this.drawApplePath(appleRx + 2.5, appleRy + 2.5);
          this.ctx.stroke();

          // Spotlight beacon pill above the apple
          const badgeY = -appleRy - 22;
          const badgeText = `✦ ${b.coin.symbol}`;
          this.ctx.font = 'bold 9px -apple-system, sans-serif';
          const tw = this.ctx.measureText(badgeText).width;
          this.ctx.fillStyle = 'rgba(8, 47, 73, 0.92)';
          this.ctx.strokeStyle = '#38bdf8';
          this.ctx.lineWidth = 1.2;
          this.ctx.beginPath();
          this.ctx.roundRect(-tw / 2 - 7, badgeY - 8, tw + 14, 16, 8);
          this.ctx.fill();
          this.ctx.stroke();
          this.ctx.fillStyle = '#38bdf8';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText(badgeText, 0, badgeY);

          this.ctx.restore();
        }

        // Unrotate apple sway tilt so internal text and logos remain upright & easily readable
        const appleTilt = Math.sin(b.breathPhase * 0.65 + i * 0.8) * 0.035;
        this.ctx.rotate(-appleTilt);
      } else {
        // BUBBLES VIEW: Translucent soap-bubble membrane
        const radGrad = this.ctx.createRadialGradient(
          -rx * 0.15,
          -ry * 0.15,
          baseR * 0.05,
          0,
          0,
          Math.max(rx, ry)
        );
        radGrad.addColorStop(0, colors.center); // Translucent airy core
        radGrad.addColorStop(0.55, colors.mid); // Smoked liquid tint
        radGrad.addColorStop(0.85, colors.outer); // Colored membrane
        radGrad.addColorStop(0.97, colors.rim); // Luminous rim
        radGrad.addColorStop(1.0, 'rgba(0,0,0,0.0)'); // Smooth outer edge anti-aliasing

        this.ctx.fillStyle = radGrad;
        this.drawBubblePath(rx, ry);
        this.ctx.fill();

        // Glowing yellow border for favorites, or clean rim outline
        if (isFav) {
          this.ctx.save();
          this.ctx.shadowColor = '#FACC15';
          this.ctx.shadowBlur = Math.min(22, Math.max(10, baseR * 0.38));
          this.ctx.lineWidth = Math.max(3.0, baseR * 0.07);
          this.ctx.strokeStyle = '#FACC15';
          this.drawBubblePath(rx, ry);
          this.ctx.stroke();
          this.ctx.restore();
        } else {
          this.ctx.lineWidth = b.isHovered ? 2.0 : 1.1;
          this.ctx.strokeStyle = b.isHovered ? '#FFFFFF' : colors.border;
          this.drawBubblePath(rx, ry);
          this.ctx.stroke();
        }

        // Glowing highlight beacon if this asset matches the search query!
        if (isSearchMatch) {
          const pulse = (Math.sin(Date.now() * 0.006) + 1) / 2; // 0 to 1
          this.ctx.save();

          // Expanding cyan radar wave
          this.ctx.beginPath();
          const radarR = Math.max(rx, ry) + 7 + pulse * 15;
          this.ctx.arc(0, 0, radarR, 0, Math.PI * 2);
          this.ctx.strokeStyle = `rgba(0, 240, 255, ${0.85 - pulse * 0.75})`;
          this.ctx.lineWidth = 2.2;
          this.ctx.stroke();

          // Neon inner spotlight stroke
          this.ctx.shadowColor = '#00f0ff';
          this.ctx.shadowBlur = 28;
          this.ctx.strokeStyle = '#ffffff';
          this.ctx.lineWidth = 3.6;
          this.drawBubblePath(rx + 2.5, ry + 2.5);
          this.ctx.stroke();

          // Spotlight beacon pill above the bubble
          const badgeY = -ry - 20;
          const badgeText = `✦ ${b.coin.symbol}`;
          this.ctx.font = 'bold 9px -apple-system, sans-serif';
          const tw = this.ctx.measureText(badgeText).width;
          this.ctx.fillStyle = 'rgba(8, 47, 73, 0.92)';
          this.ctx.strokeStyle = '#38bdf8';
          this.ctx.lineWidth = 1.2;
          this.ctx.beginPath();
          this.ctx.roundRect(-tw / 2 - 7, badgeY - 8, tw + 14, 16, 8);
          this.ctx.fill();
          this.ctx.stroke();
          this.ctx.fillStyle = '#38bdf8';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText(badgeText, 0, badgeY);

          this.ctx.restore();
        }

        this.ctx.rotate(-b.wobbleAngle);
      }

      // 5. Large favorite golden star badge with glowing aura
      if (isFav && baseR >= 16) {
        const starOuter = Math.max(8.5, baseR * 0.22);
        const starInner = starOuter * 0.48;
        const starX = baseR * 0.52;
        const starY = -baseR * 0.52;
        this.drawStar(
          starX,
          starY,
          5,
          starOuter,
          starInner,
          '#FACC15'
        );
      }

      // 6. Typography and icon inside bubble
      this.renderBubbleContent(b, colors.text);

      this.ctx.restore();
    }
  }

  private getOrLoadIcon(symbol: string, colorHex?: string, iconUrl?: string): HTMLImageElement {
    return loadCryptoCanvasIcon(symbol, colorHex, iconUrl);
  }

  /**
   * Draw a clean circular badge for crypto icons with subtle backdrop & crisp border
   */
  private drawCircleIcon(img: HTMLImageElement, cx: number, cy: number, size: number) {
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
    // Dark translucent background behind icon so transparent icons remain readable on green/red
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    this.ctx.fill();
    // Subtle crisp border ring around the circular icon badge
    this.ctx.lineWidth = Math.max(1, size * 0.04);
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    this.ctx.stroke();
    this.ctx.clip();
    this.ctx.drawImage(img, cx - size / 2, cy - size / 2, size, size);
    this.ctx.restore();
  }

  private renderBubbleContent(b: BubbleEntity, textColor: string) {
    const r = b.radius;
    const changeVal = b.coin.changes[this.timeframe] || 0;

    // Formatting primary metric (% change is the main hero metric, price is reserved for detail modal)
    let primaryMetric = '';
    if (this.contentDisplay === 'performance') {
      primaryMetric = formatPercent(changeVal);
    } else if (this.contentDisplay === 'price') {
      primaryMetric = formatPrice(b.coin.price, this.currency);
    } else if (this.contentDisplay === 'market_cap') {
      primaryMetric = formatNumber(b.coin.marketCap, this.currency);
    } else if (this.contentDisplay === 'rank') {
      primaryMetric = `#${b.coin.rank}`;
    } else {
      primaryMetric = formatPercent(changeVal);
    }

    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    // Pure, clean symbol label without rank clutter (e.g. BTC, ETH, SOL)
    const label = b.coin.symbol;

    // Load official retina brand icon
    const iconImg = this.getOrLoadIcon(b.coin.symbol, b.coin.colorHex, b.coin.iconUrl);
    const isIconReady = iconImg && iconImg.complete && iconImg.naturalWidth > 0;

    // Tier 1: Small bubble (r < 28px) - Clean Ticker & % Metric (with circular icon when r >= 20)
    if (r < 28) {
      if (r < 20) {
        // Micro bubble on mobile: clean bold ticker and small percentage
        const labelSize = Math.max(7, Math.round(r * 0.38));
        this.ctx.font = `800 ${labelSize}px 'Plus Jakarta Sans', -apple-system, sans-serif`;
        this.ctx.fillStyle = textColor;
        this.ctx.fillText(label, 0, -r * 0.18);
        const metricSize = Math.max(6.5, Math.round(r * 0.32));
        this.ctx.font = `700 ${metricSize}px 'JetBrains Mono', monospace`;
        this.ctx.fillText(primaryMetric, 0, r * 0.30);
        return;
      }
      if (isIconReady) {
        const iconSize = Math.round(r * 0.36);
        this.drawCircleIcon(iconImg, 0, -r * 0.44, iconSize);
        const fontSize = Math.max(7.5, Math.round(r * 0.28));
        this.ctx.font = `800 ${fontSize}px 'Plus Jakarta Sans', -apple-system, sans-serif`;
        this.ctx.fillStyle = textColor;
        this.ctx.fillText(label, 0, -r * 0.02);
        this.ctx.font = `700 ${Math.max(6.5, Math.round(r * 0.28))}px 'JetBrains Mono', monospace`;
        this.ctx.fillText(primaryMetric, 0, r * 0.40);
      } else {
        const fontSize = Math.max(8, Math.round(r * 0.32));
        this.ctx.font = `800 ${fontSize}px 'Plus Jakarta Sans', -apple-system, sans-serif`;
        this.ctx.fillStyle = textColor;
        this.ctx.fillText(label, 0, -r * 0.16);
        this.ctx.font = `700 ${Math.max(7, Math.round(r * 0.28))}px 'JetBrains Mono', monospace`;
        this.ctx.fillText(primaryMetric, 0, r * 0.26);
      }
      return;
    }

    // Discreet top rank badge: only in bubbles view (in apples view, rank is inside the leaf!)
    if (this.viewMode === 'bubbles' && r >= 38) {
      const rankText = `#${b.coin.rank}`;
      const rankFontSize = Math.min(10, Math.max(7, Math.round(r * 0.16)));
      this.ctx.font = `700 ${rankFontSize}px 'JetBrains Mono', monospace`;
      const badgeW = this.ctx.measureText(rankText).width + 8;
      const badgeH = rankFontSize + 4;
      const badgeY = isIconReady ? -r * 0.74 : -r * 0.64;

      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.40)';
      this.ctx.beginPath();
      this.ctx.roundRect(-badgeW / 2, badgeY - badgeH / 2, badgeW, badgeH, badgeH / 2);
      this.ctx.fill();

      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
      this.ctx.fillText(rankText, 0, badgeY);
    }

    // Tier 2: Medium bubble (28 <= r < 46px) - Circular Brand Icon, Clean Ticker & % Metric
    if (r < 46) {
      if (isIconReady && r >= 32) {
        const iconSize = Math.round(r * 0.32);
        this.drawCircleIcon(iconImg, 0, -r * 0.42, iconSize);

        const labelSize = Math.round(r * 0.26);
        this.ctx.font = `800 ${labelSize}px 'Plus Jakarta Sans', -apple-system, sans-serif`;
        this.ctx.fillStyle = textColor;
        this.ctx.fillText(label, 0, -r * 0.04);

        const metricSize = Math.round(r * 0.28);
        this.ctx.font = `700 ${metricSize}px 'JetBrains Mono', monospace`;
        this.ctx.fillText(primaryMetric, 0, r * 0.38);
      } else {
        const labelSize = Math.round(r * 0.30);
        const metricSize = Math.round(r * 0.28);

        this.ctx.font = `800 ${labelSize}px 'Plus Jakarta Sans', -apple-system, sans-serif`;
        this.ctx.fillStyle = textColor;
        this.ctx.fillText(label, 0, -r * 0.16);

        this.ctx.font = `700 ${metricSize}px 'JetBrains Mono', monospace`;
        this.ctx.fillText(primaryMetric, 0, r * 0.24);
      }
      return;
    }

    // Tier 3: Large bubble (r >= 46px) - Circular Retina Icon, Large Ticker & Bold % Metric
    // Note: Price is removed from bubble surface to keep focus 100% on % performance; price is in detail modal
    const iconSize = Math.min(38, Math.round(r * 0.34));
    if (isIconReady) {
      this.drawCircleIcon(iconImg, 0, -r * 0.40, iconSize);
    }

    const labelSize = Math.min(24, Math.round(r * 0.26));
    const metricSize = Math.min(28, Math.round(r * 0.30));

    // Pure Symbol (e.g. BTC, ETH, SOL)
    this.ctx.font = `800 ${labelSize}px 'Plus Jakarta Sans', -apple-system, sans-serif`;
    this.ctx.fillStyle = textColor;
    this.ctx.fillText(label, 0, isIconReady ? -r * 0.04 : -r * 0.18);

    // Primary Metric (% Change - bold, crisp tabular figures)
    this.ctx.font = `800 ${metricSize}px 'JetBrains Mono', monospace`;
    this.ctx.fillText(primaryMetric, 0, isIconReady ? r * 0.36 : r * 0.22);
  }

  /**
   * Capture crisp high-res screenshot of the canvas with branding & watermark
   */
  public captureScreenshot(): string {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.canvas.width;
    tempCanvas.height = this.canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return '';

    // Draw dark background
    tempCtx.fillStyle = '#0b0e14';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // Draw simulation
    tempCtx.drawImage(this.canvas, 0, 0);

    // Add watermark
    tempCtx.font = '700 18px "Plus Jakarta Sans", sans-serif';
    tempCtx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    tempCtx.fillText('MapSaham.com', 24, tempCanvas.height - 24);

    tempCtx.font = '500 13px "JetBrains Mono", monospace';
    tempCtx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    const dateStr = new Date().toUTCString();
    tempCtx.fillText(`${dateStr} · Size: ${this.sizeBy.toUpperCase()} · TF: ${this.timeframe.toUpperCase()}`, 24, tempCanvas.height - 48);

    return tempCanvas.toDataURL('image/png');
  }

  public resetPhysics() {
    const width = this.canvas.width / (window.devicePixelRatio || 1);
    const height = this.canvas.height / (window.devicePixelRatio || 1);
    const centerX = width / 2;
    const centerY = height / 2;

    for (let i = 0; i < this.bubbles.length; i++) {
      const b = this.bubbles[i];
      const angle = i * 0.6;
      const dist = 40 + i * 8;
      b.x = centerX + Math.cos(angle) * dist;
      b.y = centerY + Math.sin(angle) * dist;
      b.vx = (Math.random() - 0.5) * 3;
      b.vy = (Math.random() - 0.5) * 3;
    }
  }
}

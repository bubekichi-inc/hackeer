"use client";

import { useRef, useEffect, useCallback } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface City {
  name: string;
  lat: number;
  lon: number;
}

interface AttackLine {
  from: City;
  to: City;
  color: string;
  birth: number;
  lifetime: number; // ms
  progress: number; // 0‒1 particle position
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const CITIES: City[] = [
  { name: "Tokyo", lat: 35.68, lon: 139.69 },
  { name: "New York", lat: 40.71, lon: -74.01 },
  { name: "London", lat: 51.51, lon: -0.13 },
  { name: "Berlin", lat: 52.52, lon: 13.4 },
  { name: "Sydney", lat: -33.87, lon: 151.21 },
  { name: "Mumbai", lat: 19.08, lon: 72.88 },
  { name: "São Paulo", lat: -23.55, lon: -46.63 },
  { name: "Seoul", lat: 37.57, lon: 126.98 },
  { name: "Moscow", lat: 55.76, lon: 37.62 },
  { name: "Beijing", lat: 39.9, lon: 116.4 },
  { name: "Singapore", lat: 1.35, lon: 103.82 },
  { name: "Dubai", lat: 25.2, lon: 55.27 },
  { name: "Paris", lat: 48.86, lon: 2.35 },
  { name: "Lagos", lat: 6.52, lon: 3.38 },
  { name: "Toronto", lat: 43.65, lon: -79.38 },
  { name: "Los Angeles", lat: 34.05, lon: -118.24 },
  { name: "Shanghai", lat: 31.23, lon: 121.47 },
  { name: "Cape Town", lat: -33.93, lon: 18.42 },
  { name: "Stockholm", lat: 59.33, lon: 18.07 },
  { name: "Buenos Aires", lat: -34.6, lon: -58.38 },
];

// Simplified continental outlines as [lat, lon][] polygons.
// Each sub‑array is a polyline drawn with moveTo → lineTo.

const NORTH_AMERICA: [number, number][] = [
  [60, -140], [64, -168], [72, -168], [71, -156], [68, -165],
  [65, -168], [60, -165], [55, -165], [55, -160], [58, -152],
  [60, -148], [60, -140], [68, -140], [70, -130], [72, -120],
  [74, -95], [72, -80], [68, -65], [62, -62], [55, -58],
  [50, -58], [47, -62], [45, -64], [44, -66], [43, -70],
  [41, -72], [38, -76], [35, -76], [30, -82], [28, -82],
  [25, -80], [25, -83], [28, -90], [27, -97], [26, -98],
  [22, -98], [18, -96], [16, -92], [14, -88], [14, -84],
  [10, -78], [8, -77], [10, -75], [12, -72], [10, -68],
  [11, -62], [8, -60], [7, -55],
];

const SOUTH_AMERICA: [number, number][] = [
  [12, -72], [10, -75], [8, -77], [4, -78], [0, -80],
  [-5, -82], [-6, -81], [-14, -76], [-18, -71], [-24, -70],
  [-28, -71], [-33, -72], [-40, -74], [-46, -76], [-50, -76],
  [-53, -72], [-56, -70], [-56, -66], [-52, -68], [-48, -66],
  [-42, -64], [-38, -58], [-35, -56], [-32, -52], [-28, -49],
  [-23, -44], [-18, -40], [-12, -38], [-8, -35], [-5, -35],
  [-2, -42], [0, -50], [3, -52], [6, -56], [7, -55],
  [8, -60], [11, -62], [10, -68], [12, -72],
];

const EUROPE: [number, number][] = [
  [36, -8], [37, -2], [38, 0], [40, 0], [43, -2],
  [44, -1], [46, -2], [48, -5], [49, -2], [51, 2],
  [52, 5], [54, 8], [56, 8], [58, 6], [58, 10],
  [56, 12], [56, 16], [55, 14], [54, 14], [54, 18],
  [56, 18], [58, 18], [60, 18], [62, 18], [64, 20],
  [66, 24], [68, 26], [70, 28], [70, 32], [68, 40],
  [65, 42], [60, 42], [58, 40], [56, 38], [54, 38],
  [52, 36], [48, 40], [44, 42], [42, 40], [40, 28],
  [38, 24], [38, 22], [40, 22], [40, 26], [38, 28],
  [36, 28], [35, 24], [36, 22], [38, 18], [40, 16],
  [42, 14], [44, 8], [44, 6], [42, 4], [40, 2],
  [38, -2], [36, -6], [36, -8],
];

const AFRICA: [number, number][] = [
  [36, -8], [36, -6], [34, -2], [36, 8], [36, 10],
  [32, 12], [32, 24], [30, 32], [22, 36], [18, 38],
  [12, 44], [10, 42], [2, 42], [-2, 42], [-8, 40],
  [-12, 40], [-16, 36], [-20, 34], [-24, 36], [-28, 32],
  [-32, 28], [-34, 26], [-34, 18], [-30, 16], [-24, 14],
  [-18, 12], [-12, 14], [-8, 12], [-4, 10], [0, 10],
  [4, 8], [6, 2], [4, 0], [6, -4], [4, -8],
  [6, -12], [8, -14], [10, -16], [14, -18], [16, -16],
  [20, -18], [22, -16], [28, -14], [32, -8], [36, -8],
];

const ASIA: [number, number][] = [
  [42, 40], [44, 42], [48, 40], [52, 36], [54, 38],
  [56, 38], [58, 40], [60, 42], [65, 42], [68, 40],
  [70, 32], [70, 48], [72, 60], [72, 80], [72, 100],
  [72, 120], [70, 140], [68, 150], [66, 172], [64, 178],
  [60, 168], [56, 162], [52, 158], [48, 142], [44, 145],
  [42, 140], [40, 132], [38, 130], [36, 128], [34, 128],
  [32, 130], [30, 122], [26, 120], [22, 114], [22, 108],
  [18, 108], [12, 108], [8, 106], [4, 104], [2, 104],
  [0, 100], [-6, 106], [-8, 114], [-8, 118], [-6, 120],
  [-2, 116], [0, 104], [2, 104], [4, 104], [6, 100],
  [8, 98], [14, 100], [18, 100], [20, 96], [22, 92],
  [26, 88], [24, 84], [22, 80], [18, 78], [16, 80],
  [12, 80], [8, 78], [6, 74], [8, 68], [16, 68],
  [24, 66], [26, 56], [24, 52], [18, 52], [14, 44],
  [12, 44], [22, 36], [30, 32], [32, 34], [34, 36],
  [36, 36], [38, 38], [40, 40], [42, 40],
];

const AUSTRALIA: [number, number][] = [
  [-12, 130], [-14, 128], [-16, 124], [-18, 122], [-22, 114],
  [-26, 114], [-28, 114], [-32, 116], [-34, 118], [-36, 138],
  [-38, 146], [-38, 148], [-36, 150], [-34, 152], [-28, 154],
  [-24, 152], [-20, 148], [-18, 146], [-14, 142], [-12, 136],
  [-12, 130],
];

const CONTINENTS: [number, number][][] = [
  NORTH_AMERICA,
  SOUTH_AMERICA,
  EUROPE,
  AFRICA,
  ASIA,
  AUSTRALIA,
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function latLonToXY(
  lat: number,
  lon: number,
  w: number,
  h: number
): [number, number] {
  const x = ((lon + 180) / 360) * w;
  const y = ((90 - lat) / 180) * h;
  return [x, y];
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Quadratic bezier point at t */
function quadBezier(
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  t: number
): [number, number] {
  const u = 1 - t;
  return [
    u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
    u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
  ];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function WorldMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const attacksRef = useRef<AttackLine[]>([]);
  const flashesRef = useRef<Map<string, number>>(new Map());
  const lastSpawnRef = useRef(0);
  const rafRef = useRef(0);

  // ---- Coordinate projection (memoized per resize) ----
  const projectCity = useCallback(
    (city: City, w: number, h: number): [number, number] =>
      latLonToXY(city.lat, city.lon, w, h),
    []
  );

  // ---- Drawing helpers ----

  const drawGrid = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      ctx.save();
      ctx.strokeStyle = "rgba(0,60,0,0.12)";
      ctx.lineWidth = 0.5;
      // longitude lines every 30°
      for (let lon = -180; lon <= 180; lon += 30) {
        const x = ((lon + 180) / 360) * w;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      // latitude lines every 30°
      for (let lat = -90; lat <= 90; lat += 30) {
        const y = ((90 - lat) / 180) * h;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      ctx.restore();
    },
    []
  );

  const drawContinents = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      ctx.save();
      ctx.strokeStyle = "#003300";
      ctx.lineWidth = 1.2;
      ctx.shadowColor = "#00ff00";
      ctx.shadowBlur = 2;
      for (const continent of CONTINENTS) {
        ctx.beginPath();
        for (let i = 0; i < continent.length; i++) {
          const [x, y] = latLonToXY(continent[i][0], continent[i][1], w, h);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.restore();
    },
    []
  );

  const drawCities = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      w: number,
      h: number,
      now: number
    ) => {
      const flashes = flashesRef.current;
      for (const city of CITIES) {
        const [cx, cy] = latLonToXY(city.lat, city.lon, w, h);

        // Determine glow intensity from flash
        let flashIntensity = 0;
        const flashTime = flashes.get(city.name);
        if (flashTime !== undefined) {
          const elapsed = now - flashTime;
          if (elapsed < 600) {
            flashIntensity = 1 - elapsed / 600;
          } else {
            flashes.delete(city.name);
          }
        }

        // Outer glow
        ctx.save();
        const baseRadius = 2.5;
        const pulseRadius = baseRadius + flashIntensity * 8;
        const baseColor = flashIntensity > 0.3 ? "#ffffff" : "#00ff88";

        ctx.shadowColor = flashIntensity > 0.3 ? "#ffffff" : "#00ffaa";
        ctx.shadowBlur = 8 + flashIntensity * 24;
        ctx.fillStyle = baseColor;
        ctx.globalAlpha = 0.6 + flashIntensity * 0.4;
        ctx.beginPath();
        ctx.arc(cx, cy, pulseRadius, 0, Math.PI * 2);
        ctx.fill();

        // Inner dot
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        ctx.fillStyle = "#00ff88";
        ctx.beginPath();
        ctx.arc(cx, cy, 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Label (show for all cities, small text)
        ctx.save();
        ctx.font = "9px monospace";
        ctx.fillStyle = `rgba(0,255,136,${0.55 + flashIntensity * 0.45})`;
        ctx.shadowColor = "#00ff88";
        ctx.shadowBlur = 4;
        ctx.fillText(city.name, cx + 5, cy - 5);
        ctx.restore();
      }
    },
    []
  );

  const drawAttacks = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      w: number,
      h: number,
      now: number
    ) => {
      const attacks = attacksRef.current;
      // Remove expired
      attacksRef.current = attacks.filter((a) => now - a.birth < a.lifetime);

      for (const atk of attacksRef.current) {
        const elapsed = now - atk.birth;
        const lifeFraction = elapsed / atk.lifetime;

        // Fade out over last 30% of lifetime
        const fadeStart = 0.7;
        const alpha =
          lifeFraction > fadeStart
            ? 1 - (lifeFraction - fadeStart) / (1 - fadeStart)
            : 1;

        const [x0, y0] = latLonToXY(atk.from.lat, atk.from.lon, w, h);
        const [x1, y1] = latLonToXY(atk.to.lat, atk.to.lon, w, h);

        // Control point — arc upward
        const mx = (x0 + x1) / 2;
        const my = (y0 + y1) / 2;
        const dist = Math.sqrt((x1 - x0) ** 2 + (y1 - y0) ** 2);
        const cpx = mx;
        const cpy = my - dist * 0.35;
        const cp: [number, number] = [cpx, cpy];

        // Draw arc trail
        ctx.save();
        ctx.strokeStyle = atk.color;
        ctx.lineWidth = 1.2;
        ctx.shadowColor = atk.color;
        ctx.shadowBlur = 6;
        ctx.globalAlpha = alpha * 0.5;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.quadraticCurveTo(cpx, cpy, x1, y1);
        ctx.stroke();
        ctx.restore();

        // Particle travels along the curve
        const particleT = Math.min(lifeFraction * 1.5, 1); // particle reaches end at ~66% of lifetime
        if (particleT <= 1) {
          const [px, py] = quadBezier([x0, y0], cp, [x1, y1], particleT);

          // Glowing particle
          ctx.save();
          ctx.shadowColor = atk.color;
          ctx.shadowBlur = 18;
          ctx.fillStyle = "#ffffff";
          ctx.globalAlpha = alpha;
          ctx.beginPath();
          ctx.arc(px, py, 2.5, 0, Math.PI * 2);
          ctx.fill();

          // Secondary glow ring
          ctx.shadowBlur = 30;
          ctx.fillStyle = atk.color;
          ctx.globalAlpha = alpha * 0.5;
          ctx.beginPath();
          ctx.arc(px, py, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // Trail particles
          for (let i = 1; i <= 6; i++) {
            const tt = Math.max(0, particleT - i * 0.03);
            const [tx, ty] = quadBezier([x0, y0], cp, [x1, y1], tt);
            ctx.save();
            ctx.fillStyle = atk.color;
            ctx.globalAlpha = alpha * (0.35 - i * 0.05);
            ctx.shadowColor = atk.color;
            ctx.shadowBlur = 4;
            ctx.beginPath();
            ctx.arc(tx, ty, 1.5 - i * 0.15, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }

        // Flash target city when particle arrives
        if (particleT >= 0.98 && particleT < 1.02) {
          const existing = flashesRef.current.get(atk.to.name);
          if (!existing || now - existing > 500) {
            flashesRef.current.set(atk.to.name, now);
          }
        }
      }
    },
    []
  );

  const drawScanline = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number, now: number) => {
      // Subtle horizontal scanline sweep
      const period = 8000; // ms per full sweep
      const yPos = (((now % period) / period) * h * 1.2) - h * 0.1;
      const gradient = ctx.createLinearGradient(0, yPos - 30, 0, yPos + 30);
      gradient.addColorStop(0, "rgba(0,255,0,0)");
      gradient.addColorStop(0.5, "rgba(0,255,0,0.03)");
      gradient.addColorStop(1, "rgba(0,255,0,0)");
      ctx.save();
      ctx.fillStyle = gradient;
      ctx.fillRect(0, yPos - 30, w, 60);
      ctx.restore();
    },
    []
  );

  // ---- Main animation loop ----
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Resize handler
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();

    const spawnAttack = (now: number) => {
      const from = pickRandom(CITIES);
      let to = pickRandom(CITIES);
      while (to.name === from.name) to = pickRandom(CITIES);
      const color = Math.random() > 0.5 ? "#ff0040" : "#00ffff";
      const lifetime = randomBetween(3000, 4000);
      attacksRef.current.push({ from, to, color, birth: now, lifetime, progress: 0 });
    };

    const frame = (ts: number) => {
      const rect = container.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      // Clear
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, w, h);

      // Spawn new attacks every 1‑2 seconds
      if (ts - lastSpawnRef.current > randomBetween(1000, 2000)) {
        spawnAttack(ts);
        lastSpawnRef.current = ts;
      }

      drawGrid(ctx, w, h);
      drawContinents(ctx, w, h);
      drawAttacks(ctx, w, h, ts);
      drawCities(ctx, w, h, ts);
      drawScanline(ctx, w, h, ts);

      // Vignette overlay
      const vignette = ctx.createRadialGradient(
        w / 2, h / 2, w * 0.2,
        w / 2, h / 2, w * 0.75
      );
      vignette.addColorStop(0, "rgba(0,0,0,0)");
      vignette.addColorStop(1, "rgba(0,0,0,0.45)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, w, h);

      rafRef.current = requestAnimationFrame(frame);
    };

    // Seed a few initial attacks so the screen isn't empty at start
    const now = performance.now();
    for (let i = 0; i < 4; i++) {
      spawnAttack(now);
    }
    lastSpawnRef.current = now;

    rafRef.current = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafRef.current);
      observer.disconnect();
    };
  }, [drawGrid, drawContinents, drawAttacks, drawCities, drawScanline, projectCity]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", overflow: "hidden", background: "#000" }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: "block", width: "100%", height: "100%" }}
      />
    </div>
  );
}

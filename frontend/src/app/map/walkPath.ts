import type { Point } from './roads';
import { DIRECTIONS, type Direction } from '@/components/character/characterManifest';

// Noktalardan geçen yumuşak bir eğri (centripetal Catmull-Rom) üretir.
// Eğri tüm kontrol noktalarından geçer, sadece köşeleri yuvarlar; bu yüzden noktalar yolun ortasında kalır.
export function smoothPath(points: Point[], spacing: number): Point[] {
  if (points.length < 3) return points;

  const result: Point[] = [points[0]];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];
    const steps = Math.max(1, Math.ceil(Math.hypot(p2.x - p1.x, p2.y - p1.y) / spacing));
    for (let s = 1; s <= steps; s++) {
      result.push(catmullRom(p0, p1, p2, p3, s / steps));
    }
  }
  return result;
}

function catmullRom(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const knot = (a: Point, b: Point) => Math.max(Math.sqrt(Math.hypot(b.x - a.x, b.y - a.y)), 1e-4);
  const t1 = knot(p0, p1);
  const t2 = t1 + knot(p1, p2);
  const t3 = t2 + knot(p2, p3);
  const u = t1 + (t2 - t1) * t;

  const lerp = (a: Point, b: Point, ta: number, tb: number) => {
    const w = (u - ta) / (tb - ta);
    return { x: a.x + (b.x - a.x) * w, y: a.y + (b.y - a.y) * w };
  };
  const a1 = lerp(p0, p1, 0, t1);
  const a2 = lerp(p1, p2, t1, t2);
  const a3 = lerp(p2, p3, t2, t3);
  const b1 = lerp(a1, a2, 0, t2);
  const b2 = lerp(a2, a3, t1, t3);
  return lerp(b1, b2, t1, t2);
}

export type Route = {
  length: number;
  pointAt: (d: number) => Point;
};

// Nokta listesi boyunca kat edilen mesafeye göre konum veren rota
export function createRoute(points: Point[]): Route {
  const cumulative = [0];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    cumulative.push(cumulative[i - 1] + Math.hypot(b.x - a.x, b.y - a.y));
  }
  const length = cumulative[cumulative.length - 1];

  const pointAt = (d: number): Point => {
    if (d <= 0) return points[0];
    if (d >= length) return points[points.length - 1];
    let lo = 0;
    let hi = cumulative.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (cumulative[mid] <= d) lo = mid;
      else hi = mid;
    }
    const segment = cumulative[hi] - cumulative[lo];
    const t = segment === 0 ? 0 : (d - cumulative[lo]) / segment;
    const a = points[lo];
    const b = points[hi];
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
  };

  return { length, pointAt };
}

// Bakış yönünü, mevcut yönden belirgin şekilde sapmadıkça değiştirmez (dilim sınırında titremeyi önler)
export function directionWithHysteresis(dx: number, dy: number, current: Direction): Direction {
  const angle = Math.atan2(dy, dx);
  const slice = Math.PI / 4;
  const currentAngle = DIRECTIONS.indexOf(current) * slice;
  const diff = Math.abs(Math.atan2(Math.sin(angle - currentAngle), Math.cos(angle - currentAngle)));
  if (diff <= slice / 2 + (12 * Math.PI) / 180) return current;
  return DIRECTIONS[(Math.round(angle / slice) + 8) % 8];
}

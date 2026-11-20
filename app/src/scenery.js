// scenery.js — the procedural Leonida backdrop.
//
// When a panel has no photograph, the lab paints one from code: a gradient
// sky falling violet to ember, a low sun, a strip of sea, a skyline of dark
// towers with a few lit windows, and palm silhouettes leaning in from the
// edges. The same painter lays the silhouette band along the bottom of the
// Postcard layout, so even a full-bleed photo gets its postcard skyline.
//
// Everything is drawn from a seeded generator (mulberry32), so a scene is
// identical every time it is painted — the screenshots never drift.

import { SKY_STOPS, sampleStops } from './palette.js';

// mulberry32: a tiny deterministic PRNG, seeded per scene.
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function skyGradient(ctx, x, y, w, h) {
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  for (const [t, hex] of SKY_STOPS) {
    const [r, g, b] = sampleStops(SKY_STOPS, t);
    grad.addColorStop(t, `rgb(${r},${g},${b})`);
    void hex;
  }
  return grad;
}

// drawPalm(ctx, x, y, scale, lean, tone)
// One palm: a curved trunk rising from (x, y) and a crown of fronds, each a
// quadratic arc drooping away from the crown. `lean` bends the whole tree.
export function drawPalm(ctx, x, y, scale, lean, tone) {
  ctx.save();
  ctx.strokeStyle = tone;
  ctx.fillStyle = tone;
  ctx.lineCap = 'round';
  const topX = x + lean * scale;
  const topY = y - 1.9 * scale;
  ctx.lineWidth = 0.09 * scale;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + lean * scale * 0.3, y - scale, topX, topY);
  ctx.stroke();
  // Fronds: seven arcs fanning from the crown, drooping at their ends.
  const fronds = 7;
  for (let i = 0; i < fronds; i++) {
    const ang = Math.PI * (0.08 + (0.84 * i) / (fronds - 1));
    const len = scale * (0.85 + 0.3 * Math.sin(i * 2.7));
    const ex = topX + Math.cos(ang) * len;
    const ey = topY - Math.sin(ang) * len * 0.55 + len * 0.34;
    const cx = topX + Math.cos(ang) * len * 0.5;
    const cy = topY - Math.sin(ang) * len * 0.62;
    ctx.lineWidth = 0.045 * scale;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(cx, cy, ex, ey);
    ctx.stroke();
  }
  // Coconuts, because of course.
  ctx.beginPath();
  ctx.arc(topX - 0.07 * scale, topY + 0.06 * scale, 0.07 * scale, 0, Math.PI * 2);
  ctx.arc(topX + 0.08 * scale, topY + 0.08 * scale, 0.06 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// drawSkyline(ctx, x, y, w, baseH, seed, tone, lit)
// A row of towers standing on the line y (their bases), heights randomised
// between 0.35 and 1 times baseH, with a sparse scatter of lit windows.
export function drawSkyline(ctx, x, y, w, baseH, seed, tone, lit) {
  const rand = rng(seed);
  ctx.save();
  ctx.fillStyle = tone;
  let cx = x - rand() * baseH * 0.2;
  while (cx < x + w) {
    const bw = baseH * (0.28 + rand() * 0.5);
    const bh = baseH * (0.35 + rand() * 0.65);
    ctx.fillRect(cx, y - bh, bw, bh);
    if (rand() > 0.55) ctx.fillRect(cx + bw * 0.3, y - bh - baseH * 0.07, bw * 0.4, baseH * 0.07);
    // Windows: a loose grid, most dark, a few lit.
    const cols = Math.max(1, Math.floor(bw / (baseH * 0.11)));
    const rows = Math.max(1, Math.floor(bh / (baseH * 0.13)));
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        if (rand() > 0.24) continue;
        ctx.fillStyle = lit;
        ctx.globalAlpha = 0.5 + rand() * 0.5;
        ctx.fillRect(
          cx + (i + 0.5) * (bw / cols) - baseH * 0.018,
          y - bh + (j + 0.5) * (bh / rows) - baseH * 0.024,
          baseH * 0.036,
          baseH * 0.048,
        );
        ctx.globalAlpha = 1;
        ctx.fillStyle = tone;
      }
    }
    cx += bw + baseH * (0.02 + rand() * 0.08);
  }
  ctx.restore();
}

// drawScene(ctx, x, y, w, h, seed)
// The full postcard: sky, sun with a soft halo, a sea band glittering at
// the horizon, skyline, and two palms framing the corners. Fills the rect.
export function drawScene(ctx, x, y, w, h, seed) {
  const rand = rng(seed + 7);
  ctx.save();
  ctx.fillStyle = skyGradient(ctx, x, y, w, h);
  ctx.fillRect(x, y, w, h);
  // Sun: a fat disc low in the sky, with two thin cloud cuts across it —
  // the whole Leonida postcard trade in one gesture.
  const sunR = h * 0.21;
  const sunX = x + w * (0.34 + rand() * 0.32);
  const sunY = y + h * 0.58;
  const halo = ctx.createRadialGradient(sunX, sunY, sunR * 0.4, sunX, sunY, sunR * 2.6);
  halo.addColorStop(0, 'rgba(255, 190, 90, 0.55)');
  halo.addColorStop(1, 'rgba(255, 120, 80, 0)');
  ctx.fillStyle = halo;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#ffd98c';
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(227, 62, 110, 0.5)';
  ctx.fillRect(sunX - sunR, sunY + sunR * 0.18, sunR * 2, sunR * 0.07);
  ctx.fillRect(sunX - sunR, sunY + sunR * 0.48, sunR * 2, sunR * 0.1);
  // Sea: the bottom fifth, darker, with dashed glints under the sun.
  const seaY = y + h * 0.8;
  ctx.fillStyle = 'rgba(18, 8, 40, 0.55)';
  ctx.fillRect(x, seaY, w, y + h - seaY);
  ctx.strokeStyle = 'rgba(255, 200, 120, 0.7)';
  ctx.lineWidth = Math.max(1, h * 0.006);
  for (let i = 0; i < 14; i++) {
    const gy = seaY + (i / 14) * (h * 0.19) + rand() * 3;
    const gw = sunR * (0.3 + rand() * 0.9) * (1 - i / 22);
    ctx.beginPath();
    ctx.moveTo(sunX - gw / 2 + (rand() - 0.5) * 8, gy);
    ctx.lineTo(sunX + gw / 2 + (rand() - 0.5) * 8, gy);
    ctx.stroke();
  }
  // Land: skyline along the sea line, palms leaning in.
  drawSkyline(ctx, x, seaY + h * 0.012, w, h * 0.3, seed + 3, '#12071f', '#ffd98c');
  ctx.fillStyle = '#0d0518';
  ctx.fillRect(x, seaY + h * 0.012, w, h * 0.02);
  drawPalm(ctx, x + w * 0.07, y + h, h * 0.3, 0.35, '#0d0518');
  drawPalm(ctx, x + w * 0.95, y + h, h * 0.24, -0.3, '#0d0518');
  ctx.restore();
}

// drawSilhouetteBand(ctx, x, y, w, h, seed)
// Just the dark part — skyline and palms with no sky — for laying over the
// bottom of a photograph in the Postcard layout.
export function drawSilhouetteBand(ctx, x, y, w, h, seed) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  drawSkyline(ctx, x, y + h, w, h * 1.5, seed + 11, 'rgba(10, 4, 22, 0.92)', '#ffca7a');
  ctx.fillStyle = 'rgba(10, 4, 22, 0.92)';
  ctx.fillRect(x, y + h - h * 0.06, w, h * 0.06);
  drawPalm(ctx, x + w * 0.05, y + h + 4, h * 1.15, 0.3, 'rgba(10, 4, 22, 0.95)');
  drawPalm(ctx, x + w * 0.97, y + h + 4, h * 0.95, -0.28, 'rgba(10, 4, 22, 0.95)');
  ctx.restore();
}

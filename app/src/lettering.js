// lettering.js — the cover's voice: display title, script subtitle, badge.
//
// The title is set in Anton, filled with the sunset itself (a vertical
// gradient poured through the letterforms), keylined in ink and dropped a
// few pixels onto a hard shadow — the whole poster-lettering trick in one
// function. The subtitle answers in Pacifico with a neon glow, and the
// ribbon badge stamps the corner like the lab's seal of approval.

import { CREAM, INK, NEON_PINK, sampleStops, SKY_STOPS } from './palette.js';

export const DISPLAY_FONT = 'Anton';
export const SCRIPT_FONT = 'Pacifico';

// fitSize(ctx, text, family, maxWidth, startSize, minSize)
// The largest font size (<= startSize) at which `text` fits maxWidth.
export function fitSize(ctx, text, family, maxWidth, startSize, minSize = 10) {
  let size = startSize;
  ctx.font = `${size}px ${family}`;
  while (size > minSize && ctx.measureText(text).width > maxWidth) {
    size *= 0.92;
    ctx.font = `${size}px ${family}`;
  }
  return size;
}

// wrapTitle(ctx, title, family, size, maxWidth) -> [lines]
// Greedy word wrap at a given size; a single over-long word gets its own
// line and is shrunk by the caller via fitSize on the widest line.
export function wrapTitle(ctx, title, family, size, maxWidth) {
  ctx.font = `${size}px ${family}`;
  const words = title.toUpperCase().split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for ( const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

function sunsetFill(ctx, y, height) {
  const grad = ctx.createLinearGradient(0, y, 0, y + height);
  // Read top-to-bottom as sky-in-reverse: cream, ember, pink, violet foot.
  const stops = [
    [0, '#fff3c4'],
    [0.38, '#ffb347'],
    [0.68, '#ff5e78'],
    [1, '#c22a63'],
  ];
  for (const [t, hex] of stops) grad.addColorStop(t, hex);
  void sampleStops;
  void SKY_STOPS;
  return grad;
}

// drawTitle(ctx, { title, x, y, maxWidth, size, align }) -> height drawn
// y is the TOP of the title block. Lines are centred on x when align is
// 'center', or start at x when 'left'.
export function drawTitle(ctx, { title, x, y, maxWidth, size, align = 'center' }) {
  const lines = wrapTitle(ctx, title || '', DISPLAY_FONT, size, maxWidth);
  // Shrink until the widest line fits, so a long word never spills.
  let s = size;
  for (const line of lines) s = Math.min(s, fitSize(ctx, line, DISPLAY_FONT, maxWidth, s));
  const lineHeight = s * 1.04;
  const total = lineHeight * lines.length;
  ctx.save();
  ctx.font = `${s}px ${DISPLAY_FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  ctx.lineJoin = 'round';
  lines.forEach((line, i) => {
    const ly = y + i * lineHeight;
    // Hard shadow, ink keyline, then the sunset poured in.
    ctx.fillStyle = 'rgba(10, 4, 22, 0.55)';
    ctx.fillText(line, x + s * 0.045, ly + s * 0.05);
    ctx.strokeStyle = INK;
    ctx.lineWidth = s * 0.16;
    ctx.strokeText(line, x, ly);
    ctx.fillStyle = sunsetFill(ctx, ly, lineHeight);
    ctx.fillText(line, x, ly);
  });
  ctx.restore();
  return total;
}

// drawSubtitle(ctx, { text, x, y, size, align }) — Pacifico, cream with a
// pink neon halo; y is the top of the line.
export function drawSubtitle(ctx, { text, x, y, size, align = 'center' }) {
  if (!text) return 0;
  ctx.save();
  const s = fitSize(ctx, text, SCRIPT_FONT, size * 14, size);
  ctx.font = `${s}px ${SCRIPT_FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  ctx.shadowColor = NEON_PINK;
  ctx.shadowBlur = s * 0.45;
  ctx.fillStyle = CREAM;
  ctx.fillText(text, x, y);
  ctx.shadowBlur = s * 0.18;
  ctx.fillText(text, x, y);
  ctx.restore();
  return s * 1.3;
}

// drawBadge(ctx, { x, y, size, text }) — a ribbon pill centred on (x, y),
// tipped a few degrees like it was stamped in a hurry. `size` is its height.
export function drawBadge(ctx, { x, y, size, text }) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.09);
  ctx.font = `${size * 0.46}px ${DISPLAY_FONT}`;
  const tw = ctx.measureText(text.toUpperCase()).width;
  const w = tw + size * 1.5;
  const h = size;
  const grad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
  grad.addColorStop(0, '#e33e6e');
  grad.addColorStop(1, '#8f1d6e');
  ctx.fillStyle = grad;
  ctx.strokeStyle = CREAM;
  ctx.lineWidth = size * 0.045;
  roundRect(ctx, -w / 2, -h / 2, w, h, h * 0.32);
  ctx.fill();
  ctx.stroke();
  // Stitch line, because ribbons have those.
  ctx.strokeStyle = 'rgba(253, 243, 216, 0.6)';
  ctx.lineWidth = size * 0.022;
  ctx.setLineDash([size * 0.09, size * 0.07]);
  roundRect(ctx, -w / 2 + size * 0.11, -h / 2 + size * 0.11, w - size * 0.22, h - size * 0.22, h * 0.24);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = CREAM;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text.toUpperCase(), 0, size * 0.03);
  ctx.restore();
}

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

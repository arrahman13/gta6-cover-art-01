// cover.js — the composer. One state in, one cover out.
//
// renderCover paints, in order: the paper the cover is printed on, every
// panel (photograph graded, or a painted scene where no photo sits), the
// filmstrip's sprocket band or the postcard's silhouette shore where the
// layout asks for them, the lettering (medallion on the grid, a title block
// elsewhere, the ribbon badge in a corner), and finally grain and vignette
// over everything, because print is a physical thing.
//
// Panel painting is cached: a graded panel is an offscreen canvas keyed by
// photo, grade, size and transform, so dragging in the editor only repaints
// the panel being dragged.

import { layoutPanels } from './panels.js';
import { gradeCanvas } from './grade.js';
import { drawScene, drawSilhouetteBand, rng } from './scenery.js';
import { drawGhost } from './ghost.js';
import { drawTitle, drawSubtitle, drawBadge } from './lettering.js';
import { INK, PAPER } from './palette.js';

// computeLayout(W, H, layoutId) -> pixel geometry shared by the painter
// and the editor's hit-testing, so what you click is what was painted.
export function computeLayout(W, H, layoutId) {
  const info = layoutPanels(layoutId, W / H);
  const gutter = Math.max(5, Math.round(Math.min(W, H) * 0.009));
  const toPx = (r) => ({ x: r.x * W, y: r.y * H, w: r.w * W, h: r.h * H, backdrop: !!r.backdrop, frame: !!r.frame });
  const panels = info.panels.map((r) => {
    const p = toPx(r);
    if (p.backdrop || info.postcard) return p; // full bleed keeps its edges
    const inset = p.frame ? gutter * 0.6 : gutter;
    return { ...p, x: p.x + inset, y: p.y + inset, w: p.w - inset * 2, h: p.h - inset * 2 };
  });
  let medallion = null;
  if (info.medallion) {
    const m = toPx(info.medallion);
    medallion = {
      cx: m.x + m.w / 2,
      cy: m.y + m.h / 2,
      r: Math.min(m.w, m.h) / 2 - gutter * 0.5,
      cell: m,
    };
  }
  return { panels, medallion, film: info.film, postcard: info.postcard, gutter };
}

// --- panel painting, cached -------------------------------------------------

const panelCache = new Map();
const CACHE_MAX = 48;

function cacheGet(key) {
  const hit = panelCache.get(key);
  if (hit) {
    panelCache.delete(key);
    panelCache.set(key, hit); // refresh recency
  }
  return hit;
}

function cachePut(key, canvas) {
  if (panelCache.size >= CACHE_MAX) panelCache.clear();
  panelCache.set(key, canvas);
}

function drawPhotoCover(ctx, img, w, h, slot) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.max(w / iw, h / ih) * (slot.zoom || 1);
  const dw = iw * scale;
  const dh = ih * scale;
  const cx = w / 2 + (slot.dx || 0) * w;
  const cy = h / 2 + (slot.dy || 0) * h;
  ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
}

// paintPanel(panelIndex, slot, photos, gradeId, w, h) -> canvas at w x h.
function paintPanel(panelIndex, slot, photos, gradeId, w, h) {
  const photoIdx = slot && slot.photo != null ? slot.photo : -1;
  const key = [
    photoIdx, gradeId, w, h,
    slot ? (slot.dx || 0).toFixed(3) : 0,
    slot ? (slot.dy || 0).toFixed(3) : 0,
    slot ? (slot.zoom || 1).toFixed(3) : 1,
  ].join('|');
  const cached = cacheGet(key);
  if (cached) return cached;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(w));
  canvas.height = Math.max(1, Math.round(h));
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const img = photoIdx >= 0 ? photos[photoIdx] : null;
  if (img && (img.naturalWidth || img.width)) {
    drawPhotoCover(ctx, img, canvas.width, canvas.height, slot);
  } else {
    // No photograph: the lab paints a scene, a different evening per panel.
    drawScene(ctx, 0, 0, canvas.width, canvas.height, 100 + panelIndex * 37);
  }
  gradeCanvas(canvas, gradeId);
  cachePut(key, canvas);
  return canvas;
}

// --- grain ------------------------------------------------------------------
// One seeded noise tile, painted tiled over the cover at low alpha. Seeded,
// so the grain on a screenshot is the grain on every export.

let grainTile = null;
function makeGrainTile() {
  const tile = document.createElement('canvas');
  tile.width = 256;
  tile.height = 256;
  const ctx = tile.getContext('2d');
  const img = ctx.createImageData(256, 256);
  const rand = rng(20261119);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 96 + Math.floor(rand() * 128);
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return tile;
}

function paintGrain(ctx, W, H) {
  if (!grainTile) grainTile = makeGrainTile();
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.globalCompositeOperation = 'overlay';
  const pattern = ctx.createPattern(grainTile, 'repeat');
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

function paintVignette(ctx, W, H) {
  const r = Math.hypot(W, H) / 2;
  const grad = ctx.createRadialGradient(W / 2, H / 2, r * 0.45, W / 2, H / 2, r);
  grad.addColorStop(0, 'rgba(10, 4, 22, 0)');
  grad.addColorStop(1, 'rgba(10, 4, 22, 0.4)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

// --- lettering placement ------------------------------------------------------

function paintMedallion(ctx, med, state) {
  const { cx, cy, r } = med;
  ctx.save();
  // A wash of sunset across the medallion's cell, so the disc sits in a
  // pool of evening light rather than on bare paper.
  if (med.cell) {
    const wash = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 1.45);
    wash.addColorStop(0, 'rgba(255, 196, 107, 0.5)');
    wash.addColorStop(0.6, 'rgba(255, 122, 61, 0.22)');
    wash.addColorStop(1, 'rgba(255, 46, 136, 0)');
    ctx.fillStyle = wash;
    ctx.fillRect(med.cell.x, med.cell.y, med.cell.w, med.cell.h);
  }
  // The disc: a painted evening, ringed in ink and paper.
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = INK;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.94, 0, Math.PI * 2);
  ctx.save();
  ctx.clip();
  drawScene(ctx, cx - r, cy - r, r * 2, r * 2, 55);
  ctx.restore();
  ctx.lineWidth = Math.max(2, r * 0.03);
  ctx.strokeStyle = PAPER;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.94, 0, Math.PI * 2);
  ctx.stroke();
  // The ghost presides; the title sits under it like a nameplate.
  drawGhost(ctx, cx, cy - r * 0.44, r * 0.52, { blush: true });
  const titleH = drawTitle(ctx, {
    title: state.title,
    x: cx,
    y: cy + r * 0.02,
    maxWidth: r * 1.52,
    size: r * 0.34,
    align: 'center',
  });
  drawSubtitle(ctx, {
    text: state.subtitle,
    x: cx,
    y: cy + r * 0.02 + titleH + r * 0.03,
    size: r * 0.17,
    align: 'center',
  });
  ctx.restore();
}

function paintTitleBlock(ctx, W, H, state, mode) {
  const unit = Math.min(W, H);
  if (mode === 'postcard') {
    // Bottom-left, above the silhouette shore, left-aligned like a caption
    // written on the back of the postcard and showing through.
    const titleH = drawTitle(ctx, {
      title: state.title, x: W * 0.05, y: H * 0.66, maxWidth: W * 0.72, size: unit * 0.13, align: 'left',
    });
    drawSubtitle(ctx, { text: state.subtitle, x: W * 0.055, y: H * 0.66 + titleH + unit * 0.012, size: unit * 0.045, align: 'left' });
  } else if (mode === 'film') {
    const titleH = drawTitle(ctx, {
      title: state.title, x: W * 0.05, y: H * 0.055, maxWidth: W * 0.75, size: unit * 0.12, align: 'left',
    });
    drawSubtitle(ctx, { text: state.subtitle, x: W * 0.055, y: H * 0.055 + titleH + unit * 0.01, size: unit * 0.042, align: 'left' });
  } else {
    const titleH = drawTitle(ctx, {
      title: state.title, x: W / 2, y: H * 0.04, maxWidth: W * 0.84, size: unit * 0.115, align: 'center',
    });
    drawSubtitle(ctx, { text: state.subtitle, x: W / 2, y: H * 0.04 + titleH + unit * 0.008, size: unit * 0.04, align: 'center' });
  }
  if (state.badge) {
    // Measure the ribbon before placing it, so its tail never leaves the
    // print however long the badge text runs.
    const badgeSize = unit * 0.05;
    ctx.save();
    ctx.font = `${badgeSize * 0.46}px Anton`;
    const badgeW = ctx.measureText(state.badgeText.toUpperCase()).width + badgeSize * 1.5;
    ctx.restore();
    drawBadge(ctx, {
      x: Math.min(W * 0.9, W - badgeW / 2 - W * 0.018),
      y: mode === 'postcard' ? H * 0.08 : H * 0.93,
      size: badgeSize,
      text: state.badgeText,
    });
  }
}

// --- the composition ----------------------------------------------------------

// renderCover(ctx, W, H, state, photos)
// state: { layout, grade, title, subtitle, badge, badgeText, grain,
//          vignette, slots: [{ photo, dx, dy, zoom }] }
export function renderCover(ctx, W, H, state, photos) {
  const geo = computeLayout(W, H, state.layout);
  ctx.save();
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);

  if (geo.film) paintFilmBase(ctx, W, H, geo);

  geo.panels.forEach((panel, i) => {
    const slot = state.slots[i] || { photo: null, dx: 0, dy: 0, zoom: 1 };
    const painted = paintPanel(i, slot, photos, state.grade, Math.round(panel.w), Math.round(panel.h));
    ctx.drawImage(painted, panel.x, panel.y, panel.w, panel.h);
    if (panel.backdrop) {
      // The filmstrip's backdrop sits under black bands; dim it so the
      // frames and the title carry the eye.
      ctx.fillStyle = 'rgba(10, 4, 22, 0.38)';
      ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
    }
    if (!panel.backdrop) {
      ctx.strokeStyle = INK;
      ctx.lineWidth = Math.max(1.5, geo.gutter * 0.28);
      ctx.strokeRect(panel.x, panel.y, panel.w, panel.h);
    }
  });

  if (geo.film) paintFilmBand(ctx, W, H, geo);
  if (geo.postcard) {
    drawSilhouetteBand(ctx, 0, H * 0.84, W, H * 0.16, 9);
  }

  if (geo.medallion) {
    paintMedallion(ctx, geo.medallion, state);
  } else {
    paintTitleBlock(ctx, W, H, state, geo.postcard ? 'postcard' : geo.film ? 'film' : 'top');
  }

  if (state.grain) paintGrain(ctx, W, H);
  if (state.vignette) paintVignette(ctx, W, H);

  // The print's own edge: an ink frame just inside the paper.
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(2, geo.gutter * 0.5);
  ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, W - ctx.lineWidth, H - ctx.lineWidth);
  ctx.restore();
}

// The filmstrip's black band: a solid strip behind the frames, painted
// before them, and its sprocket rails, painted after (see paintFilmBand).
function filmBandRect(W, H, geo) {
  const frames = geo.panels.filter((p) => p.frame);
  const rail = H * 0.045;
  const top = Math.min(...frames.map((p) => p.y)) - geo.gutter * 0.6 - rail;
  const bottom = Math.max(...frames.map((p) => p.y + p.h)) + geo.gutter * 0.6 + rail;
  return { top, bottom, rail };
}

function paintFilmBase(ctx, W, H, geo) {
  const { top, bottom } = filmBandRect(W, H, geo);
  ctx.fillStyle = '#0a0416';
  ctx.fillRect(0, top, W, bottom - top);
}

// The sprocket rails: rows of little paper windows punched along the top
// and bottom edges of the band.
function paintFilmBand(ctx, W, H, geo) {
  const frames = geo.panels.filter((p) => p.frame);
  if (!frames.length) return;
  const { rail } = filmBandRect(W, H, geo);
  const top = Math.min(...frames.map((p) => p.y)) - geo.gutter * 0.6;
  const bottom = Math.max(...frames.map((p) => p.y + p.h)) + geo.gutter * 0.6;
  ctx.save();
  ctx.fillStyle = PAPER;
  const holeW = W * 0.016;
  const holeH = rail * 0.44;
  const step = W / 24;
  for (let x = step / 2; x < W; x += step) {
    roundHole(ctx, x - holeW / 2, top - rail / 2 - holeH / 2, holeW, holeH);
    roundHole(ctx, x - holeW / 2, bottom + rail / 2 - holeH / 2, holeW, holeH);
  }
  ctx.restore();
}

function roundHole(ctx, x, y, w, h) {
  const r = Math.min(w, h) * 0.32;
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
  ctx.fill();
}

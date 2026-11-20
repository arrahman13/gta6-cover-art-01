// main.js — Leonida Cover Lab's editor.
//
// Wires the page to the composer: a photo tray (the three bundled samples
// plus whatever the visitor adds — read on this machine, never uploaded),
// the layout and grade pickers, the lettering fields, per-panel drag, zoom
// and swapping, and the three export sizes. In a ?shot= scene it sets the
// state from shots.js before first paint and, for cover scenes, stretches
// the canvas across the whole window so the render is the screenshot.

import { renderCover, computeLayout } from './cover.js';
import { LAYOUTS, LAYOUT_ORDER, panelCount } from './panels.js';
import { GRADES, GRADE_ORDER } from './palette.js';
import { drawGhost } from './ghost.js';
import { shotFromLocation } from './shots.js';

const SAMPLES = [
  { src: 'samples/boulevard.jpg', name: 'Boulevard, golden hour' },
  { src: 'samples/rooftop.jpg', name: 'Rooftop, last light' },
  { src: 'samples/neon.jpg', name: 'Diner, after the rain' },
];

const SIZES = [
  { id: 'square', label: 'Post · 1080 × 1080', w: 1080, h: 1080 },
  { id: 'portrait', label: 'Portrait · 1080 × 1350', w: 1080, h: 1350 },
  { id: 'wide', label: 'Wide · 1920 × 1080', w: 1920, h: 1080 },
];

const state = {
  layout: 'grid',
  grade: 'sunset',
  title: 'PALM HEAT',
  subtitle: 'wish you were here',
  badge: true,
  badgeText: 'Leonida · Est. 2026',
  grain: true,
  vignette: true,
  slots: [],
  sizeId: 'square',
};

const photos = []; // [{ img, name }]
let selectedPanel = 0;
let activePhoto = 0;

const stage = document.getElementById('stage');
const sctx = stage.getContext('2d');
const shot = shotFromLocation();

// --- state helpers ------------------------------------------------------------

function currentSize() {
  return SIZES.find((s) => s.id === state.sizeId) || SIZES[0];
}

function ensureSlots() {
  // Slots are never truncated: switching to a smaller layout and back must
  // not forget which photo sat in the panels it could not show.
  const n = panelCount(state.layout, currentSize().w / currentSize().h);
  while (state.slots.length < n) state.slots.push({ photo: null, dx: 0, dy: 0, zoom: 1 });
  if (selectedPanel >= n) selectedPanel = 0;
}

function assign(panelIdx, photoIdx) {
  ensureSlots();
  state.slots[panelIdx] = { photo: photoIdx, dx: 0, dy: 0, zoom: 1 };
}

function fillAll(photoIdx) {
  ensureSlots();
  state.slots = state.slots.map(() => ({ photo: photoIdx, dx: 0, dy: 0, zoom: 1 }));
}

// --- rendering ------------------------------------------------------------------

function previewDims() {
  if (shot && shot.mode === 'cover') {
    return { w: window.innerWidth, h: window.innerHeight };
  }
  const { w, h } = currentSize();
  const long = 980;
  return w >= h ? { w: long, h: Math.round((long * h) / w) } : { w: Math.round((long * w) / h), h: long };
}

function render() {
  ensureSlots();
  const { w, h } = previewDims();
  if (stage.width !== w || stage.height !== h) {
    stage.width = w;
    stage.height = h;
  }
  renderCover(sctx, w, h, state, photos.map((p) => p.img));
  if (!shot || shot.mode !== 'cover') {
    // The editor marks the selected panel; exports never see the mark.
    const geo = computeLayout(w, h, state.layout);
    const p = geo.panels[selectedPanel];
    if (p) {
      sctx.save();
      sctx.strokeStyle = '#ff2e88';
      sctx.lineWidth = 3;
      sctx.setLineDash([10, 7]);
      sctx.strokeRect(p.x + 2, p.y + 2, p.w - 4, p.h - 4);
      sctx.restore();
    }
  }
}

function exportPng(size) {
  const canvas = document.createElement('canvas');
  canvas.width = size.w;
  canvas.height = size.h;
  renderCover(canvas.getContext('2d'), size.w, size.h, state, photos.map((p) => p.img));
  canvas.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `leonida-cover-${size.w}x${size.h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }, 'image/png');
}

// --- photo tray -----------------------------------------------------------------

const thumbsEl = document.getElementById('thumbs');

function renderThumbs() {
  thumbsEl.innerHTML = '';
  photos.forEach((photo, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'thumb' + (i === activePhoto ? ' active' : '');
    btn.title = `${photo.name} — click to put it in the selected panel, double-click to fill every panel`;
    const img = document.createElement('img');
    img.src = photo.img.src;
    img.alt = photo.name;
    btn.appendChild(img);
    btn.addEventListener('click', () => {
      activePhoto = i;
      assign(selectedPanel, i);
      renderThumbs();
      render();
    });
    btn.addEventListener('dblclick', () => {
      activePhoto = i;
      fillAll(i);
      renderThumbs();
      render();
    });
    thumbsEl.appendChild(btn);
  });
}

function loadImage(src, name) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ img, name });
    img.onerror = reject;
    img.src = src;
  });
}

document.getElementById('photoInput').addEventListener('change', async (e) => {
  for (const file of e.target.files) {
    const url = URL.createObjectURL(file);
    try {
      const photo = await loadImage(url, file.name);
      photos.push(photo);
    } catch { /* a file that is not a picture simply does not join the tray */ }
  }
  renderThumbs();
  render();
});

// --- controls ---------------------------------------------------------------------

function picker(elId, order, labels, current, onPick) {
  const el = document.getElementById(elId);
  el.innerHTML = '';
  for (const id of order) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = labels[id].label || labels[id];
    btn.className = 'chip' + (id === current() ? ' on' : '');
    btn.addEventListener('click', () => {
      onPick(id);
      picker(elId, order, labels, current, onPick);
      render();
    });
    el.appendChild(btn);
  }
}

function bindControls() {
  picker('layouts', LAYOUT_ORDER, LAYOUTS, () => state.layout, (id) => { state.layout = id; ensureSlots(); });
  picker('grades', GRADE_ORDER, GRADES, () => state.grade, (id) => { state.grade = id; });

  const sizeEl = document.getElementById('sizeSelect');
  for (const s of SIZES) {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = s.label;
    sizeEl.appendChild(opt);
  }
  sizeEl.value = state.sizeId;
  sizeEl.addEventListener('change', () => { state.sizeId = sizeEl.value; render(); });

  const bindText = (id, apply) => {
    const el = document.getElementById(id);
    el.addEventListener('input', () => { apply(el.value); render(); });
  };
  bindText('titleInput', (v) => { state.title = v; });
  bindText('subtitleInput', (v) => { state.subtitle = v; });
  bindText('badgeText', (v) => { state.badgeText = v; });
  document.getElementById('titleInput').value = state.title;
  document.getElementById('subtitleInput').value = state.subtitle;
  document.getElementById('badgeText').value = state.badgeText;

  const bindToggle = (id, key) => {
    const el = document.getElementById(id);
    el.checked = state[key];
    el.addEventListener('change', () => { state[key] = el.checked; render(); });
  };
  bindToggle('badgeToggle', 'badge');
  bindToggle('grainToggle', 'grain');
  bindToggle('vignetteToggle', 'vignette');

  document.getElementById('fillAll').addEventListener('click', () => { fillAll(activePhoto); render(); });
  document.getElementById('clearPanel').addEventListener('click', () => {
    state.slots[selectedPanel] = { photo: null, dx: 0, dy: 0, zoom: 1 };
    render();
  });
  document.getElementById('swapPanel').addEventListener('click', () => {
    // Cycle the selected panel through the tray — the fastest swap there is.
    const slot = state.slots[selectedPanel];
    const next = slot.photo == null ? 0 : (slot.photo + 1) % photos.length;
    assign(selectedPanel, next);
    activePhoto = next;
    renderThumbs();
    render();
  });

  const zoom = document.getElementById('zoomRange');
  zoom.addEventListener('input', () => {
    state.slots[selectedPanel].zoom = Number(zoom.value);
    render();
  });
  document.getElementById('resetView').addEventListener('click', () => {
    const slot = state.slots[selectedPanel];
    slot.dx = 0;
    slot.dy = 0;
    slot.zoom = 1;
    zoom.value = '1';
    render();
  });

  for (const btn of document.querySelectorAll('[data-export]')) {
    btn.addEventListener('click', () => {
      const size = SIZES.find((s) => s.id === btn.dataset.export);
      if (size) exportPng(size);
    });
  }
}

// --- canvas gestures ---------------------------------------------------------------

function stagePoint(e) {
  const rect = stage.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) / rect.width) * stage.width,
    y: ((e.clientY - rect.top) / rect.height) * stage.height,
  };
}

function panelAt(x, y) {
  const geo = computeLayout(stage.width, stage.height, state.layout);
  for (let i = geo.panels.length - 1; i >= 0; i--) {
    const p = geo.panels[i];
    if (x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) return i;
  }
  return -1;
}

function bindGestures() {
  let drag = null;
  stage.addEventListener('pointerdown', (e) => {
    const pt = stagePoint(e);
    const idx = panelAt(pt.x, pt.y);
    if (idx < 0) return;
    selectedPanel = idx;
    const slot = state.slots[idx];
    drag = { idx, startX: pt.x, startY: pt.y, dx: slot.dx || 0, dy: slot.dy || 0 };
    stage.setPointerCapture(e.pointerId);
    syncZoom();
    render();
  });
  stage.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const pt = stagePoint(e);
    const geo = computeLayout(stage.width, stage.height, state.layout);
    const p = geo.panels[drag.idx];
    const slot = state.slots[drag.idx];
    slot.dx = clamp(drag.dx + (pt.x - drag.startX) / p.w, -0.6, 0.6);
    slot.dy = clamp(drag.dy + (pt.y - drag.startY) / p.h, -0.6, 0.6);
    render();
  });
  stage.addEventListener('pointerup', () => { drag = null; });
  stage.addEventListener('wheel', (e) => {
    const pt = stagePoint(e);
    const idx = panelAt(pt.x, pt.y);
    if (idx < 0) return;
    e.preventDefault();
    selectedPanel = idx;
    const slot = state.slots[idx];
    slot.zoom = clamp((slot.zoom || 1) * (e.deltaY < 0 ? 1.08 : 0.93), 1, 3.5);
    syncZoom();
    render();
  }, { passive: false });
}

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

function syncZoom() {
  document.getElementById('zoomRange').value = String(state.slots[selectedPanel]?.zoom || 1);
}

// --- boot -----------------------------------------------------------------------------

async function boot() {
  if (shot) {
    document.body.classList.add('shot', `shot-${shot.mode}`);
    state.layout = shot.layout;
    state.grade = shot.grade;
    state.title = shot.title;
    state.subtitle = shot.subtitle;
    if (shot.sizeId) state.sizeId = shot.sizeId;
  }
  bindControls();
  bindGestures();

  // The brand ghost waves from the header, drawn not pasted.
  const brand = document.getElementById('brandGhost');
  if (brand) drawGhost(brand.getContext('2d'), 36, 38, 62, { blush: true });

  for (const sample of SAMPLES) {
    try {
      photos.push(await loadImage(sample.src, sample.name));
    } catch { /* a missing sample leaves the tray shorter, never broken */ }
  }
  if (shot && shot.assign) {
    shot.assign.forEach((photoIdx, panelIdx) => assign(panelIdx, photoIdx));
  } else if (shot && shot.fill != null) {
    fillAll(shot.fill);
  }
  activePhoto = 0;
  renderThumbs();

  // Lettering is only honest once the fonts have actually arrived.
  await Promise.all([
    document.fonts.load('100px Anton'),
    document.fonts.load('40px Pacifico'),
    document.fonts.ready,
  ]);
  render();
  document.body.dataset.ready = 'yes';
}

boot();

// grade.js — per-pixel colour grading by gradient mapping.
//
// A photograph goes in one end and the same photograph wearing Leonida's
// evening light comes out the other. The recipe per pixel: shape the photo
// with the grade's saturation and contrast, read its luminance, look that
// luminance up in the grade's gradient map, then blend photo and map by the
// grade's mix. The map is precomputed once per grade into three 256-entry
// tables, so the inner loop is a handful of array reads per pixel.
//
// Grading happens on an offscreen canvas at the panel's own size and the
// result is cached by cover.js; nothing here touches the network or the DOM
// beyond a scratch canvas.

import { GRADES, sampleStops } from './palette.js';

const lutCache = new Map();

// buildLut(gradeId) -> { r, g, b } Uint8 arrays of 256 entries each.
export function buildLut(gradeId) {
  let lut = lutCache.get(gradeId);
  if (lut) return lut;
  const grade = GRADES[gradeId];
  const r = new Uint8Array(256);
  const g = new Uint8Array(256);
  const b = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    const [cr, cg, cb] = sampleStops(grade.stops, i / 255);
    r[i] = cr;
    g[i] = cg;
    b[i] = cb;
  }
  lut = { r, g, b };
  lutCache.set(gradeId, lut);
  return lut;
}

const scratch = document.createElement('canvas');

// gradeImage(source, width, height, gradeId) -> canvas
// Draws `source` (anything drawImage accepts) into a width x height canvas
// using a plain cover fit, then grades every pixel in place. Callers that
// need pan/zoom inside a panel draw their transformed photo onto a canvas
// first and pass that canvas here at panel size.
export function gradeCanvas(sourceCanvas, gradeId) {
  const w = sourceCanvas.width;
  const h = sourceCanvas.height;
  if (w === 0 || h === 0) return sourceCanvas;
  const grade = GRADES[gradeId];
  const lut = buildLut(gradeId);
  const ctx = sourceCanvas.getContext('2d', { willReadFrequently: true });
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const sat = grade.sat;
  const con = grade.contrast;
  const mix = grade.mix;
  const keep = 1 - mix;
  for (let i = 0; i < d.length; i += 4) {
    let r = d[i];
    let g = d[i + 1];
    let b = d[i + 2];
    // Contrast around mid-grey, then saturation around the pixel's own luma.
    r = (r - 128) * con + 128;
    g = (g - 128) * con + 128;
    b = (b - 128) * con + 128;
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    r = luma + (r - luma) * sat;
    g = luma + (g - luma) * sat;
    b = luma + (b - luma) * sat;
    const li = luma < 0 ? 0 : luma > 255 ? 255 : luma | 0;
    d[i] = r * keep + lut.r[li] * mix;
    d[i + 1] = g * keep + lut.g[li] * mix;
    d[i + 2] = b * keep + lut.b[li] * mix;
  }
  ctx.putImageData(img, 0, 0);
  return sourceCanvas;
}

// gradeDraw(ctx, image, dx, dy, dw, dh, gradeId)
// Convenience for scenes that are already composed (the procedural postcard
// backdrop): draws the image into a scratch canvas at the target size,
// grades it, and paints it onto ctx. Returns nothing; sizes stay whole.
export function gradeDraw(ctx, image, dx, dy, dw, dh, gradeId) {
  scratch.width = Math.max(1, Math.round(dw));
  scratch.height = Math.max(1, Math.round(dh));
  const sctx = scratch.getContext('2d', { willReadFrequently: true });
  sctx.clearRect(0, 0, scratch.width, scratch.height);
  sctx.drawImage(image, 0, 0, scratch.width, scratch.height);
  gradeCanvas(scratch, gradeId);
  ctx.drawImage(scratch, dx, dy, dw, dh);
}

// ghost.js — the lab's mascot, drawn from canvas paths.
//
// A round white ghost with a wavy hem, sparkle eyes and a star wand it
// clearly borrowed from somewhere. It lives on the cover-grid medallion and
// waves from the editor's header: the lab's whole quality department, and
// it takes the job very seriously. Drawn entirely with paths — no image
// files, no emoji — so it stays crisp at any size.

// drawGhost(ctx, cx, cy, size, opts)
// Draws the ghost centred at (cx, cy); `size` is its full height. opts.wand
// (default true) gives it the star wand; opts.blush adds cheek dots.
export function drawGhost(ctx, cx, cy, size, opts = {}) {
  const wand = opts.wand !== false;
  const w = size * 0.78;
  const left = cx - w / 2;
  const top = cy - size / 2;
  const hemY = cy + size * 0.34;
  const r = w / 2;

  ctx.save();

  // Wand first, so the hand overlaps its grip: a slim stick rising to the
  // ghost's left, tipped with a four-point sparkle star and a soft glow.
  if (wand) {
    const gripX = left + w * 0.06;
    const gripY = cy + size * 0.08;
    const tipX = gripX - size * 0.1;
    const tipY = cy - size * 0.3;
    const glow = ctx.createRadialGradient(tipX, tipY, 0, tipX, tipY, size * 0.22);
    glow.addColorStop(0, 'rgba(255, 214, 120, 0.85)');
    glow.addColorStop(1, 'rgba(255, 214, 120, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(tipX - size * 0.22, tipY - size * 0.22, size * 0.44, size * 0.44);
    ctx.strokeStyle = '#ffb347';
    ctx.lineWidth = Math.max(1.5, size * 0.022);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(gripX, gripY);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();
    drawSparkle(ctx, tipX, tipY, size * 0.11, '#ffd76e');
  }

  // Body: a dome from the top, straight sides, and a hem of three scallops.
  ctx.beginPath();
  ctx.moveTo(left, hemY);
  ctx.lineTo(left, top + r);
  ctx.arc(cx, top + r, r, Math.PI, 0);
  ctx.lineTo(left + w, hemY);
  const scallops = 3;
  const sw = w / scallops;
  for (let i = 0; i < scallops; i++) {
    const sx = left + w - i * sw;
    ctx.quadraticCurveTo(sx - sw * 0.25, hemY + size * 0.09, sx - sw * 0.5, hemY);
    ctx.quadraticCurveTo(sx - sw * 0.75, hemY - size * 0.09, sx - sw, hemY);
  }
  ctx.closePath();
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = 'rgba(21, 10, 36, 0.9)';
  ctx.lineWidth = Math.max(1.5, size * 0.02);
  ctx.stroke();

  // Face: two sparkle eyes and a small open smile.
  const eyeY = cy - size * 0.06;
  const eyeDX = w * 0.19;
  drawSparkle(ctx, cx - eyeDX, eyeY, size * 0.075, '#1c1030');
  drawSparkle(ctx, cx + eyeDX, eyeY, size * 0.075, '#1c1030');
  ctx.strokeStyle = '#1c1030';
  ctx.lineWidth = Math.max(1.5, size * 0.018);
  ctx.beginPath();
  ctx.arc(cx, cy + size * 0.05, size * 0.07, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();

  if (opts.blush) {
    ctx.fillStyle = 'rgba(255, 110, 150, 0.55)';
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(cx + s * w * 0.31, cy + size * 0.045, size * 0.05, size * 0.03, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Little arm nub waving on the right.
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = 'rgba(21, 10, 36, 0.9)';
  ctx.beginPath();
  ctx.ellipse(left + w + size * 0.015, cy + size * 0.02, size * 0.075, size * 0.045, -0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

// drawSparkle(ctx, cx, cy, r, color)
// A four-point star: the shape of a glint, a wand tip and the ghost's eyes.
export function drawSparkle(ctx, cx, cy, r, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.quadraticCurveTo(cx, cy, cx + r, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy + r);
  ctx.quadraticCurveTo(cx, cy, cx - r, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy - r);
  ctx.fill();
  ctx.restore();
}

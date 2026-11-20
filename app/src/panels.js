// panels.js — the six cover layouts, as geometry.
//
// A layout is a list of panel rectangles in fractions of the canvas (so the
// same layout pours into a square post, a portrait or a wide banner without
// caring), plus the extras that make it itself: the grid's title medallion,
// the filmstrip's sprocket bands, the postcard's silhouette shore. cover.js
// insets each rect by the gutter and paints; this file only decides where
// things go. `aspect` is canvas width / height, for the layouts that turn
// with the frame.

export const LAYOUTS = {
  grid: { label: 'Cover Grid' },
  quad: { label: 'Quad Poster' },
  hero: { label: 'Hero + Trio' },
  triptych: { label: 'Triptych' },
  filmstrip: { label: 'Filmstrip' },
  postcard: { label: 'Postcard Bleed' },
};

export const LAYOUT_ORDER = ['grid', 'quad', 'hero', 'triptych', 'filmstrip', 'postcard'];

function cell(col, row, cols, rows) {
  return { x: col / cols, y: row / rows, w: 1 / cols, h: 1 / rows };
}

// layoutPanels(layoutId, aspect) ->
//   { panels: [{x,y,w,h}...], medallion: rect|null, film: bool, postcard: bool }
export function layoutPanels(layoutId, aspect) {
  switch (layoutId) {
    case 'grid': {
      // 3 x 3, the centre cell traded for the title medallion.
      const panels = [];
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          if (col === 1 && row === 1) continue;
          panels.push(cell(col, row, 3, 3));
        }
      }
      return { panels, medallion: cell(1, 1, 3, 3), film: false, postcard: false };
    }
    case 'quad': {
      const panels = [];
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 2; col++) panels.push(cell(col, row, 2, 2));
      }
      return { panels, medallion: null, film: false, postcard: false };
    }
    case 'hero': {
      if (aspect >= 1) {
        // Hero down the left, a trio stacked on the right.
        const panels = [{ x: 0, y: 0, w: 0.62, h: 1 }];
        for (let i = 0; i < 3; i++) panels.push({ x: 0.62, y: i / 3, w: 0.38, h: 1 / 3 });
        return { panels, medallion: null, film: false, postcard: false };
      }
      // Portrait: hero on top, the trio in a row underneath.
      const panels = [{ x: 0, y: 0, w: 1, h: 0.56 }];
      for (let i = 0; i < 3; i++) panels.push({ x: i / 3, y: 0.56, w: 1 / 3, h: 0.44 });
      return { panels, medallion: null, film: false, postcard: false };
    }
    case 'triptych': {
      // Three columns; the outer two sit a breath lower, like a poster wall.
      const panels = [
        { x: 0, y: 0.035, w: 1 / 3, h: 0.93 },
        { x: 1 / 3, y: 0, w: 1 / 3, h: 1 },
        { x: 2 / 3, y: 0.035, w: 1 / 3, h: 0.93 },
      ];
      return { panels, medallion: null, film: false, postcard: false };
    }
    case 'filmstrip': {
      // A full-bleed backdrop photograph with a band of four frames across
      // its waist; cover.js blacks the band and punches the sprockets.
      const panels = [{ x: 0, y: 0, w: 1, h: 1, backdrop: true }];
      const bandY = 0.385;
      const bandH = 0.23;
      const fw = 1 / 4;
      for (let i = 0; i < 4; i++) panels.push({ x: i * fw, y: bandY, w: fw, h: bandH, frame: true });
      return { panels, medallion: null, film: true, postcard: false };
    }
    case 'postcard': {
      return { panels: [{ x: 0, y: 0, w: 1, h: 1 }], medallion: null, film: false, postcard: true };
    }
    default:
      return layoutPanels('grid', aspect);
  }
}

// panelCount(layoutId, aspect) — how many photo slots a layout offers.
export function panelCount(layoutId, aspect) {
  return layoutPanels(layoutId, aspect).panels.length;
}

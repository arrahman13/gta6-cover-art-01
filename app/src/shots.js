// shots.js — the ?shot= scenes the screenshots are taken from.
//
// The entry hands in renders of the app, and renders must be repeatable:
// a scene names the layout, the grade, the lettering and exactly which
// sample photo sits in which panel, so a screenshot taken today is the
// screenshot taken tomorrow. main.js reads the scene before first paint,
// and cover scenes hide the editor chrome so the canvas fills the frame.
//
//   ?shot=cover   the grid, sunset grade, all three samples aboard
//   ?shot=editor  the full editor with a photograph loaded
//   ?shot=hero    hero layout under Neon Nights
//   ?shot=quad    the quad poster in Golden Hour

const SCENES = {
  cover: {
    mode: 'cover',
    layout: 'grid',
    grade: 'sunset',
    title: 'PALM HEAT',
    subtitle: 'wish you were here',
    assign: [0, 1, 2, 2, 1, 1, 2, 0],
  },
  editor: {
    mode: 'editor',
    layout: 'grid',
    grade: 'sunset',
    sizeId: 'wide',
    title: 'PALM HEAT',
    subtitle: 'wish you were here',
    fill: 0,
  },
  hero: {
    mode: 'cover',
    layout: 'hero',
    grade: 'neon',
    title: 'PALM HEAT',
    subtitle: 'after dark, obviously',
    assign: [2, 1, 0, 2],
  },
  quad: {
    mode: 'cover',
    layout: 'quad',
    grade: 'golden',
    title: 'PALM HEAT',
    subtitle: 'wish you were here',
    assign: [0, 1, 2, 1],
  },
};

// shotFromLocation() -> scene object with its name, or null in the editor.
export function shotFromLocation() {
  const name = new URLSearchParams(location.search).get('shot');
  if (!name || !SCENES[name]) return null;
  return { name, ...SCENES[name] };
}

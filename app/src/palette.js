// palette.js — the colour language of Leonida Cover Lab.
//
// Everything visual in the lab descends from one Leonida evening: a sky that
// falls from deep violet through hot pink to burnt orange, neon that answers
// it in teal and magenta, and the warm cream of a postcard left in the sun.
// The grades below are gradient maps: each one says what colour a pixel's
// brightness becomes, as a list of [luminance, hex] stops from shadow (0)
// to highlight (1). grade.js turns a stop list into a lookup table.

export const SKY_STOPS = [
  [0.0, '#160a2e'],
  [0.28, '#3d1159'],
  [0.52, '#8f1d6e'],
  [0.72, '#e33e6e'],
  [0.88, '#ff7a3d'],
  [1.0, '#ffc46b'],
];

export const CREAM = '#fdf3d8';
export const INK = '#150a24';
export const PAPER = '#f7ead2';
export const NEON_PINK = '#ff2e88';
export const NEON_TEAL = '#19d3da';

// A grade: gradient-map stops plus the small print of how hard it leans on
// the photograph — mix is how much of the mapped colour replaces the photo,
// sat and contrast pre-shape the photo before it is mapped.
export const GRADES = {
  sunset: {
    label: 'Leonida Sunset',
    stops: [
      [0.0, '#1d0b38'],
      [0.3, '#5c1660'],
      [0.52, '#c22a63'],
      [0.74, '#ff6b4a'],
      [1.0, '#ffd9a0'],
    ],
    mix: 0.55, sat: 1.18, contrast: 1.06,
  },
  neon: {
    label: 'Neon Nights',
    stops: [
      [0.0, '#04182b'],
      [0.32, '#0b3d5c'],
      [0.55, '#146a8a'],
      [0.78, '#e83e8c'],
      [1.0, '#d9fbff'],
    ],
    mix: 0.5, sat: 1.25, contrast: 1.08,
  },
  golden: {
    label: 'Golden Hour',
    stops: [
      [0.0, '#2a1220'],
      [0.35, '#6e2b33'],
      [0.6, '#c65a2e'],
      [0.82, '#ffa94d'],
      [1.0, '#fff3c4'],
    ],
    mix: 0.45, sat: 1.12, contrast: 1.03,
  },
  duotone: {
    label: 'Vice Duotone',
    stops: [
      [0.0, '#12122e'],
      [0.48, '#01cdfe'],
      [0.52, '#b967ff'],
      [1.0, '#ff71ce'],
    ],
    mix: 0.85, sat: 1.0, contrast: 1.05,
  },
  mono: {
    label: 'Ink Mono',
    stops: [
      [0.0, '#0e0e13'],
      [0.5, '#84848e'],
      [1.0, '#f4efe4'],
    ],
    mix: 0.92, sat: 0.0, contrast: 1.1,
  },
};

export const GRADE_ORDER = ['sunset', 'neon', 'golden', 'duotone', 'mono'];

// hexToRgb('#ff7a3d') -> [255, 122, 61]. Only the 6-digit form is used here.
export function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Sample a stop list at t in [0, 1], linearly between the neighbouring stops.
export function sampleStops(stops, t) {
  if (t <= stops[0][0]) return hexToRgb(stops[0][1]);
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0]) {
      const [t0, c0] = stops[i - 1];
      const [t1, c1] = stops[i];
      const a = hexToRgb(c0);
      const b = hexToRgb(c1);
      const f = (t - t0) / (t1 - t0 || 1);
      return [
        Math.round(a[0] + (b[0] - a[0]) * f),
        Math.round(a[1] + (b[1] - a[1]) * f),
        Math.round(a[2] + (b[2] - a[2]) * f),
      ];
    }
  }
  return hexToRgb(stops[stops.length - 1][1]);
}

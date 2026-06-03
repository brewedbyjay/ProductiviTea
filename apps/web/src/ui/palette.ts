// The selectable pastel palette (kept in sync with the --c-* tokens in index.css).
// A category's color is one of these; the user assigns them per category.
export const PALETTE = [
  '#ffadad',
  '#ffd6a5',
  '#fdffb6',
  '#caffbf',
  '#9bf6ff',
  '#a0c4ff',
  '#bdb2ff',
  '#ffc6ff',
] as const;

export type PaletteColor = (typeof PALETTE)[number];

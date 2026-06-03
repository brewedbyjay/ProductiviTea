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

// A lighter, whiter tint of each pastel above (same hue mixed toward white,
// index-aligned with PALETTE; kept in sync with the --cb-* tokens in index.css).
// Used to tint the task count bar so it reads as a soft, light band under the card.
export const LIGHT_PALETTE = [
  '#ffdede', // red
  '#ffefdb', // orange
  '#feffe2', // yellow
  '#eaffe5', // green
  '#d7fbff', // cyan
  '#d9e7ff', // blue
  '#e5e0ff', // purple
  '#ffe8ff', // pink
] as const;

// Map a pastel palette color to its lighter tint. Returns undefined for a color
// that isn't in the palette (e.g. an unset category), so callers can fall back to
// a neutral.
export function lightVariant(color: string | undefined): string | undefined {
  if (!color) return undefined;
  const i = PALETTE.indexOf(color as PaletteColor);
  return i === -1 ? undefined : LIGHT_PALETTE[i];
}

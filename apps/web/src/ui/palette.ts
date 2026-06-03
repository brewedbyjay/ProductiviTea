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

// A brighter, more saturated variant of each pastel above (same hue, index-aligned
// with PALETTE; kept in sync with the --cb-* tokens in index.css). Used to tint the
// task count bar, where the washed-out pastels were barely visible.
export const BRIGHT_PALETTE = [
  '#ff8787', // red
  '#ffc078', // orange
  '#ffe066', // yellow
  '#8ce99a', // green
  '#66d9e8', // cyan
  '#74c0fc', // blue
  '#b197fc', // purple
  '#faa2c1', // pink
] as const;

// Map a pastel palette color to its brighter variant. Returns undefined for a
// color that isn't in the palette (e.g. an unset category), so callers can fall
// back to a neutral.
export function brightVariant(color: string | undefined): string | undefined {
  if (!color) return undefined;
  const i = PALETTE.indexOf(color as PaletteColor);
  return i === -1 ? undefined : BRIGHT_PALETTE[i];
}

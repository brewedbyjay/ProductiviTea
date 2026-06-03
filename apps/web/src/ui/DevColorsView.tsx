import { useMemo, useState } from 'react';

// Dev-only colour inspector (desktop link, bottom-right). Lists every CSS colour
// token with the context it drives and a picker to tweak it live. Edits write
// straight to the :root custom properties so the whole app updates instantly —
// they are deliberately NOT persisted (no storage call here); a reload restores
// the defaults, and "Reset" does so on demand.

interface ColorToken {
  name: string; // the CSS custom property, e.g. '--accent'
  label: string;
  context: string; // where it shows up in the UI
}

// Authored colour tokens from index.css, grouped surface/text first then palette.
const TOKENS: ColorToken[] = [
  { name: '--bg', label: 'Background', context: 'Page background behind everything' },
  { name: '--surface', label: 'Surface', context: 'Cards, inputs, panels, rows' },
  { name: '--text', label: 'Text', context: 'Primary text' },
  { name: '--muted', label: 'Muted text', context: 'Labels, anchors, secondary text' },
  { name: '--border', label: 'Border', context: 'Card / row / count-bar borders' },
  { name: '--field-border', label: 'Field border', context: 'Input & select borders' },
  { name: '--accent', label: 'Accent', context: 'Reward badge, +earn coin' },
  { name: '--coin', label: 'Coin', context: 'Balance, reward cost' },
  { name: '--highlight', label: 'Highlight', context: 'Primary buttons, active nav' },
  { name: '--c-red', label: 'Palette red', context: 'Category card colour' },
  { name: '--c-orange', label: 'Palette orange', context: 'Category card colour' },
  { name: '--c-yellow', label: 'Palette yellow', context: 'Category card colour' },
  { name: '--c-green', label: 'Palette green', context: 'Category card colour' },
  { name: '--c-cyan', label: 'Palette cyan', context: 'Category card colour' },
  { name: '--c-blue', label: 'Palette blue', context: 'Category card colour' },
  { name: '--c-purple', label: 'Palette purple', context: 'Category card colour' },
  { name: '--c-pink', label: 'Palette pink', context: 'Category card colour' },
  { name: '--cb-red', label: 'Bright red', context: 'Task count bar' },
  { name: '--cb-orange', label: 'Bright orange', context: 'Task count bar' },
  { name: '--cb-yellow', label: 'Bright yellow', context: 'Task count bar' },
  { name: '--cb-green', label: 'Bright green', context: 'Task count bar' },
  { name: '--cb-cyan', label: 'Bright cyan', context: 'Task count bar' },
  { name: '--cb-blue', label: 'Bright blue', context: 'Task count bar' },
  { name: '--cb-purple', label: 'Bright purple', context: 'Task count bar' },
  { name: '--cb-pink', label: 'Bright pink', context: 'Task count bar' },
];

function readVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// `<input type="color">` only accepts #rrggbb; the tokens are authored as hex, so
// this mostly trims and expands the odd shorthand.
function toHex(value: string): string {
  if (/^#[0-9a-fA-F]{6}$/.test(value)) return value;
  if (/^#[0-9a-fA-F]{3}$/.test(value)) {
    const [r, g, b] = value.slice(1);
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return value || '#000000';
}

export default function DevColorsView({ onClose }: { onClose: () => void }) {
  // Snapshot the authored defaults once so Reset can restore them.
  const defaults = useMemo(() => {
    const map: Record<string, string> = {};
    for (const t of TOKENS) map[t.name] = toHex(readVar(t.name));
    return map;
  }, []);
  const [values, setValues] = useState<Record<string, string>>(defaults);

  function setVar(name: string, value: string) {
    document.documentElement.style.setProperty(name, value);
    setValues((v) => ({ ...v, [name]: value }));
  }

  function reset() {
    // Drop the inline overrides so the stylesheet defaults take over again.
    for (const name of Object.keys(defaults)) {
      document.documentElement.style.removeProperty(name);
    }
    setValues(defaults);
  }

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div
        className="dialog dev-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Dev colours"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="dialog__header">
          <h2 className="dialog__title">Colours — dev only, not saved</h2>
          <button
            type="button"
            className="dialog__close"
            aria-label="Close"
            onClick={onClose}
          >
            &times;
          </button>
        </header>

        <ul className="dev-color-list">
          {TOKENS.map((t) => (
            <li key={t.name} className="dev-color">
              <input
                type="color"
                className="dev-color__picker"
                aria-label={`${t.label} colour`}
                value={values[t.name]}
                onChange={(e) => setVar(t.name, e.target.value)}
              />
              <div className="dev-color__meta">
                <span className="dev-color__label">
                  {t.label} <code className="dev-color__var">{t.name}</code>
                </span>
                <span className="dev-color__context">{t.context}</span>
              </div>
              <code className="dev-color__code">{values[t.name]}</code>
            </li>
          ))}
        </ul>

        <div className="dialog__actions">
          <button type="button" className="dialog__cancel" onClick={reset}>
            Reset
          </button>
          <button type="button" className="add-submit" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

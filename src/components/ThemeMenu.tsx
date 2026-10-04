import { useCallback, useEffect, useRef, useState } from 'react';
import { useClickOutside } from '../hooks/useClickOutside';
import { THEME_OPTIONS, useTheme } from '../theme';
import { CheckIcon, PaletteIcon } from './Icons';

export function ThemeMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const preference = useTheme((s) => s.preference);
  const setPreference = useTheme((s) => s.setPreference);

  const close = useCallback(() => {
    // Closing with Escape while a choice is focused would otherwise drop focus to <body>.
    const hadFocus = ref.current?.contains(document.activeElement);
    setOpen(false);
    if (hadFocus) buttonRef.current?.focus();
  }, []);
  useClickOutside(ref, close, open);

  // Move focus to the current choice so the arrow keys switch themes right away.
  useEffect(() => {
    if (open) ref.current?.querySelector<HTMLInputElement>('input:checked')?.focus();
  }, [open]);

  return (
    <div className="dropdown" ref={ref}>
      <button
        ref={buttonRef}
        type="button"
        className="btn btn-subtle"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <PaletteIcon /> <span className="btn-label">Motyw</span>
      </button>
      {open && (
        <div className="dropdown-menu dropdown-menu-right theme-menu">
          <fieldset className="theme-options">
            <legend className="dropdown-heading">Motyw</legend>
            {THEME_OPTIONS.map((option) => (
              <label key={option.id} className="theme-option">
                <input
                  type="radio"
                  name="theme"
                  className="sr-only"
                  value={option.id}
                  aria-labelledby={`theme-${option.id}-name`}
                  aria-describedby={`theme-${option.id}-desc`}
                  checked={preference === option.id}
                  onChange={() => setPreference(option.id)}
                />
                <span className="theme-preview" style={{ background: option.preview.bg }} aria-hidden="true">
                  <span className="theme-preview-card" style={{ background: option.preview.card }} />
                  <span className="theme-preview-accent" style={{ background: option.preview.accent }} />
                </span>
                <span className="theme-option-text">
                  <span id={`theme-${option.id}-name`} className="theme-option-name">
                    {option.label}
                  </span>
                  <span id={`theme-${option.id}-desc`} className="theme-option-desc">
                    {option.description}
                  </span>
                </span>
                <CheckIcon className="theme-option-check" />
              </label>
            ))}
          </fieldset>
        </div>
      )}
    </div>
  );
}

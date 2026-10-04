import { useEffect, type RefObject } from 'react';

export function useClickOutside(ref: RefObject<HTMLElement | null>, onOutside: () => void, active: boolean) {
  useEffect(() => {
    if (!active) return;
    // Also fires when focus moves outside (Tab), so two menus never stay open on top of each other.
    const handleDown = (e: Event) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOutside();
    };
    document.addEventListener('mousedown', handleDown);
    document.addEventListener('focusin', handleDown);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleDown);
      document.removeEventListener('focusin', handleDown);
      document.removeEventListener('keydown', handleKey);
    };
  }, [ref, onOutside, active]);
}

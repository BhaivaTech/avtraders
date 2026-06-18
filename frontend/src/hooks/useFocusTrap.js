// src/hooks/useFocusTrap.js
// Traps Tab/Shift+Tab inside `ref` while `active` is true.
// Restores focus to the previously focused element on deactivate.

import { useEffect } from 'react';

const FOCUSABLE = [
  'a[href]',
  'area[href]',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'button:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export default function useFocusTrap(ref, active = true) {
  useEffect(() => {
    if (!active || !ref?.current) return undefined;

    const root = ref.current;
    const previouslyFocused = document.activeElement;

    function getFocusable() {
      return Array.from(root.querySelectorAll(FOCUSABLE)).filter(
        (el) => !el.hasAttribute('disabled') && el.offsetParent !== null,
      );
    }

    function handleKeyDown(e) {
      if (e.key !== 'Tab') return;
      const items = getFocusable();
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last  = items[items.length - 1];
      const active = document.activeElement;

      if (e.shiftKey) {
        if (active === first || !root.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last) {
        e.preventDefault();
        first.focus();
      }
    }

    // Move focus into the trap on mount.
    const items = getFocusable();
    if (items[0]) items[0].focus();
    else root.setAttribute('tabindex', '-1'), root.focus();

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus();
      }
    };
  }, [active, ref]);
}

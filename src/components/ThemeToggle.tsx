'use client';

import { useSyncExternalStore } from 'react';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'warden-theme';
const CHANGE_EVENT = 'warden-theme-change';

/**
 * Reads the theme as an external system (the DOM attribute the blocking
 * inline script in layout.tsx already set before paint, or the OS
 * preference if no explicit choice was ever made) via useSyncExternalStore
 * rather than useState+useEffect -- the React-recommended way to read
 * mutable state that lives outside React without a setState-in-effect
 * render cascade, and it comes with a real server snapshot for free instead
 * of a null-then-resolved placeholder state.
 */
function subscribe(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

function getSnapshot(): Theme {
  const explicit = document.documentElement.dataset.theme;
  if (explicit === 'light' || explicit === 'dark') return explicit;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function getServerSnapshot(): Theme {
  return 'dark';
}

export function ThemeToggle() {
  const active = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    const next: Theme = active === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem(STORAGE_KEY, next);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={active === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      className="flex h-9 w-9 items-center justify-center rounded-full text-mist-400 transition-colors hover:text-mist-100"
    >
      {active === 'dark' ? (
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-5 w-5">
          <path
            d="M17 10.8A7.5 7.5 0 0 1 9.2 3 7.5 7.5 0 1 0 17 10.8Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-5 w-5">
          <circle cx="10" cy="10" r="3.5" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M10 2v2M10 16v2M18 10h-2M4 10H2M15.5 4.5l-1.4 1.4M5.9 14.1l-1.4 1.4M15.5 15.5l-1.4-1.4M5.9 5.9 4.5 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      )}
    </button>
  );
}

/**
 * Path data for the Studio icon set — hand-authored inline SVGs, 24px viewBox,
 * line style (~1.5–1.6 stroke, round caps/joins). No icon library dependency;
 * see design/design_handoff_psymple_studio/README.md -> Assets.
 */
export const ICON_PATHS = {
  grid: '<path d="M3 3h7v7H3z"/><path d="M14 3h7v7h-7z"/><path d="M14 14h7v7h-7z"/><path d="M3 14h7v7H3z"/>',
  network:
    '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="12" r="3"/><path d="M8.6 7.5l6.8 3.5"/><path d="M15.4 12.9L8.6 16.5"/>',
  sigma:
    '<path d="M18 7V5a1 1 0 00-1-1H6.5a.5.5 0 00-.4.8L12 12l-5.9 7.2a.5.5 0 00.4.8H17a1 1 0 001-1v-2"/>',
  chart: '<path d="M3 3v18h18"/><path d="M7 14l3-4 3 3 4-6"/>',
  play: '<path d="M6 4l14 8-14 8V4z"/>',
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  arrow: '<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>',
  fit: '<path d="M8 3H5a2 2 0 00-2 2v3"/><path d="M16 3h3a2 2 0 012 2v3"/><path d="M8 21H5a2 2 0 01-2-2v-3"/><path d="M16 21h3a2 2 0 002-2v-3"/>',
  x: '<path d="M18 6L6 18"/><path d="M6 6l12 12"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
  dot: '<circle cx="12" cy="12" r="4"/>',
  eye: '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/>',
  chevron: '<path d="M9 6l6 6-6 6"/>',
  box: '<path d="M21 8v8l-9 5-9-5V8l9-5 9 5z"/><path d="M3.3 7L12 12l8.7-5"/><path d="M12 22V12"/>',
  collapse: '<path d="M11 17l-5-5 5-5"/><path d="M18 17l-5-5 5-5"/>',
} as const;

export type IconName = keyof typeof ICON_PATHS;

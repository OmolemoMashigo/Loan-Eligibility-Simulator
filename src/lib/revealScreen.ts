/** Put the window back at the top so the header stays on screen. */
export function resetWindowScroll(): void {
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

/**
 * Move keyboard focus to a new step or result without letting the browser
 * scroll the header off screen. iOS often reapplies scroll after focus, so
 * the reset runs again on the next frames.
 */
export function revealScreen(node: HTMLElement | null): void {
  node?.focus({ preventScroll: true });
  resetWindowScroll();
  requestAnimationFrame(() => {
    resetWindowScroll();
    requestAnimationFrame(resetWindowScroll);
  });
}

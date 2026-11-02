/**
 * Keep the simulator on this page when the browser Back or Forward button
 * is pressed. Steps are not routes, so those buttons would otherwise leave
 * the app for whatever was in the tab before it.
 */
export function installHistoryGuard(): () => void {
  const { history } = window;
  const url = window.location.href;
  const state = { formGuard: true };
  const previousRestoration = history.scrollRestoration;

  try {
    history.scrollRestoration = 'manual';
  } catch {
    // jsdom does not implement scroll restoration.
  }
  history.replaceState(state, '', url);
  history.pushState(state, '', url);

  const onPopState = (): void => {
    history.pushState(state, '', url);
  };

  window.addEventListener('popstate', onPopState);

  return () => {
    window.removeEventListener('popstate', onPopState);

    try {
      history.scrollRestoration = previousRestoration;
    } catch {
      // jsdom does not implement scroll restoration.
    }
  };
}

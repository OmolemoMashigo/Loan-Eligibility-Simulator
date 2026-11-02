import { afterEach, describe, expect, it, vi } from 'vitest';
import { installHistoryGuard } from './historyGuard';

describe('installHistoryGuard', () => {
  let stop: (() => void) | undefined;

  afterEach(() => {
    stop?.();
    stop = undefined;
    vi.restoreAllMocks();
  });

  it('replaces the current entry and adds a guard entry', () => {
    const replaceState = vi.spyOn(window.history, 'replaceState');
    const pushState = vi.spyOn(window.history, 'pushState');
    stop = installHistoryGuard();

    expect(replaceState).toHaveBeenCalledTimes(1);
    expect(pushState).toHaveBeenCalledTimes(1);
    expect(replaceState.mock.calls[0]?.[0]).toEqual({ formGuard: true });
  });

  it('puts the guard entry back when Back or Forward fires', () => {
    stop = installHistoryGuard();
    const pushState = vi.spyOn(window.history, 'pushState');

    window.dispatchEvent(new PopStateEvent('popstate'));

    expect(pushState).toHaveBeenCalledTimes(1);
    expect(pushState.mock.calls[0]?.[0]).toEqual({ formGuard: true });
  });

  it('stops trapping after it is removed', () => {
    stop = installHistoryGuard();
    stop();
    stop = undefined;
    const pushState = vi.spyOn(window.history, 'pushState');

    window.dispatchEvent(new PopStateEvent('popstate'));

    expect(pushState).not.toHaveBeenCalled();
  });
});

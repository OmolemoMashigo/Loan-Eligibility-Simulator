import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetWindowScroll, revealScreen } from './revealScreen';

describe('revealScreen', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.replaceChildren();
  });

  it('focuses without scrolling, then resets the window', () => {
    const node = document.createElement('div');
    node.tabIndex = -1;
    document.body.append(node);
    const focus = vi.spyOn(node, 'focus');
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

    revealScreen(node);

    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it('resets scroll again after paint', async () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

    revealScreen(null);

    await vi.waitFor(() => {
      expect(scrollTo.mock.calls.length).toBeGreaterThanOrEqual(3);
    });
  });
});

describe('resetWindowScroll', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('scrolls the window and the document to the top', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    document.documentElement.scrollTop = 80;
    document.body.scrollTop = 80;

    resetWindowScroll();

    expect(scrollTo).toHaveBeenCalledWith(0, 0);
    expect(document.documentElement.scrollTop).toBe(0);
    expect(document.body.scrollTop).toBe(0);
  });
});

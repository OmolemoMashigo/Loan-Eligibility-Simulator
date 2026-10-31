import { describe, expect, it } from 'vitest';
import { isMocksEnabled } from './enableMocks';

describe('isMocksEnabled', () => {
  it('stays on by default', () => {
    expect(isMocksEnabled(undefined)).toBe(true);
    expect(isMocksEnabled('true')).toBe(true);
  });

  it('turns off only when the flag is false', () => {
    expect(isMocksEnabled('false')).toBe(false);
  });
});

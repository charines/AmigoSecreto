import { describe, expect, it } from 'vitest';
import { maskValue } from './maskValue.js';

describe('maskValue', () => {
  it('returns empty string unchanged', () => {
    expect(maskValue('')).toBe('');
  });

  it('masks a short value entirely', () => {
    expect(maskValue('ab')).toBe('**');
  });

  it('keeps the first two and last two characters for longer values, masking the middle', () => {
    const value = 'user@example.com';
    const masked = maskValue(value);

    expect(masked).toHaveLength(value.length);
    expect(masked.slice(0, 2)).toBe('us');
    expect(masked.slice(-2)).toBe('om');
    expect(masked.slice(2, -2)).toMatch(/^\*+$/);
  });
});

/**
 * Article Author-Name Validation Tests
 *
 * @jest-environment node
 */

import { normalizeAuthorName, DEFAULT_AUTHOR_NAME, MAX_AUTHOR_NAME_LENGTH } from '@/lib/articleValidation';

describe('normalizeAuthorName', () => {
  it('defaults to "Anonymous Author" when undefined', () => {
    expect(normalizeAuthorName(undefined)).toEqual({ valid: true, authorName: DEFAULT_AUTHOR_NAME });
  });

  it('defaults to "Anonymous Author" when null', () => {
    expect(normalizeAuthorName(null)).toEqual({ valid: true, authorName: DEFAULT_AUTHOR_NAME });
  });

  it('defaults to "Anonymous Author" when an empty/whitespace string', () => {
    expect(normalizeAuthorName('   ')).toEqual({ valid: true, authorName: DEFAULT_AUTHOR_NAME });
  });

  it('trims a provided name', () => {
    expect(normalizeAuthorName('  Jane Doe  ')).toEqual({ valid: true, authorName: 'Jane Doe' });
  });

  it('accepts a name up to the max length', () => {
    const name = 'a'.repeat(MAX_AUTHOR_NAME_LENGTH);
    expect(normalizeAuthorName(name)).toEqual({ valid: true, authorName: name });
  });

  it('rejects a name over the max length', () => {
    const name = 'a'.repeat(MAX_AUTHOR_NAME_LENGTH + 1);
    const result = normalizeAuthorName(name);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.status).toBe(400);
      expect(result.message).toMatch(new RegExp(`${MAX_AUTHOR_NAME_LENGTH} characters`));
    }
  });

  it('rejects a non-string value', () => {
    const result = normalizeAuthorName(42);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.status).toBe(400);
    }
  });
});

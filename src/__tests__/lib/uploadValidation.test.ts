/**
 * Upload Validation Tests
 *
 * Tests the shared image-upload validator used by the photo and asset
 * upload routes.
 * @jest-environment node
 */

import { validateImageUpload, MAX_IMAGE_BYTES } from '@/lib/uploadValidation';

function fakeFile(type: string, size: number): File {
  // A File-like object; only `type` and `size` are read by the validator.
  return { type, size } as File;
}

describe('validateImageUpload', () => {
  it('accepts an image within the size limit', () => {
    const result = validateImageUpload(fakeFile('image/jpeg', 1024));
    expect(result.valid).toBe(true);
  });

  it('rejects a missing file', () => {
    const result = validateImageUpload(undefined);
    expect(result).toEqual({ valid: false, status: 400, message: 'File is required' });
  });

  it('rejects a non-image content type', () => {
    const result = validateImageUpload(fakeFile('application/pdf', 1024));
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.status).toBe(400);
      expect(result.message).toMatch(/image/i);
    }
  });

  it('rejects a file at the size limit boundary + 1', () => {
    const result = validateImageUpload(fakeFile('image/png', MAX_IMAGE_BYTES + 1));
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.status).toBe(413);
    }
  });

  it('accepts a file exactly at the size limit', () => {
    const result = validateImageUpload(fakeFile('image/webp', MAX_IMAGE_BYTES));
    expect(result.valid).toBe(true);
  });

  it('rejects an empty (zero-byte) file', () => {
    const result = validateImageUpload(fakeFile('image/jpeg', 0));
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.status).toBe(400);
    }
  });
});

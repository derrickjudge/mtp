// Shared validation for user-supplied image uploads. Used by the photo and
// asset upload routes so limits stay consistent across every upload path.

// Vercel serverless functions hard-cap request bodies at 4.5MB, enforced by
// the platform before the request reaches this code (returns a generic 413
// with no app-level message). Stay safely under that so our own validation
// message is the one users actually see.
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4MB

export type UploadValidationResult =
  | { valid: true }
  | { valid: false; status: number; message: string };

/**
 * Validate an uploaded file is a non-empty image within the size limit.
 *
 * @param file The uploaded File, or undefined when no file was provided.
 * @returns A discriminated result; when invalid, carries the HTTP status and
 *   client-safe message to return.
 */
export function validateImageUpload(file: File | undefined | null): UploadValidationResult {
  if (!file) {
    return { valid: false, status: 400, message: 'File is required' };
  }
  if (!file.type.startsWith('image/')) {
    return { valid: false, status: 400, message: 'Only image files are allowed' };
  }
  if (file.size <= 0) {
    return { valid: false, status: 400, message: 'File is empty' };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { valid: false, status: 413, message: 'File must be less than 4MB' };
  }
  return { valid: true };
}

/**
 * Derive a safe file extension from a content type or filename, restricted to
 * a known set of image extensions. Never trusts the raw filename for storage
 * keys.
 *
 * @param contentType The uploaded file's MIME type (e.g. "image/jpeg").
 * @param fileName Optional original filename, used only as a fallback source.
 * @returns A lowercase extension without a leading dot (e.g. "jpg").
 */
export function safeImageExtension(contentType: string, fileName?: string): string {
  const fromMime: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/avif': 'avif',
    'image/svg+xml': 'svg',
  };
  const mimeExt = fromMime[contentType.toLowerCase()];
  if (mimeExt) {
    return mimeExt;
  }
  const nameExt = fileName?.split('.').pop()?.toLowerCase();
  if (nameExt && /^[a-z0-9]{1,5}$/.test(nameExt)) {
    return nameExt;
  }
  return 'jpg';
}

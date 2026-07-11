// Normalization for the free-text article byline. Independent of the User
// table so an article can credit an author without an admin account.

export const DEFAULT_AUTHOR_NAME = 'Anonymous Author';
export const MAX_AUTHOR_NAME_LENGTH = 100;

export type AuthorNameResult =
  | { valid: true; authorName: string }
  | { valid: false; status: number; message: string };

/**
 * Normalize a user-supplied article byline: trims whitespace and falls back
 * to the default when blank or omitted.
 *
 * @param authorName The raw value from the request body.
 * @returns A discriminated result; when invalid, carries the HTTP status and
 *   client-safe message to return.
 */
export function normalizeAuthorName(authorName: unknown): AuthorNameResult {
  if (authorName === undefined || authorName === null) {
    return { valid: true, authorName: DEFAULT_AUTHOR_NAME };
  }
  if (typeof authorName !== 'string') {
    return { valid: false, status: 400, message: 'Author name must be a string' };
  }
  const trimmed = authorName.trim();
  if (!trimmed) {
    return { valid: true, authorName: DEFAULT_AUTHOR_NAME };
  }
  if (trimmed.length > MAX_AUTHOR_NAME_LENGTH) {
    return {
      valid: false,
      status: 400,
      message: `Author name must be ${MAX_AUTHOR_NAME_LENGTH} characters or fewer`,
    };
  }
  return { valid: true, authorName: trimmed };
}

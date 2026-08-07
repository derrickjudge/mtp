// Rendering for the Article.content field. An article is authored either as
// plain text (blank-line separated paragraphs, the default) or as hand-written
// HTML; Article.contentFormat records which. Both paths converge on a trusted
// HTML string safe to hand to dangerouslySetInnerHTML.

import sanitizeHtml from 'sanitize-html';

export type ContentFormat = 'TEXT' | 'HTML';

/** Format assumed when a request omits one. Plain text is the safer default:
 *  prose pasted into an HTML-mode field silently loses its paragraphs. */
export const DEFAULT_CONTENT_FORMAT: ContentFormat = 'TEXT';

export const CONTENT_FORMATS: readonly ContentFormat[] = ['TEXT', 'HTML'];

export type ContentFormatResult =
  | { valid: true; contentFormat: ContentFormat }
  | { valid: false; status: number; message: string };

/** Narrow an unknown value to a supported content format. */
export function isContentFormat(value: unknown): value is ContentFormat {
  return typeof value === 'string' && (CONTENT_FORMATS as readonly string[]).includes(value);
}

/**
 * Validate a client-supplied content format.
 *
 * @param contentFormat The raw value from the request body.
 * @returns A discriminated result; when invalid, carries the HTTP status and
 *   client-safe message to return.
 */
export function normalizeContentFormat(contentFormat: unknown): ContentFormatResult {
  if (contentFormat === undefined || contentFormat === null) {
    return { valid: true, contentFormat: DEFAULT_CONTENT_FORMAT };
  }
  if (isContentFormat(contentFormat)) {
    return { valid: true, contentFormat };
  }
  return {
    valid: false,
    status: 400,
    message: `Content format must be one of: ${CONTENT_FORMATS.join(', ')}`,
  };
}

// Formatting-only allowlist. Everything capable of executing script, loading a
// third party, or repositioning content over the page is dropped.
const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p', 'br', 'hr',
    'h2', 'h3', 'h4', 'h5', 'h6',
    'strong', 'b', 'em', 'i', 'u', 's',
    'ul', 'ol', 'li',
    'blockquote', 'code', 'pre',
    'a', 'img', 'figure', 'figcaption',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
  ],
  allowedAttributes: {
    a: ['href', 'title'],
    img: ['src', 'alt', 'title', 'width', 'height'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  // Reject protocol-relative URLs, which inherit the page scheme and bypass
  // the allowlist above.
  allowProtocolRelative: false,
  disallowedTagsMode: 'discard',
};

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Escape the five characters that carry meaning in HTML text and attributes. */
function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

/**
 * Convert plain text to HTML: blank lines separate paragraphs, single newlines
 * become line breaks. The text is escaped first, so any markup the author typed
 * shows up as literal characters rather than being interpreted.
 */
function renderPlainText(content: string): string {
  return content
    .replace(/\r\n?/g, '\n')
    // A separator is one or more blank lines; "blank" allows stray spaces or
    // tabs, which authors leave behind routinely.
    .split(/\n[ \t]*(?:\n[ \t]*)+/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, '<br />')}</p>`)
    .join('\n');
}

/**
 * Render article content as HTML safe for dangerouslySetInnerHTML.
 *
 * @param content The stored Article.content value.
 * @param format How that value was authored; defaults to plain text.
 * @returns Sanitized HTML, or an empty string when the content is blank.
 *
 * @example
 * renderArticleContent('One.\n\nTwo.', 'TEXT') // '<p>One.</p>\n<p>Two.</p>'
 */
export function renderArticleContent(
  content: string,
  format: ContentFormat = DEFAULT_CONTENT_FORMAT,
): string {
  if (!content || !content.trim()) {
    return '';
  }
  if (format === 'HTML') {
    return sanitizeHtml(content, SANITIZE_OPTIONS);
  }
  return renderPlainText(content);
}

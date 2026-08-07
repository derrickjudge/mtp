import {
  DEFAULT_CONTENT_FORMAT,
  isContentFormat,
  normalizeContentFormat,
  renderArticleContent,
} from '@/lib/articleContent';

describe('isContentFormat', () => {
  it('accepts the two supported formats', () => {
    expect(isContentFormat('TEXT')).toBe(true);
    expect(isContentFormat('HTML')).toBe(true);
  });

  it('rejects anything else', () => {
    expect(isContentFormat('markdown')).toBe(false);
    expect(isContentFormat('text')).toBe(false);
    expect(isContentFormat('')).toBe(false);
    expect(isContentFormat(null)).toBe(false);
    expect(isContentFormat(undefined)).toBe(false);
    expect(isContentFormat(3)).toBe(false);
  });
});

describe('normalizeContentFormat', () => {
  it('passes supported formats through', () => {
    expect(normalizeContentFormat('HTML')).toEqual({ valid: true, contentFormat: 'HTML' });
    expect(normalizeContentFormat('TEXT')).toEqual({ valid: true, contentFormat: 'TEXT' });
  });

  it('falls back to the default when omitted', () => {
    expect(normalizeContentFormat(undefined)).toEqual({
      valid: true,
      contentFormat: DEFAULT_CONTENT_FORMAT,
    });
    expect(normalizeContentFormat(null)).toEqual({
      valid: true,
      contentFormat: DEFAULT_CONTENT_FORMAT,
    });
  });

  it('defaults to plain text so pasted prose is never treated as markup', () => {
    expect(DEFAULT_CONTENT_FORMAT).toBe('TEXT');
  });

  it('rejects an unrecognized format rather than guessing', () => {
    const result = normalizeContentFormat('markdown');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.status).toBe(400);
      expect(result.message).toContain('TEXT');
      expect(result.message).toContain('HTML');
    }
  });
});

describe('renderArticleContent - TEXT format', () => {
  it('wraps blank-line separated blocks in paragraphs', () => {
    const html = renderArticleContent('First para.\n\nSecond para.', 'TEXT');
    expect(html).toBe('<p>First para.</p>\n<p>Second para.</p>');
  });

  it('converts single newlines inside a block to line breaks', () => {
    const html = renderArticleContent('Line one\nLine two', 'TEXT');
    expect(html).toBe('<p>Line one<br />Line two</p>');
  });

  it('treats runs of three or more newlines as a single paragraph break', () => {
    const html = renderArticleContent('One.\n\n\n\nTwo.', 'TEXT');
    expect(html).toBe('<p>One.</p>\n<p>Two.</p>');
  });

  it('normalizes CRLF and CR line endings', () => {
    expect(renderArticleContent('One.\r\n\r\nTwo.', 'TEXT')).toBe('<p>One.</p>\n<p>Two.</p>');
    expect(renderArticleContent('One.\r\rTwo.', 'TEXT')).toBe('<p>One.</p>\n<p>Two.</p>');
  });

  it('ignores leading and trailing whitespace', () => {
    expect(renderArticleContent('\n\n  Solo.  \n\n', 'TEXT')).toBe('<p>Solo.</p>');
  });

  it('treats blocks of only whitespace as separators, not paragraphs', () => {
    const html = renderArticleContent('One.\n   \nTwo.', 'TEXT');
    expect(html).toBe('<p>One.</p>\n<p>Two.</p>');
  });

  it('escapes HTML so typed markup renders as literal text', () => {
    const html = renderArticleContent('a < b & c > d', 'TEXT');
    expect(html).toBe('<p>a &lt; b &amp; c &gt; d</p>');
  });

  it('neutralizes a script tag typed into plain text', () => {
    const html = renderArticleContent('<script>alert(1)</script>', 'TEXT');
    expect(html).not.toContain('<script');
    expect(html).toContain('&lt;script&gt;');
  });

  it('escapes quotes so text cannot break out of an attribute context', () => {
    const html = renderArticleContent(`He said "hi" to O'Brien`, 'TEXT');
    expect(html).toBe('<p>He said &quot;hi&quot; to O&#39;Brien</p>');
  });

  it('returns an empty string for blank content', () => {
    expect(renderArticleContent('', 'TEXT')).toBe('');
    expect(renderArticleContent('   \n\n  ', 'TEXT')).toBe('');
  });
});

describe('renderArticleContent - HTML format', () => {
  it('preserves allowed formatting tags', () => {
    const html = renderArticleContent('<h2>Title</h2><p>Body <strong>bold</strong></p>', 'HTML');
    expect(html).toContain('<h2>Title</h2>');
    expect(html).toContain('<strong>bold</strong>');
  });

  it('preserves lists and blockquotes', () => {
    const html = renderArticleContent('<ul><li>One</li></ul><blockquote>Quote</blockquote>', 'HTML');
    expect(html).toContain('<li>One</li>');
    expect(html).toContain('<blockquote>Quote</blockquote>');
  });

  it('keeps href and title on links', () => {
    const html = renderArticleContent('<a href="https://example.com" title="t">Link</a>', 'HTML');
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('title="t"');
  });

  it('keeps src and alt on images', () => {
    const html = renderArticleContent('<img src="https://cdn.example.com/a.jpg" alt="A" />', 'HTML');
    expect(html).toContain('src="https://cdn.example.com/a.jpg"');
    expect(html).toContain('alt="A"');
  });

  it('strips script tags and their contents', () => {
    const html = renderArticleContent('<p>Safe</p><script>alert(1)</script>', 'HTML');
    expect(html).toContain('<p>Safe</p>');
    expect(html).not.toContain('script');
    expect(html).not.toContain('alert(1)');
  });

  it('strips inline event handlers', () => {
    const html = renderArticleContent('<p onclick="steal()">Text</p>', 'HTML');
    expect(html).toContain('Text');
    expect(html).not.toContain('onclick');
  });

  it('strips javascript: URLs from links', () => {
    const html = renderArticleContent('<a href="javascript:alert(1)">Click</a>', 'HTML');
    expect(html).not.toContain('javascript:');
  });

  it('strips iframes', () => {
    const html = renderArticleContent('<iframe src="https://evil.example"></iframe>', 'HTML');
    expect(html).not.toContain('iframe');
  });

  it('strips style attributes that could mask or reposition content', () => {
    const html = renderArticleContent('<p style="position:fixed;top:0">Text</p>', 'HTML');
    expect(html).toContain('Text');
    expect(html).not.toContain('style=');
  });

  it('allows mailto and https link schemes', () => {
    expect(renderArticleContent('<a href="mailto:a@b.com">Mail</a>', 'HTML')).toContain('mailto:');
    expect(renderArticleContent('<a href="https://a.com">Site</a>', 'HTML')).toContain('https://');
  });

  it('returns an empty string for blank content', () => {
    expect(renderArticleContent('', 'HTML')).toBe('');
    expect(renderArticleContent('   ', 'HTML')).toBe('');
  });
});

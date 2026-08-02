/**
 * Articles landing page tests.
 *
 * The page is a server component, so it is invoked directly and its returned
 * element rendered — the pattern used by src/__tests__/app/about/page.test.tsx.
 * `nativeDB` is mocked globally by jest.setup.js.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import ArticlesPage from '@/app/articles/page';
import { nativeDB } from '@/lib/db-native';

jest.mock('@/components/common/Image', () => ({
  Image: ({ alt, ...props }: { alt: string }) => <img alt={alt} {...props} />,
}));

jest.mock('@/utils/pageHeaders', () => ({
  getPageHeader: jest.fn(async () => '/images/hero/hero.jpg'),
}));

const categories = [
  { id: 'cat-1', name: 'Rugby', slug: 'rugby' },
  { id: 'cat-2', name: 'Concerts', slug: 'concerts' },
];

const featuredArticle = {
  id: 'a-featured',
  title: 'Championship Final',
  slug: 'championship-final',
  excerpt: 'How the final unfolded',
  contentSnippet: 'Full match report body text',
  coverImage: null, // deliberately absent: the badge must still render
  published: true,
  featured: true,
  authorName: 'Jane Rivera',
  publishDate: '2026-03-05T00:00:00.000Z',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  categories: [categories[0]],
};

const regularArticle = {
  id: 'a-regular',
  title: 'Night at the Venue',
  slug: 'night-at-the-venue',
  excerpt: 'A concert in low light',
  contentSnippet: 'Concert body text',
  coverImage: 'https://cdn.example.com/cover.jpg',
  published: true,
  featured: false,
  authorName: 'Sam Cole',
  publishDate: null,
  createdAt: '2026-02-02T00:00:00.000Z',
  updatedAt: '2026-02-02T00:00:00.000Z',
  categories: [categories[1]],
};

/** Renders the server component with the given search params. */
async function renderPage(searchParams: Record<string, string> = {}) {
  const ui = await ArticlesPage({ searchParams });
  return render(ui as unknown as React.ReactElement);
}

/** Article titles in the order they appear in the document. */
function renderedTitleOrder(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('article h2')).map(
    (h) => h.textContent?.trim() ?? ''
  );
}

describe('Articles landing page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (nativeDB.findCategories as jest.Mock).mockResolvedValue(categories);
    (nativeDB.findArticlesWithCategories as jest.Mock).mockResolvedValue([
      featuredArticle,
      regularArticle,
    ]);
  });

  it('only requests published articles', async () => {
    await renderPage();

    expect(nativeDB.findArticlesWithCategories).toHaveBeenCalledWith(
      expect.objectContaining({ published: true })
    );
  });

  it('renders one flat list, preserving the order the query returned', async () => {
    const { container } = await renderPage();

    // Featured-first-then-newest ordering is applied by the SQL; the page must
    // not re-sort or split the list into sections.
    expect(renderedTitleOrder(container)).toEqual([
      'Championship Final',
      'Night at the Venue',
    ]);
    expect(screen.queryByText('Featured Articles')).not.toBeInTheDocument();
    expect(screen.queryByText('All Articles')).not.toBeInTheDocument();
  });

  it('does not render a category filter row', async () => {
    const { container } = await renderPage();

    const hrefs = Array.from(container.querySelectorAll('a')).map((a) => a.getAttribute('href'));
    expect(hrefs.filter((h) => h?.startsWith('/articles?category='))).toHaveLength(0);
    expect(screen.queryByText('Rugby')).not.toBeInTheDocument();
    expect(screen.queryByText('Concerts')).not.toBeInTheDocument();
  });

  it('marks the featured article so its position at the top is explained', async () => {
    await renderPage();

    // Regression: the badge used to be nested inside the cover-image block, so
    // a featured article without a cover image showed nothing.
    expect(screen.getByText('Featured')).toBeInTheDocument();
  });

  it('shows the author byline and the publish date, not createdAt', async () => {
    await renderPage();

    expect(screen.getByText(/Jane Rivera/)).toBeInTheDocument();
    // publishDate 2026-03-05 wins over createdAt 2026-01-01
    expect(screen.getByText(/March 5, 2026/)).toBeInTheDocument();
  });

  it('falls back to createdAt when an article has no publishDate', async () => {
    (nativeDB.findArticlesWithCategories as jest.Mock).mockResolvedValue([regularArticle]);

    await renderPage();

    expect(screen.getByText(/February 2, 2026/)).toBeInTheDocument();
  });

  it('shows the excerpt as the preview text', async () => {
    await renderPage();

    expect(screen.getByText('How the final unfolded')).toBeInTheDocument();
  });

  it('falls back to a snippet of the article body when there is no excerpt', async () => {
    (nativeDB.findArticlesWithCategories as jest.Mock).mockResolvedValue([
      { ...regularArticle, excerpt: null },
    ]);

    await renderPage();

    expect(screen.getByText(/Concert body text/)).toBeInTheDocument();
  });

  it('renders the cover image alongside the preview text', async () => {
    await renderPage();

    expect(screen.getByAltText('Night at the Venue')).toHaveAttribute(
      'src',
      'https://cdn.example.com/cover.jpg'
    );
  });

  it('still resolves a ?category= slug so links from an article keep working', async () => {
    await renderPage({ category: 'concerts' });

    expect(nativeDB.findArticlesWithCategories).toHaveBeenCalledWith(
      expect.objectContaining({ categoryId: 'cat-2' })
    );
  });

  it('ignores an unknown category slug rather than filtering to nothing', async () => {
    await renderPage({ category: 'does-not-exist' });

    expect(nativeDB.findArticlesWithCategories).toHaveBeenCalledWith(
      expect.objectContaining({ categoryId: undefined })
    );
  });

  it('offers a way back to all articles when filtered', async () => {
    const { container } = await renderPage({ category: 'concerts' });

    const hrefs = Array.from(container.querySelectorAll('a')).map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/articles');
  });

  it('links each row to its article', async () => {
    const { container } = await renderPage();

    const hrefs = Array.from(container.querySelectorAll('a')).map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/articles/championship-final');
    expect(hrefs).toContain('/articles/night-at-the-venue');
  });

  it('renders the empty state when there are no articles', async () => {
    (nativeDB.findArticlesWithCategories as jest.Mock).mockResolvedValue([]);

    await renderPage();

    expect(screen.getByText(/No articles published yet/i)).toBeInTheDocument();
  });

  it('renders the empty state when a category filter matches nothing', async () => {
    (nativeDB.findArticlesWithCategories as jest.Mock).mockResolvedValue([]);

    await renderPage({ category: 'rugby' });

    expect(screen.getByText(/No articles found in Rugby/i)).toBeInTheDocument();
  });

  it('renders a list of only featured articles without falling into the empty state', async () => {
    (nativeDB.findArticlesWithCategories as jest.Mock).mockResolvedValue([featuredArticle]);

    const { container } = await renderPage();

    expect(renderedTitleOrder(container)).toEqual(['Championship Final']);
    expect(screen.queryByText(/No articles published yet/i)).not.toBeInTheDocument();
  });

  it('renders the hero image from the page header setting', async () => {
    await renderPage();

    const hero = screen.getByAltText(/articles/i);
    expect(hero).toHaveAttribute('src', '/images/hero/hero.jpg');
  });

  it('degrades to an empty list when the database query fails', async () => {
    (nativeDB.findArticlesWithCategories as jest.Mock).mockRejectedValue(new Error('db down'));

    await renderPage();

    expect(screen.getByText(/No articles published yet/i)).toBeInTheDocument();
  });
});

describe('Articles landing page metadata', () => {
  it('exports a page title and description for crawlers', async () => {
    const { metadata } = await import('@/app/articles/page');

    expect(metadata.title).toBeTruthy();
    expect(metadata.description).toBeTruthy();
    expect(metadata.openGraph).toBeTruthy();
  });
});

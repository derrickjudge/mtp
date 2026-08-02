/**
 * Admin article photo-set tests.
 *
 * Covers the photo-set picker wiring on the article editor: selecting photos
 * from the library, reordering them, removing them, and sending the resulting
 * order to the API as `photoIds` (the array order is what the backend stores
 * as each photo's `position`).
 */

import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import AdminArticles from '@/app/admin/articles/page';

jest.mock('react-hot-toast', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const photos = [
  { id: 'photo-a', title: 'Photo A', url: 'https://cdn/a.jpg', thumbnail: 'https://cdn/a-t.jpg' },
  { id: 'photo-b', title: 'Photo B', url: 'https://cdn/b.jpg', thumbnail: 'https://cdn/b-t.jpg' },
  { id: 'photo-c', title: 'Photo C', url: 'https://cdn/c.jpg', thumbnail: 'https://cdn/c-t.jpg' },
];

const existingArticle = {
  id: 'article-1',
  title: 'Rugby Finals',
  slug: 'rugby-finals',
  content: '<p>Body</p>',
  excerpt: 'An excerpt',
  published: true,
  featured: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  categories: [],
  tags: [],
  events: [],
  // Deliberately out of position order to prove sorting, not array order, wins
  photos: [
    { ...photos[1], position: 1 },
    { ...photos[2], position: 0 },
  ],
};

/** Routes the component's start-up fetches; mutating calls resolve to `saved`. */
function mockFetch(articles: unknown[], saved: unknown = { id: 'article-1' }) {
  const fetchMock = jest.fn((url: string) => {
    if (url === '/api/articles') {
      return Promise.resolve({ ok: true, json: async () => articles });
    }
    if (url === '/api/categories') return Promise.resolve({ ok: true, json: async () => [] });
    if (url === '/api/events') return Promise.resolve({ ok: true, json: async () => [] });
    if (url.startsWith('/api/photos')) {
      return Promise.resolve({ ok: true, json: async () => ({ photos }) });
    }
    return Promise.resolve({ ok: true, json: async () => saved });
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

/** The body of the last POST/PUT to an /api/articles endpoint. */
function lastSavePayload(fetchMock: jest.Mock): Record<string, unknown> {
  const saveCall = [...fetchMock.mock.calls]
    .reverse()
    .find(([, init]) => init?.method === 'POST' || init?.method === 'PUT');
  if (!saveCall) throw new Error('No save request was made');
  return JSON.parse(saveCall[1].body);
}

/** The photo-set list items, in rendered order. */
function photoSetItems(): HTMLElement[] {
  const heading = screen.getByText('Photo Set');
  const list = heading.parentElement!.querySelector('ul');
  return list ? Array.from(list.querySelectorAll('li')) : [];
}

/** Opens the editor for the first article in the list. */
async function openEditor(): Promise<void> {
  const editButton = await screen.findByRole('button', { name: 'Edit article' });
  fireEvent.click(editButton);
  await waitFor(() => expect(screen.getByText('Edit Article')).toBeInTheDocument());
}

describe('Admin articles - photo set', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends the selected photos as photoIds in selection order', async () => {
    const fetchMock = mockFetch([]);
    render(<AdminArticles />);

    fireEvent.click(await screen.findByRole('button', { name: /new article/i }));
    fireEvent.change(screen.getByLabelText(/^title/i), { target: { value: 'Match Report' } });
    fireEvent.change(screen.getByLabelText(/^content/i), { target: { value: '<p>Report</p>' } });

    fireEvent.click(screen.getByRole('button', { name: /select photos/i }));
    const modal = screen.getByText('Select Photos for This Article').closest('div')!.parentElement!;
    fireEvent.click(within(modal).getByAltText('Photo C').closest('div')!);
    fireEvent.click(within(modal).getByAltText('Photo A').closest('div')!);
    fireEvent.click(within(modal).getByRole('button', { name: '×' }));

    fireEvent.click(screen.getByRole('button', { name: /create article/i }));

    await waitFor(() => {
      expect(lastSavePayload(fetchMock).photoIds).toEqual(['photo-c', 'photo-a']);
    });
  });

  it('seeds the photo set from an edited article, sorted by position', async () => {
    mockFetch([existingArticle]);
    render(<AdminArticles />);

    await openEditor();

    // position 0 is Photo C, so it must render first despite being second in the array
    expect(photoSetItems()).toHaveLength(2);
    expect(photoSetItems()[0]).toHaveTextContent('Photo C');
    expect(photoSetItems()[1]).toHaveTextContent('Photo B');
  });

  it('reorders the set with the move buttons and saves the new order', async () => {
    const fetchMock = mockFetch([existingArticle]);
    render(<AdminArticles />);

    await openEditor();
    fireEvent.click(screen.getByRole('button', { name: /move photo b earlier/i }));

    expect(photoSetItems()[0]).toHaveTextContent('Photo B');

    fireEvent.click(screen.getByRole('button', { name: /update article/i }));

    await waitFor(() => {
      expect(lastSavePayload(fetchMock).photoIds).toEqual(['photo-b', 'photo-c']);
    });
  });

  it('removes a photo from the set', async () => {
    const fetchMock = mockFetch([existingArticle]);
    render(<AdminArticles />);

    await openEditor();
    fireEvent.click(screen.getByRole('button', { name: /remove photo c from set/i }));

    expect(photoSetItems()).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: /update article/i }));

    await waitFor(() => {
      expect(lastSavePayload(fetchMock).photoIds).toEqual(['photo-b']);
    });
  });

  it('preserves the photo set when toggling published from the list', async () => {
    const fetchMock = mockFetch([existingArticle]);
    render(<AdminArticles />);

    fireEvent.click(await screen.findByRole('button', { name: /unpublish/i }));

    await waitFor(() => {
      const payload = lastSavePayload(fetchMock);
      expect(payload.photoIds).toEqual(['photo-c', 'photo-b']);
      expect(payload.published).toBe(false);
    });
  });
});

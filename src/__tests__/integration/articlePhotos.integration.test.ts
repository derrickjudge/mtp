/**
 * Article photo-set integration tests.
 *
 * Exercises the real SQL in NativeDBService against a live PostgreSQL
 * database -- the junction DDL, ordering, and the correlated photo subquery in
 * getArticleWithRelations are all invisible to the unit tests, which mock
 * nativeDB wholesale.
 *
 * Skipped unless INTEGRATION_DATABASE_URL is set. That variable is deliberately
 * distinct from POSTGRES_PRISMA_URL/DATABASE_URL so a normal `npm test` can
 * never point these destructive tests at the real database. Run against a
 * throwaway instance, e.g.:
 *
 *   podman run -d --name mtp-sqlcheck -e POSTGRES_PASSWORD=test \
 *     -e POSTGRES_DB=sqlcheck -p 55432:5432 docker.io/library/postgres:16-alpine
 *   INTEGRATION_DATABASE_URL='postgresql://postgres:test@localhost:55432/sqlcheck?sslmode=disable' \
 *     npx jest src/__tests__/integration
 *
 * @jest-environment node
 */

import { Client } from 'pg';

const integrationUrl = process.env.INTEGRATION_DATABASE_URL;

// Point the service at the throwaway database before it is imported, so
// createClient() never sees the project's real connection string.
if (integrationUrl) {
  process.env.POSTGRES_PRISMA_URL = integrationUrl;
  process.env.DATABASE_URL = integrationUrl;
}

jest.unmock('@/lib/db-native');

const describeIntegration = integrationUrl ? describe : describe.skip;

/**
 * Minimal subset of the Prisma schema that the junction tables reference by
 * foreign key. ensureJunctionTables() creates the junctions themselves.
 */
const BASE_SCHEMA = `
  DROP TABLE IF EXISTS "_ArticleToPhoto", "_ArticleToCategory", "_ArticleToTag",
    "_CategoryToPhoto", "_PhotoToTag", "_EventPhotos", "_EventArticles",
    "_EventCategories", "SiteSettings" CASCADE;
  DROP TABLE IF EXISTS "Article", "Photo", "Event", "Category", "Tag", "User" CASCADE;

  CREATE TABLE "User" (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE "Category" (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE "Tag" (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE "Event" (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    date TIMESTAMPTZ,
    location TEXT,
    "coverImage" TEXT,
    published BOOLEAN NOT NULL DEFAULT FALSE,
    featured BOOLEAN NOT NULL DEFAULT FALSE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "authorId" TEXT NOT NULL REFERENCES "User"(id)
  );

  CREATE TABLE "Photo" (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    url TEXT NOT NULL,
    thumbnail TEXT,
    published BOOLEAN NOT NULL DEFAULT FALSE,
    featured BOOLEAN NOT NULL DEFAULT FALSE,
    metadata JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "authorId" TEXT NOT NULL REFERENCES "User"(id)
  );

  CREATE TABLE "Article" (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    "coverImage" TEXT,
    "publishDate" TIMESTAMPTZ,
    published BOOLEAN NOT NULL DEFAULT FALSE,
    featured BOOLEAN NOT NULL DEFAULT FALSE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "authorName" TEXT,
    "authorId" TEXT NOT NULL REFERENCES "User"(id)
  );

  INSERT INTO "User" (id, email, password, role) VALUES ('user-1', 'a@example.com', 'x', 'ADMIN');
`;

/**
 * Row fixtures, re-seeded per test. Kept separate from the DDL because
 * ensureJunctionTables() only runs its migrations once per process, so the
 * schema cannot be dropped and rebuilt between tests.
 */
const SEED_ROWS = `
  DELETE FROM "_ArticleToPhoto";
  DELETE FROM "_ArticleToCategory";
  DELETE FROM "_ArticleToTag";
  DELETE FROM "Article";
  DELETE FROM "Photo";
  DELETE FROM "Category";
  DELETE FROM "Tag";

  INSERT INTO "Article" (id, title, slug, content, "authorId")
    VALUES ('article-1', 'Test Article', 'test-article', '<p>Body</p>', 'user-1');
  INSERT INTO "Photo" (id, title, description, url, thumbnail, "authorId") VALUES
    ('photo-a', 'Photo A', 'First',  'https://cdn/a.jpg', 'https://cdn/a-t.jpg', 'user-1'),
    ('photo-b', 'Photo B', NULL,     'https://cdn/b.jpg', 'https://cdn/b-t.jpg', 'user-1'),
    ('photo-c', 'Photo C', 'Third',  'https://cdn/c.jpg', NULL,                  'user-1');
`;

interface GalleryPhoto {
  id: string;
  title: string;
  description: string | null;
  url: string;
  thumbnail: string | null;
  position: number;
}

describeIntegration('Article photo set (live database)', () => {
  // Imported lazily so the env overrides above are in place first.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { nativeDB } = require('@/lib/db-native');

  const connect = async (): Promise<Client> => {
    const client = new Client({ connectionString: integrationUrl });
    await client.connect();
    return client;
  };

  beforeAll(async () => {
    const client = await connect();
    try {
      await client.query(BASE_SCHEMA);
    } finally {
      await client.end();
    }
    await nativeDB.ensureJunctionTables();
  });

  beforeEach(async () => {
    const client = await connect();
    try {
      await client.query(SEED_ROWS);
    } finally {
      await client.end();
    }
  });

  it('creates the _ArticleToPhoto junction with a position column', async () => {
    const client = await connect();
    try {
      const result = await client.query(
        `SELECT column_name FROM information_schema.columns
         WHERE table_name = '_ArticleToPhoto' ORDER BY column_name`
      );
      expect(result.rows.map(r => r.column_name)).toEqual(['A', 'B', 'position']);
    } finally {
      await client.end();
    }
  });

  it('persists the supplied order as position', async () => {
    await nativeDB.linkArticleToPhotos('article-1', ['photo-c', 'photo-a', 'photo-b']);

    const client = await connect();
    try {
      const result = await client.query(
        'SELECT "B", position FROM "_ArticleToPhoto" WHERE "A" = $1 ORDER BY position'
      , ['article-1']);
      expect(result.rows).toEqual([
        { B: 'photo-c', position: 0 },
        { B: 'photo-a', position: 1 },
        { B: 'photo-b', position: 2 },
      ]);
    } finally {
      await client.end();
    }
  });

  it('returns photos from getArticleWithRelations in curated order', async () => {
    await nativeDB.linkArticleToPhotos('article-1', ['photo-c', 'photo-a', 'photo-b']);

    const article = await nativeDB.getArticleWithRelations('article-1');
    const photos: GalleryPhoto[] = article.photos;

    expect(photos.map(p => p.id)).toEqual(['photo-c', 'photo-a', 'photo-b']);
    expect(photos[0]).toEqual({
      id: 'photo-c',
      title: 'Photo C',
      description: 'Third',
      url: 'https://cdn/c.jpg',
      thumbnail: null,
      position: 0,
    });
  });

  it('does not duplicate categories or tags when photos are attached', async () => {
    const client = await connect();
    try {
      await client.query(
        `INSERT INTO "Category" (id, name, slug) VALUES ('cat-1', 'Cat One', 'cat-one')`
      );
      await client.query(`INSERT INTO "Tag" (id, name, slug) VALUES ('tag-1', 'Tag One', 'tag-one')`);
    } finally {
      await client.end();
    }
    await nativeDB.linkArticleToCategories('article-1', ['cat-1']);
    await nativeDB.linkArticleToTags('article-1', ['tag-1']);
    await nativeDB.linkArticleToPhotos('article-1', ['photo-a', 'photo-b', 'photo-c']);

    const article = await nativeDB.getArticleWithRelations('article-1');

    expect(article.categories).toHaveLength(1);
    expect(article.tags).toHaveLength(1);
    expect(article.photos).toHaveLength(3);
  });

  it('returns an empty array when the article has no photo set', async () => {
    const article = await nativeDB.getArticleWithRelations('article-1');
    expect(article.photos).toEqual([]);
  });

  it('clearArticlePhotos removes the whole set', async () => {
    await nativeDB.linkArticleToPhotos('article-1', ['photo-a', 'photo-b']);
    await nativeDB.clearArticlePhotos('article-1');

    const article = await nativeDB.getArticleWithRelations('article-1');
    expect(article.photos).toEqual([]);
  });

  it('deleting a photo removes it from the article set', async () => {
    await nativeDB.linkArticleToPhotos('article-1', ['photo-a', 'photo-b']);
    await nativeDB.deletePhoto('photo-a');

    const article = await nativeDB.getArticleWithRelations('article-1');
    expect(article.photos.map((p: GalleryPhoto) => p.id)).toEqual(['photo-b']);
  });

  describe('findArticlesWithCategories', () => {
    /** Replaces the seeded article with a set that exercises the ordering. */
    const seedForListing = async () => {
      const client = await connect();
      try {
        await client.query(`
          DELETE FROM "_ArticleToCategory";
          DELETE FROM "Article";
          INSERT INTO "Category" (id, name, slug) VALUES ('cat-1', 'Rugby', 'rugby')
            ON CONFLICT DO NOTHING;
          INSERT INTO "Article" (id, title, slug, content, excerpt, published, featured, "publishDate", "authorName", "authorId") VALUES
            ('old-featured', 'Old Featured', 'old-featured', '<p>x</p>', 'e', TRUE,  TRUE,  '2026-01-01', 'A', 'user-1'),
            ('new-plain',    'New Plain',    'new-plain',    '<p>x</p>', 'e', TRUE,  FALSE, '2026-06-01', 'B', 'user-1'),
            ('mid-plain',    'Mid Plain',    'mid-plain',    '<p>x</p>', 'e', TRUE,  FALSE, '2026-03-01', 'C', 'user-1'),
            ('draft',        'Draft',        'draft',        '<p>x</p>', 'e', FALSE, FALSE, '2026-07-01', 'D', 'user-1');
          INSERT INTO "_ArticleToCategory" VALUES ('new-plain', 'cat-1');
        `);
      } finally {
        await client.end();
      }
    };

    it('puts featured first, then newest by date', async () => {
      await seedForListing();

      const rows = await nativeDB.findArticlesWithCategories({ published: true });

      // Old Featured is the oldest but must still lead
      expect(rows.map((r: { slug: string }) => r.slug)).toEqual([
        'old-featured',
        'new-plain',
        'mid-plain',
      ]);
    });

    it('excludes unpublished articles', async () => {
      await seedForListing();

      const rows = await nativeDB.findArticlesWithCategories({ published: true });

      expect(rows.map((r: { slug: string }) => r.slug)).not.toContain('draft');
    });

    it('attaches categories and a plain-text snippet of the body', async () => {
      await seedForListing();

      const rows = await nativeDB.findArticlesWithCategories({ published: true });
      const withCategory = rows.find((r: { slug: string }) => r.slug === 'new-plain');

      expect(withCategory.categories).toEqual([
        { id: 'cat-1', name: 'Rugby', slug: 'rugby' },
      ]);
      // Tags stripped, so the preview never leaks markup
      expect(withCategory.contentSnippet).toBe('x');
    });

    it('filters by category while keeping the article\'s full category list', async () => {
      await seedForListing();

      const rows = await nativeDB.findArticlesWithCategories({
        published: true,
        categoryId: 'cat-1',
      });

      expect(rows.map((r: { slug: string }) => r.slug)).toEqual(['new-plain']);
      expect(rows[0].categories).toHaveLength(1);
    });
  });

  it('deleting an article removes its photo links but keeps the photos', async () => {
    await nativeDB.linkArticleToPhotos('article-1', ['photo-a', 'photo-b']);
    await nativeDB.deleteArticle('article-1');

    const client = await connect();
    try {
      const links = await client.query('SELECT * FROM "_ArticleToPhoto" WHERE "A" = $1', ['article-1']);
      const photos = await client.query('SELECT id FROM "Photo" ORDER BY id');
      expect(links.rows).toHaveLength(0);
      expect(photos.rows.map(r => r.id)).toEqual(['photo-a', 'photo-b', 'photo-c']);
    } finally {
      await client.end();
    }
  });
});

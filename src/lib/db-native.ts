import { Client } from 'pg';

// Native PostgreSQL client that completely bypasses Prisma
export class NativeDBService {
  private createClient(): Client {
    const baseUrl = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL;
    if (!baseUrl) {
      throw new Error('Database URL not configured');
    }

    // Parse the connection URL
    const url = new URL(baseUrl);
    
    return new Client({
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      database: url.pathname.slice(1), // Remove leading slash
      user: url.username,
      password: url.password,
      ssl: url.searchParams.get('sslmode') !== 'disable' ? { rejectUnauthorized: false } : false,
      // Disable prepared statements completely
      statement_timeout: 30000,
      query_timeout: 30000,
      application_name: `mtp-native-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    });
  }

  // Ensure junction tables exist
  async ensureJunctionTables(): Promise<void> {
    const client = this.createClient();
    try {
      await client.connect();
      
      // Create _CategoryToPhoto junction table if it doesn't exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS "_CategoryToPhoto" (
          "A" TEXT NOT NULL,
          "B" TEXT NOT NULL,
          CONSTRAINT "_CategoryToPhoto_pkey" PRIMARY KEY ("A", "B"),
          CONSTRAINT "_CategoryToPhoto_A_fkey" FOREIGN KEY ("A") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT "_CategoryToPhoto_B_fkey" FOREIGN KEY ("B") REFERENCES "Photo"("id") ON DELETE CASCADE ON UPDATE CASCADE
        )
      `);
      // Migration for category-photo ordering and top selections
      await client.query(`ALTER TABLE "_CategoryToPhoto" ADD COLUMN IF NOT EXISTS position INT NOT NULL DEFAULT 0`);
      await client.query(`ALTER TABLE "_CategoryToPhoto" ADD COLUMN IF NOT EXISTS is_top_selection BOOLEAN NOT NULL DEFAULT FALSE`);

      // Create _PhotoToTag junction table if it doesn't exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS "_PhotoToTag" (
          "A" TEXT NOT NULL,
          "B" TEXT NOT NULL,
          CONSTRAINT "_PhotoToTag_pkey" PRIMARY KEY ("A", "B"),
          CONSTRAINT "_PhotoToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Photo"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT "_PhotoToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE
        )
      `);

      // Create _ArticleToCategory junction table if it doesn't exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS "_ArticleToCategory" (
          "A" TEXT NOT NULL,
          "B" TEXT NOT NULL,
          CONSTRAINT "_ArticleToCategory_pkey" PRIMARY KEY ("A", "B"),
          CONSTRAINT "_ArticleToCategory_A_fkey" FOREIGN KEY ("A") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT "_ArticleToCategory_B_fkey" FOREIGN KEY ("B") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE
        )
      `);

      // Create _ArticleToTag junction table if it doesn't exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS "_ArticleToTag" (
          "A" TEXT NOT NULL,
          "B" TEXT NOT NULL,
          CONSTRAINT "_ArticleToTag_pkey" PRIMARY KEY ("A", "B"),
          CONSTRAINT "_ArticleToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT "_ArticleToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE
        )
      `);

      // Create Event junction tables
      await client.query(`
        CREATE TABLE IF NOT EXISTS "_EventPhotos" (
          "A" TEXT NOT NULL,
          "B" TEXT NOT NULL,
          CONSTRAINT "_EventPhotos_pkey" PRIMARY KEY ("A", "B"),
          CONSTRAINT "_EventPhotos_A_fkey" FOREIGN KEY ("A") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT "_EventPhotos_B_fkey" FOREIGN KEY ("B") REFERENCES "Photo"("id") ON DELETE CASCADE ON UPDATE CASCADE
        )
      `);

      // Migration: add ordering and top-selection columns if missing
      await client.query(`ALTER TABLE "_EventPhotos" ADD COLUMN IF NOT EXISTS position INT NOT NULL DEFAULT 0`);
      await client.query(`ALTER TABLE "_EventPhotos" ADD COLUMN IF NOT EXISTS is_top_selection BOOLEAN NOT NULL DEFAULT FALSE`);

      await client.query(`
        CREATE TABLE IF NOT EXISTS "_EventArticles" (
          "A" TEXT NOT NULL,
          "B" TEXT NOT NULL,
          CONSTRAINT "_EventArticles_pkey" PRIMARY KEY ("A", "B"),
          CONSTRAINT "_EventArticles_A_fkey" FOREIGN KEY ("A") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT "_EventArticles_B_fkey" FOREIGN KEY ("B") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE
        )
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS "_EventCategories" (
          "A" TEXT NOT NULL,
          "B" TEXT NOT NULL,
          CONSTRAINT "_EventCategories_pkey" PRIMARY KEY ("A", "B"),
          CONSTRAINT "_EventCategories_A_fkey" FOREIGN KEY ("A") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT "_EventCategories_B_fkey" FOREIGN KEY ("B") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE
        )
      `);

      // Create indexes for better performance
      await client.query(`
        CREATE INDEX IF NOT EXISTS "_CategoryToPhoto_B_index" ON "_CategoryToPhoto"("B")
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS "_CategoryToPhoto_A_position_index" ON "_CategoryToPhoto"("A", position)
      `);
      await client.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = '_CategoryToPhoto_A_position_unique'
          ) THEN
            ALTER TABLE "_CategoryToPhoto" ADD CONSTRAINT "_CategoryToPhoto_A_position_unique" UNIQUE ("A", position);
          END IF;
        END
        $$;
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS "_PhotoToTag_B_index" ON "_PhotoToTag"("B")
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS "_ArticleToCategory_B_index" ON "_ArticleToCategory"("B")
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS "_ArticleToTag_B_index" ON "_ArticleToTag"("B")
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS "_EventPhotos_B_index" ON "_EventPhotos"("B")
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS "_EventPhotos_A_position_index" ON "_EventPhotos"("A", position)
      `);

      // Ensure unique positions per event to prevent duplicate ordering indexes
      await client.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = '_EventPhotos_A_position_unique'
          ) THEN
            ALTER TABLE "_EventPhotos" ADD CONSTRAINT "_EventPhotos_A_position_unique" UNIQUE ("A", position);
          END IF;
        END
        $$;
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS "_EventArticles_B_index" ON "_EventArticles"("B")
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS "_EventCategories_B_index" ON "_EventCategories"("B")
      `);

      // Global photo ordering for "All Photos" view
      await client.query(`ALTER TABLE "Photo" ADD COLUMN IF NOT EXISTS position INT NOT NULL DEFAULT 0`);

    } catch (error) {
      console.warn('Error ensuring junction tables:', error);
      // Don't throw error - tables might already exist
    } finally {
      await client.end();
    }
  }

  async findUserByEmail(email: string): Promise<any> {
    const client = this.createClient();
    try {
      await client.connect();
      
      const result = await client.query(
        'SELECT id, email, name, password, role, "createdAt", "updatedAt" FROM "User" WHERE email = $1 LIMIT 1',
        [email]
      );
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } finally {
      await client.end();
    }
  }

  async findUserById(id: string): Promise<any> {
    const client = this.createClient();
    try {
      await client.connect();
      
      const result = await client.query(
        'SELECT id, email, name, role, "createdAt", "updatedAt" FROM "User" WHERE id = $1 LIMIT 1',
        [id]
      );
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } finally {
      await client.end();
    }
  }

  async findPhotos(options?: {
    take?: number;
    skip?: number;
    categoryId?: string;
    tagId?: string;
    eventId?: string;
    featured?: boolean;
    published?: boolean;
  }): Promise<any[]> {
    // Ensure junction tables exist before querying
    await this.ensureJunctionTables();
    
    const client = this.createClient();
    try {
      await client.connect();

      const buildQuery = (fallbackOrdering: boolean) => {
        let q = `
          SELECT p.id, p.title, p.description, p.url, p.thumbnail,
                 p.published, p.featured, p.metadata, p."createdAt", p."updatedAt", p."authorId"
          FROM "Photo" p
          WHERE 1=1
        `;
        const ps: any[] = [];
        let idx = 1;
        if (options?.published !== undefined) {
          q += ` AND p.published = $${idx}`;
          ps.push(options.published);
          idx++;
        }
        if (options?.categoryId) {
          q += ` AND EXISTS (
            SELECT 1 FROM "_CategoryToPhoto" cp 
            WHERE cp."B" = p.id AND cp."A" = $${idx}
          )`;
          ps.push(options.categoryId);
          idx++;
        }
        if (options?.eventId) {
          q += ` AND EXISTS (
            SELECT 1 FROM "_EventPhotos" ep 
            WHERE ep."B" = p.id AND ep."A" = $${idx}
          )`;
          ps.push(options.eventId);
          idx++;
        }
        if (options?.featured) {
          q += ` AND p.featured = true`;
        }
        if (fallbackOrdering) {
          q += ` ORDER BY p."createdAt" DESC`;
        } else if (options?.eventId) {
          q += ` ORDER BY (SELECT ep.position FROM "_EventPhotos" ep WHERE ep."B" = p.id AND ep."A" = $${idx - 1}) ASC NULLS LAST, p."createdAt" DESC`;
        } else if (options?.categoryId) {
          q += ` ORDER BY (SELECT cp.position FROM "_CategoryToPhoto" cp WHERE cp."B" = p.id AND cp."A" = $${idx - 1}) ASC NULLS LAST, p."createdAt" DESC`;
        } else {
          q += ` ORDER BY p.position ASC, p."createdAt" DESC`;
        }
        if (options?.take) {
          q += ` LIMIT $${idx}`;
          ps.push(options.take);
          idx++;
        }
        if (options?.skip) {
          q += ` OFFSET $${idx}`;
          ps.push(options.skip);
        }
        return { q, ps };
      };

      // Try primary ordering (position-aware)
      try {
        const { q, ps } = buildQuery(false);
        const result = await client.query(q, ps);
        return result.rows;
      } catch (err: any) {
        console.warn('findPhotos primary query failed, retrying fallback ordering', err?.message);
        // Retry with fallback ordering
        const { q, ps } = buildQuery(true);
        const result = await client.query(q, ps);
        return result.rows;
      }
    } finally {
      await client.end();
    }
  }

  async setGlobalPhotoOrdering(orderedPhotoIds: string[]): Promise<void> {
    if (!orderedPhotoIds || orderedPhotoIds.length === 0) return;
    const client = this.createClient();
    try {
      await client.connect();
      await client.query('BEGIN');
      for (let i = 0; i < orderedPhotoIds.length; i++) {
        await client.query('UPDATE "Photo" SET position = $2 WHERE id = $1', [orderedPhotoIds[i], i]);
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      await client.end();
    }
  }

  async findCategories(): Promise<any[]> {
    const client = this.createClient();
    try {
      await client.connect();
      
      const result = await client.query(
        'SELECT id, name, slug, description, "createdAt", "updatedAt" FROM "Category" ORDER BY name ASC'
      );
      
      return result.rows;
    } finally {
      await client.end();
    }
  }

  async findCategoryByName(name: string): Promise<any> {
    const client = this.createClient();
    try {
      await client.connect();
      
      const result = await client.query(
        'SELECT id, name, slug, description, "createdAt", "updatedAt" FROM "Category" WHERE name = $1 LIMIT 1',
        [name]
      );
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } finally {
      await client.end();
    }
  }

  async findCategoryById(id: string): Promise<any> {
    const client = this.createClient();
    try {
      await client.connect();
      
      const result = await client.query(
        'SELECT id, name, slug, description, "createdAt", "updatedAt" FROM "Category" WHERE id = $1 LIMIT 1',
        [id]
      );
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } finally {
      await client.end();
    }
  }

  async createCategory(name: string, slug: string, description: string): Promise<any> {
    const client = this.createClient();
    try {
      await client.connect();
      
      const result = await client.query(
        'INSERT INTO "Category" (id, name, slug, description, "createdAt", "updatedAt") VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW()) RETURNING id, name, slug, description, "createdAt", "updatedAt"',
        [name, slug, description]
      );
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } finally {
      await client.end();
    }
  }

  async updateCategory(id: string, name: string, slug: string, description: string): Promise<any> {
    const client = this.createClient();
    try {
      await client.connect();
      
      const result = await client.query(
        'UPDATE "Category" SET name = $2, slug = $3, description = $4, "updatedAt" = NOW() WHERE id = $1 RETURNING id, name, slug, description, "createdAt", "updatedAt"',
        [id, name, slug, description]
      );
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } finally {
      await client.end();
    }
  }

  async deleteCategory(id: string): Promise<boolean> {
    const client = this.createClient();
    try {
      await client.connect();
      
      await client.query('DELETE FROM "Category" WHERE id = $1', [id]);
      return true;
    } finally {
      await client.end();
    }
  }

  async getCategoryWithPhotos(id: string): Promise<any> {
    // Ensure junction tables exist before querying
    await this.ensureJunctionTables();
    
    const client = this.createClient();
    try {
      await client.connect();
      
      const result = await client.query(
        `SELECT c.id, c.name, c.slug, c.description, c."createdAt", c."updatedAt",
                COUNT(cp."B") as photo_count
         FROM "Category" c
         LEFT JOIN "_CategoryToPhoto" cp ON c.id = cp."A"
         WHERE c.id = $1
         GROUP BY c.id, c.name, c.slug, c.description, c."createdAt", c."updatedAt"
         LIMIT 1`,
        [id]
      );
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } finally {
      await client.end();
    }
  }

  async createPhoto(data: {
    title: string;
    description?: string;
    url: string;
    thumbnail?: string;
    authorId: string;
    metadata?: any;
    published?: boolean;
    featured?: boolean;
  }): Promise<any> {
    const client = this.createClient();
    try {
      await client.connect();
      
      const result = await client.query(
        `INSERT INTO "Photo" (id, title, description, url, thumbnail, published, featured, metadata, "authorId", "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
         RETURNING id, title, description, url, thumbnail, published, featured, metadata, "authorId", "createdAt", "updatedAt"`,
        [
          data.title,
          data.description || null,
          data.url,
          data.thumbnail || null,
          data.published ?? true,
          data.featured ?? false,
          data.metadata ? JSON.stringify(data.metadata) : null,
          data.authorId
        ]
      );
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } finally {
      await client.end();
    }
  }

  async linkPhotoToCategories(photoId: string, categoryIds: string[]): Promise<void> {
    if (categoryIds.length === 0) return;
    
    // Ensure junction tables exist before linking
    await this.ensureJunctionTables();
    
    const client = this.createClient();
    try {
      await client.connect();
      
      // Insert multiple category-photo relationships
      const values = categoryIds.map((_, index) => `($${index * 2 + 1}, $${index * 2 + 2})`).join(', ');
      const params = categoryIds.flatMap(categoryId => [categoryId, photoId]);
      
      await client.query(
        `INSERT INTO "_CategoryToPhoto" ("A", "B") VALUES ${values} ON CONFLICT DO NOTHING`,
        params
      );
    } finally {
      await client.end();
    }
  }

  async linkPhotoToTags(photoId: string, tagIds: string[]): Promise<void> {
    if (tagIds.length === 0) return;
    
    // Ensure junction tables exist before linking
    await this.ensureJunctionTables();
    
    const client = this.createClient();
    try {
      await client.connect();
      
      // Insert multiple tag-photo relationships
      const values = tagIds.map((_, index) => `($${index * 2 + 1}, $${index * 2 + 2})`).join(', ');
      const params = tagIds.flatMap(tagId => [tagId, photoId]);
      
      await client.query(
        `INSERT INTO "_PhotoToTag" ("A", "B") VALUES ${values} ON CONFLICT DO NOTHING`,
        params
      );
    } finally {
      await client.end();
    }
  }

  async findPhotoById(id: string): Promise<any> {
    const client = this.createClient();
    try {
      await client.connect();
      
      const result = await client.query(
        'SELECT id, title, description, url, thumbnail, published, featured, metadata, "authorId", "createdAt", "updatedAt" FROM "Photo" WHERE id = $1 LIMIT 1',
        [id]
      );
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } finally {
      await client.end();
    }
  }

  async deletePhoto(id: string): Promise<boolean> {
    // Ensure junction tables exist before deleting
    await this.ensureJunctionTables();
    
    const client = this.createClient();
    try {
      await client.connect();
      
      // Delete photo relationships first
      await client.query('DELETE FROM "_CategoryToPhoto" WHERE "B" = $1', [id]);
      await client.query('DELETE FROM "_PhotoToTag" WHERE "A" = $1', [id]);
      
      // Delete the photo
      await client.query('DELETE FROM "Photo" WHERE id = $1', [id]);
      
      return true;
    } finally {
      await client.end();
    }
  }

  async updatePhoto(id: string, data: {
    title: string;
    description?: string;
    published?: boolean;
    featured?: boolean;
  }): Promise<any> {
    const client = this.createClient();
    try {
      await client.connect();
      
      const result = await client.query(
        `UPDATE "Photo" 
         SET title = $2, description = $3, published = $4, featured = $5, "updatedAt" = NOW() 
         WHERE id = $1 
         RETURNING id, title, description, url, thumbnail, published, featured, metadata, "authorId", "createdAt", "updatedAt"`,
        [id, data.title, data.description || null, data.published ?? true, data.featured ?? false]
      );
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } finally {
      await client.end();
    }
  }

  async clearPhotoCategories(photoId: string): Promise<void> {
    // Ensure junction tables exist before clearing
    await this.ensureJunctionTables();
    
    const client = this.createClient();
    try {
      await client.connect();
      
      await client.query('DELETE FROM "_CategoryToPhoto" WHERE "B" = $1', [photoId]);
    } finally {
      await client.end();
    }
  }

  async clearPhotoTags(photoId: string): Promise<void> {
    // Ensure junction tables exist before clearing
    await this.ensureJunctionTables();
    
    const client = this.createClient();
    try {
      await client.connect();
      
      await client.query('DELETE FROM "_PhotoToTag" WHERE "A" = $1', [photoId]);
    } finally {
      await client.end();
    }
  }

  async linkPhotoToEvents(photoId: string, eventIds: string[]): Promise<void> {
    if (eventIds.length === 0) return;
    
    // Ensure junction tables exist before linking
    await this.ensureJunctionTables();
    
    const client = this.createClient();
    try {
      await client.connect();
      
      // Insert multiple event-photo relationships
      const values = eventIds.map((eventId, index) => `($${index * 2 + 1}, $${index * 2 + 2})`).join(', ');
      const params = eventIds.flatMap(eventId => [eventId, photoId]);
      
      const query = `INSERT INTO "_EventPhotos" ("A", "B") VALUES ${values} ON CONFLICT DO NOTHING`;
      await client.query(query, params);
    } finally {
      await client.end();
    }
  }

  async clearPhotoEvents(photoId: string): Promise<void> {
    // Ensure junction tables exist before clearing
    await this.ensureJunctionTables();
    
    const client = this.createClient();
    try {
      await client.connect();
      
      await client.query('DELETE FROM "_EventPhotos" WHERE "B" = $1', [photoId]);
    } finally {
      await client.end();
    }
  }

  async linkArticleToEvents(articleId: string, eventIds: string[]): Promise<void> {
    if (eventIds.length === 0) return;
    
    // Ensure junction tables exist before linking
    await this.ensureJunctionTables();
    
    const client = this.createClient();
    try {
      await client.connect();
      
      // Insert multiple event-article relationships
      const values = eventIds.map((eventId, index) => `($${index * 2 + 1}, $${index * 2 + 2})`).join(', ');
      const params = eventIds.flatMap(eventId => [eventId, articleId]);
      
      const query = `INSERT INTO "_EventArticles" ("A", "B") VALUES ${values} ON CONFLICT DO NOTHING`;
      await client.query(query, params);
    } finally {
      await client.end();
    }
  }

  async clearArticleEvents(articleId: string): Promise<void> {
    // Ensure junction tables exist before clearing
    await this.ensureJunctionTables();
    
    const client = this.createClient();
    try {
      await client.connect();
      
      await client.query('DELETE FROM "_EventArticles" WHERE "B" = $1', [articleId]);
    } finally {
      await client.end();
    }
  }

  async getPhotoWithRelations(id: string): Promise<any> {
    // Ensure junction tables exist before querying
    await this.ensureJunctionTables();
    
    const client = this.createClient();
    try {
      await client.connect();
      
      // Get photo with categories, tags, and events
      const result = await client.query(
        `SELECT 
           p.id, p.title, p.description, p.url, p.thumbnail, p.published, p.featured, 
           p.metadata, p."authorId", p."createdAt", p."updatedAt",
           COALESCE(
             json_agg(
               DISTINCT jsonb_build_object(
                 'id', c.id, 
                 'name', c.name, 
                 'slug', c.slug, 
                 'description', c.description
               )
             ) FILTER (WHERE c.id IS NOT NULL), 
             '[]'
           ) as categories,
           COALESCE(
             json_agg(
               DISTINCT jsonb_build_object(
                 'id', t.id, 
                 'name', t.name, 
                 'slug', t.slug
               )
             ) FILTER (WHERE t.id IS NOT NULL), 
             '[]'
           ) as tags,
           COALESCE(
             json_agg(
               DISTINCT jsonb_build_object(
                 'id', e.id, 
                 'name', e.name, 
                 'slug', e.slug,
                 'description', e.description,
                 'date', e.date,
                 'location', e.location
               )
             ) FILTER (WHERE e.id IS NOT NULL), 
             '[]'
           ) as events
         FROM "Photo" p
         LEFT JOIN "_CategoryToPhoto" cp ON p.id = cp."B"
         LEFT JOIN "Category" c ON cp."A" = c.id
         LEFT JOIN "_PhotoToTag" pt ON p.id = pt."A"
         LEFT JOIN "Tag" t ON pt."B" = t.id
         LEFT JOIN "_EventPhotos" ep ON p.id = ep."B"
         LEFT JOIN "Event" e ON ep."A" = e.id
         WHERE p.id = $1
         GROUP BY p.id, p.title, p.description, p.url, p.thumbnail, p.published, p.featured, p.metadata, p."authorId", p."createdAt", p."updatedAt"
         LIMIT 1`,
        [id]
      );
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } finally {
      await client.end();
    }
  }

  // Find users for author selection
  async findUsers(): Promise<any[]> {
    const client = this.createClient();
    try {
      await client.connect();
      
      const result = await client.query(
        'SELECT id, email, name, role FROM "User" ORDER BY name ASC, email ASC'
      );
      
      return result.rows;
    } finally {
      await client.end();
    }
  }

  async findArticles(options?: {
    take?: number;
    skip?: number;
    published?: boolean;
    featured?: boolean;
    categoryId?: string;
    tagId?: string;
  }): Promise<any[]> {
    await this.ensureJunctionTables();
    
    const client = this.createClient();
    try {
      await client.connect();
      
      let query = `
        SELECT a.id, a.title, a.slug, a.content, a.excerpt, a."coverImage", 
               a.published, a.featured, a."publishDate", a."createdAt", a."updatedAt", a."authorId"
        FROM "Article" a
        WHERE 1=1
      `;
      
      const params: any[] = [];
      let paramIndex = 1;

      if (options?.published !== undefined) {
        query += ` AND a.published = $${paramIndex}`;
        params.push(options.published);
        paramIndex++;
      }

      if (options?.featured) {
        query += ` AND a.featured = true`;
      }

      if (options?.categoryId) {
        query += ` AND EXISTS (
          SELECT 1 FROM "_ArticleToCategory" ac 
          WHERE ac."A" = a.id AND ac."B" = $${paramIndex}
        )`;
        params.push(options.categoryId);
        paramIndex++;
      }

      query += ` ORDER BY COALESCE(a."publishDate", a."createdAt") DESC`;

      if (options?.take) {
        query += ` LIMIT $${paramIndex}`;
        params.push(options.take);
        paramIndex++;
      }

      if (options?.skip) {
        query += ` OFFSET $${paramIndex}`;
        params.push(options.skip);
      }

      const result = await client.query(query, params);
      return result.rows;
    } finally {
      await client.end();
    }
  }

  async findArticleById(id: string): Promise<any> {
    const client = this.createClient();
    try {
      await client.connect();
      
      const result = await client.query(
        'SELECT id, title, slug, content, excerpt, "coverImage", published, featured, "publishDate", "authorId", "createdAt", "updatedAt" FROM "Article" WHERE id = $1 LIMIT 1',
        [id]
      );
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } finally {
      await client.end();
    }
  }

  async findArticleBySlug(slug: string): Promise<any> {
    const client = this.createClient();
    try {
      await client.connect();
      
      const result = await client.query(
        'SELECT id, title, slug, content, excerpt, "coverImage", published, featured, "publishDate", "authorId", "createdAt", "updatedAt" FROM "Article" WHERE slug = $1 LIMIT 1',
        [slug]
      );
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } finally {
      await client.end();
    }
  }

  async createArticle(data: {
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    coverImage?: string;
    publishDate?: string;
    published?: boolean;
    featured?: boolean;
    metaDescription?: string;
    authorId: string;
  }): Promise<any> {
    const client = this.createClient();
    try {
      await client.connect();
      
      const result = await client.query(
        `INSERT INTO "Article" (id, title, slug, content, excerpt, "coverImage", "publishDate", published, featured, "authorId", "createdAt", "updatedAt") 
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()) 
         RETURNING id, title, slug, content, excerpt, "coverImage", "publishDate", published, featured, "authorId", "createdAt", "updatedAt"`,
        [
          data.title,
          data.slug,
          data.content,
          data.excerpt || null,
          data.coverImage || null,
          data.publishDate ? new Date(data.publishDate).toISOString() : null,
          data.published ?? false,
          data.featured ?? false,
          data.authorId
        ]
      );
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } finally {
      await client.end();
    }
  }

  async updateArticle(id: string, data: {
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    coverImage?: string;
    publishDate?: string;
    published?: boolean;
    featured?: boolean;
    authorId?: string;
  }): Promise<any> {
    const client = this.createClient();
    try {
      await client.connect();
      
      const result = await client.query(
        `UPDATE "Article" 
         SET title = $2, slug = $3, content = $4, excerpt = $5, "coverImage" = $6, 
             "publishDate" = $7, published = $8, featured = $9, "authorId" = $10, "updatedAt" = NOW() 
         WHERE id = $1 
         RETURNING id, title, slug, content, excerpt, "coverImage", "publishDate", published, featured, "authorId", "createdAt", "updatedAt"`,
        [
          id,
          data.title,
          data.slug,
          data.content,
          data.excerpt || null,
          data.coverImage || null,
          data.publishDate ? new Date(data.publishDate).toISOString() : null,
          data.published ?? false,
          data.featured ?? false,
          data.authorId
        ]
      );
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } finally {
      await client.end();
    }
  }

  async deleteArticle(id: string): Promise<boolean> {
    await this.ensureJunctionTables();
    
    const client = this.createClient();
    try {
      await client.connect();
      
      // Delete article relationships first
      await client.query('DELETE FROM "_ArticleToCategory" WHERE "A" = $1', [id]);
      await client.query('DELETE FROM "_ArticleToTag" WHERE "A" = $1', [id]);
      
      // Delete the article
      const result = await client.query('DELETE FROM "Article" WHERE id = $1', [id]);
      
      return (result.rowCount ?? 0) > 0;
    } finally {
      await client.end();
    }
  }

  async linkArticleToCategories(articleId: string, categoryIds: string[]): Promise<void> {
    if (categoryIds.length === 0) return;
    
    await this.ensureJunctionTables();
    
    const client = this.createClient();
    try {
      await client.connect();
      
      // Insert multiple article-category relationships
      const values = categoryIds.map((_, index) => `($${index * 2 + 1}, $${index * 2 + 2})`).join(', ');
      const params = categoryIds.flatMap(categoryId => [articleId, categoryId]);
      
      await client.query(
        `INSERT INTO "_ArticleToCategory" ("A", "B") VALUES ${values} ON CONFLICT DO NOTHING`,
        params
      );
    } finally {
      await client.end();
    }
  }

  async linkArticleToTags(articleId: string, tagIds: string[]): Promise<void> {
    if (tagIds.length === 0) return;
    
    await this.ensureJunctionTables();
    
    const client = this.createClient();
    try {
      await client.connect();
      
      // Insert multiple article-tag relationships
      const values = tagIds.map((_, index) => `($${index * 2 + 1}, $${index * 2 + 2})`).join(', ');
      const params = tagIds.flatMap(tagId => [articleId, tagId]);
      
      await client.query(
        `INSERT INTO "_ArticleToTag" ("A", "B") VALUES ${values} ON CONFLICT DO NOTHING`,
        params
      );
    } finally {
      await client.end();
    }
  }

  async clearArticleCategories(articleId: string): Promise<void> {
    await this.ensureJunctionTables();
    
    const client = this.createClient();
    try {
      await client.connect();
      
      await client.query('DELETE FROM "_ArticleToCategory" WHERE "A" = $1', [articleId]);
    } finally {
      await client.end();
    }
  }

  async clearArticleTags(articleId: string): Promise<void> {
    await this.ensureJunctionTables();
    
    const client = this.createClient();
    try {
      await client.connect();
      
      await client.query('DELETE FROM "_ArticleToTag" WHERE "A" = $1', [articleId]);
    } finally {
      await client.end();
    }
  }

  async getArticleWithRelations(id: string): Promise<any> {
    await this.ensureJunctionTables();
    
    const client = this.createClient();
    try {
      await client.connect();
      
      // Get article with categories, tags, and events
      const result = await client.query(
        `SELECT 
           a.id, a.title, a.slug, a.content, a.excerpt, a."coverImage", 
           a.published, a.featured, a."authorId", a."createdAt", a."updatedAt", a."publishDate",
           COALESCE(
             json_agg(
               DISTINCT jsonb_build_object(
                 'id', c.id, 
                 'name', c.name, 
                 'slug', c.slug, 
                 'description', c.description
               )
             ) FILTER (WHERE c.id IS NOT NULL), 
             '[]'
           ) as categories,
           COALESCE(
             json_agg(
               DISTINCT jsonb_build_object(
                 'id', t.id, 
                 'name', t.name, 
                 'slug', t.slug
               )
             ) FILTER (WHERE t.id IS NOT NULL), 
             '[]'
           ) as tags,
           COALESCE(
             json_agg(
               DISTINCT jsonb_build_object(
                 'id', e.id, 
                 'name', e.name, 
                 'slug', e.slug, 
                 'description', e.description,
                 'date', e.date,
                 'location', e.location
               )
             ) FILTER (WHERE e.id IS NOT NULL), 
             '[]'
           ) as events
         FROM "Article" a
         LEFT JOIN "_ArticleToCategory" ac ON a.id = ac."A"
         LEFT JOIN "Category" c ON ac."B" = c.id
         LEFT JOIN "_ArticleToTag" at ON a.id = at."A"
         LEFT JOIN "Tag" t ON at."B" = t.id
         LEFT JOIN "_EventArticles" ea ON a.id = ea."B"
         LEFT JOIN "Event" e ON ea."A" = e.id
         WHERE a.id = $1
         GROUP BY a.id, a.title, a.slug, a.content, a.excerpt, a."coverImage", a.published, a.featured, a."authorId", a."createdAt", a."updatedAt", a."publishDate"
         LIMIT 1`,
        [id]
      );
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } finally {
      await client.end();
    }
  }

  // Event CRUD operations
  async findEvents(options?: {
    take?: number;
    skip?: number;
    published?: boolean;
    featured?: boolean;
    categoryId?: string;
    upcoming?: boolean;
  }): Promise<any[]> {
    await this.ensureJunctionTables();
    
    const client = this.createClient();
    try {
      await client.connect();
      
      let query = `
        SELECT e.id, e.name, e.slug, e.description, e.date, e.location, 
               e."coverImage", e.published, e.featured, e."createdAt", e."updatedAt", e."authorId"
        FROM "Event" e
        WHERE 1=1
      `;
      
      const params: any[] = [];
      let paramIndex = 1;

      if (options?.published !== undefined) {
        query += ` AND e.published = $${paramIndex}`;
        params.push(options.published);
        paramIndex++;
      }

      if (options?.featured) {
        query += ` AND e.featured = true`;
      }

      if (options?.categoryId) {
        query += ` AND EXISTS (
          SELECT 1 FROM "_EventCategories" ec 
          WHERE ec."A" = e.id AND ec."B" = $${paramIndex}
        )`;
        params.push(options.categoryId);
        paramIndex++;
      }

      if (options?.upcoming) {
        query += ` AND e.date > NOW()`;
      }

      query += ` ORDER BY e.date DESC NULLS LAST, e."createdAt" DESC`;

      if (options?.take) {
        query += ` LIMIT $${paramIndex}`;
        params.push(options.take);
        paramIndex++;
      }

      if (options?.skip) {
        query += ` OFFSET $${paramIndex}`;
        params.push(options.skip);
      }

      const result = await client.query(query, params);
      return result.rows;
    } finally {
      await client.end();
    }
  }

  async findEventById(id: string): Promise<any> {
    const client = this.createClient();
    try {
      await client.connect();
      
      const result = await client.query(
        'SELECT id, name, slug, description, date, location, "coverImage", published, featured, "authorId", "createdAt", "updatedAt" FROM "Event" WHERE id = $1 LIMIT 1',
        [id]
      );
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } finally {
      await client.end();
    }
  }

  async findEventBySlug(slug: string): Promise<any> {
    const client = this.createClient();
    try {
      await client.connect();
      
      const result = await client.query(
        'SELECT id, name, slug, description, date, location, "coverImage", published, featured, "authorId", "createdAt", "updatedAt" FROM "Event" WHERE slug = $1 LIMIT 1',
        [slug]
      );
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } finally {
      await client.end();
    }
  }

  async createEvent(data: {
    name: string;
    slug: string;
    description?: string;
    date?: string;
    location?: string;
    coverImage?: string;
    published?: boolean;
    featured?: boolean;
    authorId: string;
  }): Promise<any> {
    const client = this.createClient();
    try {
      await client.connect();
      
      const result = await client.query(
        `INSERT INTO "Event" (id, name, slug, description, date, location, "coverImage", published, featured, "authorId", "createdAt", "updatedAt") 
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()) 
         RETURNING id, name, slug, description, date, location, "coverImage", published, featured, "authorId", "createdAt", "updatedAt"`,
        [
          data.name,
          data.slug,
          data.description || null,
          data.date ? new Date(data.date).toISOString() : null,
          data.location || null,
          data.coverImage || null,
          data.published ?? false,
          data.featured ?? false,
          data.authorId
        ]
      );
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } finally {
      await client.end();
    }
  }

  async updateEvent(id: string, data: {
    name: string;
    slug: string;
    description?: string;
    date?: string;
    location?: string;
    coverImage?: string;
    published?: boolean;
    featured?: boolean;
  }): Promise<any> {
    const client = this.createClient();
    try {
      await client.connect();
      
      const result = await client.query(
        `UPDATE "Event" 
         SET name = $2, slug = $3, description = $4, date = $5, location = $6, 
             "coverImage" = $7, published = $8, featured = $9, "updatedAt" = NOW() 
         WHERE id = $1 
         RETURNING id, name, slug, description, date, location, "coverImage", published, featured, "authorId", "createdAt", "updatedAt"`,
        [
          id,
          data.name,
          data.slug,
          data.description || null,
          data.date ? new Date(data.date).toISOString() : null,
          data.location || null,
          data.coverImage || null,
          data.published ?? false,
          data.featured ?? false
        ]
      );
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } finally {
      await client.end();
    }
  }

  async deleteEvent(id: string): Promise<boolean> {
    await this.ensureJunctionTables();
    
    const client = this.createClient();
    try {
      await client.connect();
      
      // Delete event relationships first
      await client.query('DELETE FROM "_EventCategories" WHERE "A" = $1', [id]);
      await client.query('DELETE FROM "_EventPhotos" WHERE "A" = $1', [id]);
      await client.query('DELETE FROM "_EventArticles" WHERE "A" = $1', [id]);
      
      // Delete the event
      const result = await client.query('DELETE FROM "Event" WHERE id = $1', [id]);
      
      return (result.rowCount ?? 0) > 0;
    } finally {
      await client.end();
    }
  }

  async linkEventToCategories(eventId: string, categoryIds: string[]): Promise<void> {
    if (categoryIds.length === 0) return;
    
    await this.ensureJunctionTables();
    
    const client = this.createClient();
    try {
      await client.connect();
      
      const values = categoryIds.map((_, index) => `($${index * 2 + 1}, $${index * 2 + 2})`).join(', ');
      const params = categoryIds.flatMap(categoryId => [eventId, categoryId]);
      
      await client.query(
        `INSERT INTO "_EventCategories" ("A", "B") VALUES ${values} ON CONFLICT DO NOTHING`,
        params
      );
    } finally {
      await client.end();
    }
  }

  async linkEventToPhotos(eventId: string, photoIds: string[]): Promise<void> {
    if (photoIds.length === 0) return;
    
    await this.ensureJunctionTables();
    
    const client = this.createClient();
    try {
      await client.connect();
      // Determine starting position (append semantics)
      const startPosRes = await client.query('SELECT COALESCE(MAX(position) + 1, 0) AS start FROM "_EventPhotos" WHERE "A" = $1', [eventId]);
      let start = Number(startPosRes.rows[0]?.start ?? 0);
      const values = photoIds.map((_, index) => `($1, $${index + 2}, $${index + 2 + photoIds.length}, FALSE)`).join(', ');
      const params = [eventId, ...photoIds, ...photoIds.map((_, i) => start + i)];
      await client.query(
        `INSERT INTO "_EventPhotos" ("A", "B", position, is_top_selection) VALUES ${values} 
         ON CONFLICT ("A","B") DO NOTHING`,
        params
      );
    } finally {
      await client.end();
    }
  }

  async setEventPhotoCuration(eventId: string, orderedPhotoIds: string[], topPhotoIds: string[]): Promise<void> {
    await this.ensureJunctionTables();
    const client = this.createClient();
    try {
      await client.connect();
      await client.query('BEGIN');
      // Ensure rows exist for any new ids
      if (orderedPhotoIds.length > 0) {
        const placeholders = orderedPhotoIds.map((_, i) => `($1, $${i + 2})`).join(', ');
        await client.query(
          `INSERT INTO "_EventPhotos" ("A", "B") VALUES ${placeholders} ON CONFLICT ("A","B") DO NOTHING`,
          [eventId, ...orderedPhotoIds]
        );
      }
      // Update positions
      for (let i = 0; i < orderedPhotoIds.length; i++) {
        await client.query(
          `UPDATE "_EventPhotos" SET position = $3 WHERE "A" = $1 AND "B" = $2`,
          [eventId, orderedPhotoIds[i], i]
        );
      }
      // Reset all to false, then set tops
      await client.query(`UPDATE "_EventPhotos" SET is_top_selection = FALSE WHERE "A" = $1`, [eventId]);
      if (topPhotoIds.length > 0) {
        const setTopPlaceholders = topPhotoIds.map((_, i) => `$${i + 2}`).join(', ');
        await client.query(
          `UPDATE "_EventPhotos" SET is_top_selection = TRUE WHERE "A" = $1 AND "B" IN (${setTopPlaceholders})`,
          [eventId, ...topPhotoIds]
        );
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      await client.end();
    }
  }

  async linkEventToArticles(eventId: string, articleIds: string[]): Promise<void> {
    if (articleIds.length === 0) return;
    
    await this.ensureJunctionTables();
    
    const client = this.createClient();
    try {
      await client.connect();
      
      const values = articleIds.map((_, index) => `($${index * 2 + 1}, $${index * 2 + 2})`).join(', ');
      const params = articleIds.flatMap(articleId => [eventId, articleId]);
      
      await client.query(
        `INSERT INTO "_EventArticles" ("A", "B") VALUES ${values} ON CONFLICT DO NOTHING`,
        params
      );
    } finally {
      await client.end();
    }
  }

  async clearEventCategories(eventId: string): Promise<void> {
    await this.ensureJunctionTables();
    
    const client = this.createClient();
    try {
      await client.connect();
      
      await client.query('DELETE FROM "_EventCategories" WHERE "A" = $1', [eventId]);
    } finally {
      await client.end();
    }
  }

  async clearEventPhotos(eventId: string): Promise<void> {
    await this.ensureJunctionTables();
    
    const client = this.createClient();
    try {
      await client.connect();
      
      await client.query('DELETE FROM "_EventPhotos" WHERE "A" = $1', [eventId]);
    } finally {
      await client.end();
    }
  }

  async clearEventArticles(eventId: string): Promise<void> {
    await this.ensureJunctionTables();
    
    const client = this.createClient();
    try {
      await client.connect();
      
      await client.query('DELETE FROM "_EventArticles" WHERE "A" = $1', [eventId]);
    } finally {
      await client.end();
    }
  }

  async getEventWithRelations(id: string): Promise<any> {
    await this.ensureJunctionTables();
    
    const client = this.createClient();
    try {
      await client.connect();
      
      const result = await client.query(
        `WITH ordered_photos AS (
           SELECT p.id, p.title, p.url, p.thumbnail, ep.position, ep.is_top_selection
           FROM "_EventPhotos" ep
           JOIN "Photo" p ON p.id = ep."B"
           WHERE ep."A" = $1
           ORDER BY ep.position ASC, p."createdAt" DESC
         )
         SELECT 
           e.id, e.name, e.slug, e.description, e.date, e.location, e."coverImage", 
           e.published, e.featured, e."authorId", e."createdAt", e."updatedAt",
           COALESCE(
             json_agg(
               DISTINCT jsonb_build_object(
                 'id', c.id, 
                 'name', c.name, 
                 'slug', c.slug, 
                 'description', c.description
               )
             ) FILTER (WHERE c.id IS NOT NULL), 
             '[]'
           ) as categories,
           COALESCE(
             json_agg(
               DISTINCT jsonb_build_object(
                 'id', op.id, 
                 'title', op.title, 
                 'url', op.url, 
                 'thumbnail', op.thumbnail,
                 'position', op.position,
                 'is_top_selection', op.is_top_selection
               )
             ) FILTER (WHERE op.id IS NOT NULL), 
             '[]'
           ) as photos,
           COALESCE(
             json_agg(
               DISTINCT jsonb_build_object(
                 'id', a.id, 
                 'title', a.title, 
                 'slug', a.slug, 
                 'excerpt', a.excerpt,
                 'coverImage', a."coverImage"
               )
             ) FILTER (WHERE a.id IS NOT NULL), 
             '[]'
           ) as articles
         FROM "Event" e
         LEFT JOIN "_EventCategories" ec ON e.id = ec."A"
         LEFT JOIN "Category" c ON ec."B" = c.id
         LEFT JOIN ordered_photos op ON TRUE
         LEFT JOIN "_EventArticles" ea ON e.id = ea."A"
         LEFT JOIN "Article" a ON ea."B" = a.id
         WHERE e.id = $1
         GROUP BY e.id, e.name, e.slug, e.description, e.date, e.location, e."coverImage", e.published, e.featured, e."authorId", e."createdAt", e."updatedAt"
         LIMIT 1`,
        [id]
      );
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } finally {
      await client.end();
    }
  }
}

export const nativeDB = new NativeDBService(); 
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

      // Create indexes for better performance
      await client.query(`
        CREATE INDEX IF NOT EXISTS "_CategoryToPhoto_B_index" ON "_CategoryToPhoto"("B")
      `);
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS "_PhotoToTag_B_index" ON "_PhotoToTag"("B")
      `);

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
    featured?: boolean;
  }): Promise<any[]> {
    // Ensure junction tables exist before querying
    await this.ensureJunctionTables();
    
    const client = this.createClient();
    try {
      await client.connect();
      
      let query = `
        SELECT DISTINCT p.id, p.title, p.description, p.url, p.thumbnail, 
               p.published, p.featured, p.metadata, p."createdAt", p."updatedAt", p."authorId"
        FROM "Photo" p
        WHERE p.published = true
      `;
      
      const params: any[] = [];
      let paramIndex = 1;

      if (options?.categoryId) {
        query += ` AND EXISTS (
          SELECT 1 FROM "_CategoryToPhoto" cp 
          WHERE cp."B" = p.id AND cp."A" = $${paramIndex}
        )`;
        params.push(options.categoryId);
        paramIndex++;
      }

      if (options?.featured) {
        query += ` AND p.featured = true`;
      }

      query += ` ORDER BY p."createdAt" DESC`;

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

  async getPhotoWithRelations(id: string): Promise<any> {
    // Ensure junction tables exist before querying
    await this.ensureJunctionTables();
    
    const client = this.createClient();
    try {
      await client.connect();
      
      // Get photo with categories and tags
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
           ) as tags
         FROM "Photo" p
         LEFT JOIN "_CategoryToPhoto" cp ON p.id = cp."B"
         LEFT JOIN "Category" c ON cp."A" = c.id
         LEFT JOIN "_PhotoToTag" pt ON p.id = pt."A"
         LEFT JOIN "Tag" t ON pt."B" = t.id
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
}

export const nativeDB = new NativeDBService(); 
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
}

export const nativeDB = new NativeDBService(); 
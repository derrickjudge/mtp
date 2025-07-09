import { PrismaClient } from '@prisma/client';

// Raw SQL operations to bypass prepared statement issues
export class RawDBService {
  private createClient(): PrismaClient {
    const baseUrl = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL;
    if (!baseUrl) {
      throw new Error('Database URL not configured');
    }

    const url = new URL(baseUrl);
    
    // Use raw connection parameters
    url.searchParams.set('connection_limit', '1');
    url.searchParams.set('pool_timeout', '0');
    url.searchParams.set('prepared_statements', 'false');
    
    // Generate unique connection identifier
    const uniqueId = `raw-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    url.searchParams.set('application_name', uniqueId);

    return new PrismaClient({
      datasources: {
        db: {
          url: url.toString(),
        },
      },
      log: ['error'],
    });
  }

  async findUserByEmail(email: string): Promise<any> {
    const client = this.createClient();
    try {
      const result = await client.$queryRaw`
        SELECT id, email, name, password, role, "createdAt", "updatedAt"
        FROM "User" 
        WHERE email = ${email}
        LIMIT 1
      `;
      
      return Array.isArray(result) && result.length > 0 ? result[0] : null;
    } finally {
      await client.$disconnect();
    }
  }

  async findUserById(id: string): Promise<any> {
    const client = this.createClient();
    try {
      const result = await client.$queryRaw`
        SELECT id, email, name, role, "createdAt", "updatedAt"
        FROM "User" 
        WHERE id = ${id}
        LIMIT 1
      `;
      
      return Array.isArray(result) && result.length > 0 ? result[0] : null;
    } finally {
      await client.$disconnect();
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

      const result = await client.$queryRawUnsafe(query, ...params);
      return Array.isArray(result) ? result : [];
    } finally {
      await client.$disconnect();
    }
  }

  async findCategories(): Promise<any[]> {
    const client = this.createClient();
    try {
      const result = await client.$queryRaw`
        SELECT id, name, slug, description, "createdAt", "updatedAt"
        FROM "Category"
        ORDER BY name ASC
      `;
      
      return Array.isArray(result) ? result : [];
    } finally {
      await client.$disconnect();
    }
  }

  async findCategoryByName(name: string): Promise<any> {
    const client = this.createClient();
    try {
      const result = await client.$queryRaw`
        SELECT id, name, slug, description, "createdAt", "updatedAt"
        FROM "Category"
        WHERE name = ${name}
        LIMIT 1
      `;
      
      return Array.isArray(result) && result.length > 0 ? result[0] : null;
    } finally {
      await client.$disconnect();
    }
  }

  async findCategoryById(id: string): Promise<any> {
    const client = this.createClient();
    try {
      const result = await client.$queryRaw`
        SELECT id, name, slug, description, "createdAt", "updatedAt"
        FROM "Category"
        WHERE id = ${id}
        LIMIT 1
      `;
      
      return Array.isArray(result) && result.length > 0 ? result[0] : null;
    } finally {
      await client.$disconnect();
    }
  }

  async createCategory(name: string, slug: string, description: string): Promise<any> {
    const client = this.createClient();
    try {
      const result = await client.$queryRaw`
        INSERT INTO "Category" (id, name, slug, description, "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), ${name}, ${slug}, ${description}, NOW(), NOW())
        RETURNING id, name, slug, description, "createdAt", "updatedAt"
      `;
      
      return Array.isArray(result) && result.length > 0 ? result[0] : null;
    } finally {
      await client.$disconnect();
    }
  }

  async updateCategory(id: string, name: string, slug: string, description: string): Promise<any> {
    const client = this.createClient();
    try {
      const result = await client.$queryRaw`
        UPDATE "Category"
        SET name = ${name}, slug = ${slug}, description = ${description}, "updatedAt" = NOW()
        WHERE id = ${id}
        RETURNING id, name, slug, description, "createdAt", "updatedAt"
      `;
      
      return Array.isArray(result) && result.length > 0 ? result[0] : null;
    } finally {
      await client.$disconnect();
    }
  }

  async deleteCategory(id: string): Promise<boolean> {
    const client = this.createClient();
    try {
      const result = await client.$queryRaw`
        DELETE FROM "Category"
        WHERE id = ${id}
      `;
      
      return true;
    } finally {
      await client.$disconnect();
    }
  }

  async getCategoryWithPhotos(id: string): Promise<any> {
    const client = this.createClient();
    try {
      const result = await client.$queryRaw`
        SELECT c.id, c.name, c.slug, c.description, c."createdAt", c."updatedAt",
               COUNT(cp."B") as photo_count
        FROM "Category" c
        LEFT JOIN "_CategoryToPhoto" cp ON c.id = cp."A"
        WHERE c.id = ${id}
        GROUP BY c.id, c.name, c.slug, c.description, c."createdAt", c."updatedAt"
        LIMIT 1
      `;
      
      return Array.isArray(result) && result.length > 0 ? result[0] : null;
    } finally {
      await client.$disconnect();
    }
  }
}

export const rawDB = new RawDBService(); 
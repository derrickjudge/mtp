export interface Photo {
  id: string;
  title: string;
  description?: string;
  url: string;
  thumbnail?: string;
  published?: boolean;
  featured?: boolean;
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
  authorId: string;
  categories?: Array<{
    id: string;
    name: string;
    slug: string;
    description?: string;
  }>;
  tags?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
} 
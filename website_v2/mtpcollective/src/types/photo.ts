export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface Photo {
  id: string;
  title: string;
  description?: string;
  url: string;
  thumbnail?: string;
  published: boolean;
  featured: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  categories: Category[];
  tags: Tag[];
} 
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'EDITOR' | 'ADMIN';
  createdAt: Date;
  updatedAt: Date;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  content: string;
  summary?: string;
  featuredImage?: string;
  published: boolean;
  authorId: string;
  categoryId: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
}

export interface Photo {
  id: string;
  title: string;
  description?: string;
  url: string;
  thumbnailUrl: string;
  authorId: string;
  categoryId: string;
  metadata?: Record<string, unknown>;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tag {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

import { User, Photo, Article } from '../../generated/prisma';
import { hash } from 'bcrypt';

// Mock data store
class InMemoryStore {
  users: Map<string, User> = new Map();
  photos: Map<string, Photo> = new Map();
  articles: Map<string, Article> = new Map();
}

export class MockDBService {
  private store: InMemoryStore = new InMemoryStore();
  
  async createUser(data: {
    email: string;
    name: string;
    password: string;
    role: 'USER' | 'ADMIN';
  }): Promise<User> {
    const id = `user_${Date.now()}`;
    const hashedPassword = await hash(data.password, 12);
    
    const now = new Date();
    const user: User = {
      id,
      email: data.email,
      name: data.name,
      password: hashedPassword,
      role: data.role,
      createdAt: now,
      updatedAt: now,
    };
    
    // Check for unique email
    const existingUser = Array.from(this.store.users.values())
      .find(u => u.email === data.email);
    if (existingUser) {
      throw new Error('Email already exists');
    }
    
    this.store.users.set(id, user);
    return user;
  }
  
  async createPhoto(data: {
    title: string;
    url: string;
    description?: string;
    authorId: string;
    published?: boolean;
    featured?: boolean;
  }): Promise<Photo> {
    const id = `photo_${Date.now()}`;
    
    // Verify author exists
    const author = this.store.users.get(data.authorId);
    if (!author) {
      throw new Error('Author not found');
    }
    
    const now = new Date();
    const photo: Photo = {
      id,
      title: data.title,
      url: data.url,
      description: data.description ?? null,
      authorId: data.authorId,
      published: data.published ?? false,
      featured: data.featured ?? false,
      thumbnail: null,
      metadata: null,
      createdAt: now,
      updatedAt: now,
    };
    
    this.store.photos.set(id, photo);
    return photo;
  }
  
  async createArticle(data: {
    title: string;
    slug: string;
    content: string;
    authorId: string;
    published?: boolean;
    featured?: boolean;
    excerpt?: string;
    coverImage?: string;
  }): Promise<Article> {
    const id = `article_${Date.now()}`;
    
    // Verify author exists
    const author = this.store.users.get(data.authorId);
    if (!author) {
      throw new Error('Author not found');
    }
    
    // Check for unique slug
    const existingArticle = Array.from(this.store.articles.values())
      .find(a => a.slug === data.slug);
    if (existingArticle) {
      throw new Error('Slug already exists');
    }
    
    const now = new Date();
    const article: Article = {
      id,
      title: data.title,
      slug: data.slug,
      content: data.content,
      authorId: data.authorId,
      published: data.published ?? false,
      featured: data.featured ?? false,
      excerpt: data.excerpt ?? null,
      coverImage: data.coverImage ?? null,
      createdAt: now,
      updatedAt: now,
    };
    
    this.store.articles.set(id, article);
    return article;
  }
  
  // Helper methods for tests
  async reset(): Promise<void> {
    this.store = new InMemoryStore();
  }
  
  async findUserByEmail(email: string): Promise<User | null> {
    return Array.from(this.store.users.values())
      .find(u => u.email === email) ?? null;
  }
  
  async findPublishedPhotos(): Promise<Photo[]> {
    return Array.from(this.store.photos.values())
      .filter(p => p.published);
  }
  
  async findFeaturedPhotos(): Promise<Photo[]> {
    return Array.from(this.store.photos.values())
      .filter(p => p.featured);
  }
  
  async findPublishedArticles(): Promise<Article[]> {
    return Array.from(this.store.articles.values())
      .filter(a => a.published);
  }
  
  async findFeaturedArticles(): Promise<Article[]> {
    return Array.from(this.store.articles.values())
      .filter(a => a.featured);
  }
}

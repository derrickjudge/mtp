import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client/extension';
import { prisma } from './index';

// Type-safe database operations with error handling
export const db = {
  // User operations
  user: {
    create: async (data: Prisma.UserCreateInput) => {
      return prisma.user.create({ data });
    },
    findById: async (id: string) => {
      return prisma.user.findUnique({ where: { id } });
    },
    findByEmail: async (email: string) => {
      return prisma.user.findUnique({ where: { email } });
    },
  },
  
  // Photo operations
  photo: {
    create: async (data: Prisma.PhotoCreateInput) => {
      return prisma.photo.create({ data });
    },
    findById: async (id: string) => {
      return prisma.photo.findUnique({
        where: { id },
        include: {
          author: true,
          categories: true,
          tags: true,
        },
      });
    },
    findPublished: async (options?: {
      take?: number;
      skip?: number;
      orderBy?: Prisma.PhotoOrderByWithRelationInput;
    }) => {
      return prisma.photo.findMany({
        where: { published: true },
        include: {
          author: true,
          categories: true,
          tags: true,
        },
        ...options,
      });
    },
  },
  
  // Article operations
  article: {
    create: async (data: Prisma.ArticleCreateInput) => {
      return prisma.article.create({ data });
    },
    findBySlug: async (slug: string) => {
      return prisma.article.findUnique({
        where: { slug },
        include: {
          author: true,
          categories: true,
          tags: true,
        },
      });
    },
    findPublished: async (options?: {
      take?: number;
      skip?: number;
      orderBy?: Prisma.ArticleOrderByWithRelationInput;
    }) => {
      return prisma.article.findMany({
        where: { published: true },
        include: {
          author: true,
          categories: true,
          tags: true,
        },
        ...options,
      });
    },
  },
  
  // Category operations
  category: {
    findOrCreate: async (name: string, description?: string) => {
      const slug = name.toLowerCase().replace(/\s+/g, '-');
      return prisma.category.upsert({
        where: { slug },
        update: {},
        create: {
          name,
          slug,
          description,
        },
      });
    },
    findBySlug: async (slug: string) => {
      return prisma.category.findUnique({
        where: { slug },
        include: {
          photos: {
            where: { published: true },
          },
          articles: {
            where: { published: true },
          },
        },
      });
    },
  },
};

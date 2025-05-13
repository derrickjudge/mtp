import { hash } from 'bcrypt';
import { PrismaClient } from '../generated/prisma';

export async function createTestUser(prisma: PrismaClient, data: {
  email: string;
  name: string;
  password: string;
  role: 'ADMIN' | 'USER';
}) {
  const hashedPassword = await hash(data.password, 12);
  return prisma.user.create({
    data: {
      ...data,
      password: hashedPassword,
    },
  });
}

export async function createTestCategory(prisma: PrismaClient, data: {
  name: string;
  slug: string;
  description?: string;
}) {
  return prisma.category.create({
    data,
  });
}

export async function createTestTag(prisma: PrismaClient, data: {
  name: string;
  slug: string;
}) {
  return prisma.tag.create({
    data,
  });
}

export async function createTestPhoto(prisma: PrismaClient, data: {
  title: string;
  description?: string;
  url: string;
  thumbnail?: string;
  published?: boolean;
  featured?: boolean;
  authorId: string;
  categoryIds?: string[];
  tagIds?: string[];
  metadata?: {
    camera?: string;
    lens?: string;
    iso?: string;
    shutterSpeed?: string;
    aperture?: string;
  };
}) {
  const { categoryIds, tagIds, ...photoData } = data;
  
  return prisma.photo.create({
    data: {
      ...photoData,
      categories: categoryIds ? {
        connect: categoryIds.map(id => ({ id })),
      } : undefined,
      tags: tagIds ? {
        connect: tagIds.map(id => ({ id })),
      } : undefined,
    },
    include: {
      categories: true,
      tags: true,
    },
  });
}

export async function createTestArticle(prisma: PrismaClient, data: {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  published?: boolean;
  featured?: boolean;
  authorId: string;
  categoryIds?: string[];
  tagIds?: string[];
}) {
  const { categoryIds, tagIds, ...articleData } = data;
  
  return prisma.article.create({
    data: {
      ...articleData,
      categories: categoryIds ? {
        connect: categoryIds.map(id => ({ id })),
      } : undefined,
      tags: tagIds ? {
        connect: tagIds.map(id => ({ id })),
      } : undefined,
    },
    include: {
      categories: true,
      tags: true,
    },
  });
}

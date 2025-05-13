import { PrismaClient } from '../../../generated/prisma';
import { BaseRepository } from './base.repository';
import type { Prisma } from '@prisma/client';

export class PhotoRepository extends BaseRepository {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  async findById(id: string) {
    return this.executeQuery(
      () => this.prisma.photo.findUnique({
        where: { id },
        include: {
          author: true,
          categories: true,
          tags: true,
        },
      }),
      'Failed to find photo by ID'
    );
  }

  async findPublished(options?: {
    take?: number;
    skip?: number;
    orderBy?: { [key: string]: 'asc' | 'desc' };
  }) {
    return this.executeQuery(
      () => this.prisma.photo.findMany({
        where: { published: true },
        include: {
          author: true,
          categories: true,
          tags: true,
        },
        ...options,
      }),
      'Failed to find published photos'
    );
  }

  async create(data: {
    title: string;
    description?: string | null;
    url: string;
    thumbnail?: string | null;
    published?: boolean;
    featured?: boolean;
    metadata?: any;
    authorId: string;
    categories?: { connect: { id: string }[] };
    tags?: { connect: { id: string }[] };
  }) {
    return this.executeQuery(
      () => this.prisma.photo.create({
        data,
        include: {
          author: true,
          categories: true,
          tags: true,
        },
      }),
      'Failed to create photo'
    );
  }

  async update(id: string, data: {
    title?: string;
    description?: string | null;
    url?: string;
    thumbnail?: string | null;
    published?: boolean;
    featured?: boolean;
    metadata?: any;
    authorId?: string;
    categories?: { connect?: { id: string }[]; disconnect?: { id: string }[] };
    tags?: { connect?: { id: string }[]; disconnect?: { id: string }[] };
  }) {
    return this.executeQuery(
      () => this.prisma.photo.update({
        where: { id },
        data,
        include: {
          author: true,
          categories: true,
          tags: true,
        },
      }),
      'Failed to update photo'
    );
  }

  async delete(id: string) {
    return this.executeQuery(
      () => this.prisma.photo.delete({
        where: { id },
      }),
      'Failed to delete photo'
    );
  }
} 
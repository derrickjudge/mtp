import { PrismaClient } from '../../../generated/prisma';
import { PhotoRepository } from './photo.repository';
import { db } from '../index';

export class Repositories {
  private static instance: Repositories;
  private photoRepository: PhotoRepository;

  private constructor(prisma: PrismaClient) {
    this.photoRepository = new PhotoRepository(prisma);
  }

  public static getInstance(prisma: PrismaClient): Repositories {
    if (!Repositories.instance) {
      Repositories.instance = new Repositories(prisma);
    }
    return Repositories.instance;
  }

  public get photo() {
    return this.photoRepository;
  }
}

export const repositories = Repositories.getInstance(db.getClient());

export { PhotoRepository }; 
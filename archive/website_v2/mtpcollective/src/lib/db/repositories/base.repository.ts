import { PrismaClient } from '../../../generated/prisma';
import { DatabaseQueryError } from '../errors';

export abstract class BaseRepository {
  protected prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  protected async executeQuery<T>(
    operation: () => Promise<T>,
    errorMessage: string
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      throw new DatabaseQueryError(errorMessage, error);
    }
  }
} 
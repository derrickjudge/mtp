import { PrismaClient } from '../../generated/prisma';
import { DB_CONFIG } from './config';
import { 
  DatabaseError, 
  DatabaseConnectionError, 
  DatabaseTransactionError 
} from './errors';
import { PhotoRepository } from './repositories/photo.repository';

class DatabaseService {
  private static instance: DatabaseService;
  private prisma: PrismaClient;
  private isConnected: boolean = false;
  private connectionAttempts: number = 0;

  private constructor() {
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.POSTGRES_PRISMA_URL,
        },
      },
      log: ['error', 'warn'],
    });
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private async retryConnection(): Promise<void> {
    if (this.connectionAttempts >= DB_CONFIG.maxRetries) {
      throw new DatabaseConnectionError(
        `Failed to connect after ${DB_CONFIG.maxRetries} attempts`
      );
    }

    this.connectionAttempts++;
    await new Promise(resolve => 
      setTimeout(resolve, DB_CONFIG.retryDelay * this.connectionAttempts)
    );
    await this.connect();
  }

  public async connect(): Promise<void> {
    if (this.isConnected) return;

    try {
      await this.prisma.$connect();
      this.isConnected = true;
      this.connectionAttempts = 0;
    } catch (error) {
      await this.retryConnection();
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) return;

    try {
      await this.prisma.$disconnect();
      this.isConnected = false;
    } catch (error) {
      throw new DatabaseError(
        'Failed to disconnect from database',
        'DB_DISCONNECTION_ERROR',
        error
      );
    }
  }

  public async transaction<T>(
    fn: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>
  ): Promise<T> {
    try {
      return await this.prisma.$transaction(fn);
    } catch (error) {
      throw new DatabaseTransactionError(
        'Transaction failed',
        error
      );
    }
  }

  public getClient(): PrismaClient {
    return this.prisma;
  }

  public async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const db = DatabaseService.getInstance();

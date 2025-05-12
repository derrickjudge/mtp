import { PrismaClient } from '@prisma/client';
import { databaseConfig } from '@/config/database';

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient({
  log: ['error'],
  errorFormat: 'minimal',
});

// Configure connection pool
prisma.$use(async (params: any, next: any) => {
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();
  
  // Log slow queries in development
  if (process.env.NODE_ENV === 'development' && after - before > databaseConfig.queryTimeout) {
    console.warn(`Slow query detected (${after - before}ms):`, params);
  }
  
  return result;
});

// Add error handling middleware
prisma.$use(async (params: any, next: any) => {
  try {
    return await next(params);
  } catch (error: any) {
    // Log database errors
    console.error('Database error:', {
      operation: params.action,
      model: params.model,
      error: error.message,
    });
    
    throw error;
  }
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

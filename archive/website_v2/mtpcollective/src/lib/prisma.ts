import { PrismaClient } from '../generated/prisma';

let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // In development/test, use a direct connection
  const url = process.env.POSTGRES_PRISMA_URL;
  if (!url) {
    throw new Error('POSTGRES_PRISMA_URL is not set');
  }

  // Extract connection details from URL
  const matches = url.match(/postgres:\/\/(.*?):(.*?)@(.*?):(\d+)\/(.*)/);
  if (!matches) {
    throw new Error('Invalid database URL format');
  }

  const [, user, password, host, port, database] = matches;

  prisma = new PrismaClient({
    datasources: {
      db: {
        url: `postgresql://${user}:${password}@${host}:${port}/${database}?schema=public&connection_limit=1`,
      },
    },
  });
}

export { prisma };

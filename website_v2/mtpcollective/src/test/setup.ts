import { expect, afterEach, beforeEach, beforeAll, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PrismaClient } from '../generated/prisma';
import { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';

// Import mocks
import './mocks';

// Create a singleton PrismaClient instance for tests
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.POSTGRES_TEST_URL || process.env.POSTGRES_PRISMA_URL,
    },
  },
});

beforeAll(async () => {
  await prisma.$connect();

  // Reset the database before all tests
  await prisma.$transaction([
    prisma.photo.deleteMany(),
    prisma.article.deleteMany(),
    prisma.tag.deleteMany(),
    prisma.category.deleteMany(),
    prisma.user.deleteMany(),
  ]);
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clean up the database before each test
  try {
    await prisma.$transaction(async (tx) => {
      await tx.photo.deleteMany();
      await tx.article.deleteMany();
      await tx.tag.deleteMany();
      await tx.category.deleteMany();
      await tx.user.deleteMany();
    });
  } catch (error) {
    console.error('Error clearing database:', error);
    throw error;
  }
});

afterEach(() => {
  cleanup();
});

declare module 'vitest' {
  interface Assertion<T = any>
    extends TestingLibraryMatchers<typeof expect.stringContaining, T> {}
}

// Export prisma instance for tests
export { prisma };

vi.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: () => {},
      replace: () => {},
      prefetch: () => {},
    };
  },
  useSearchParams() {
    return {
      get: () => {},
    };
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

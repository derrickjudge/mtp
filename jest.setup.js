// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    };
  },
  usePathname() {
    return '';
  },
  useSearchParams() {
    return new URLSearchParams();
  },
}))

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img {...props} />
  },
}))

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key' 
process.env.R2_BUCKET_NAME = 'test-bucket'
process.env.R2_PUBLIC_URL = 'https://test-bucket.r2.dev'
process.env.R2_ENDPOINT = 'https://account-id.r2.cloudflarestorage.com'
process.env.R2_ACCESS_KEY_ID = 'test-access-key'
process.env.R2_SECRET_ACCESS_KEY = 'test-secret-key'
process.env.NEXTAUTH_SECRET = 'test-secret'

// Provide a default global fetch for tests that expect it
if (typeof global.fetch === 'undefined') {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });
}

// Mock nativeDB to avoid real DB access during tests
jest.mock('@/lib/db-native', () => ({
  nativeDB: {
    findPhotos: jest.fn().mockResolvedValue([]),
    findCategories: jest.fn().mockResolvedValue([]),
    findPhotoById: jest.fn().mockResolvedValue(null),
    createPhoto: jest.fn().mockResolvedValue({ id: '1' }),
    getPhotoWithRelations: jest.fn().mockResolvedValue(null),
  },
}));

// Polyfill TextEncoder/TextDecoder for libraries like 'pg'
const { TextEncoder, TextDecoder } = require('util');
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
}

// Mock sharp to avoid real image processing in tests
jest.mock('sharp', () => {
  const mockInstance = {
    metadata: jest.fn().mockResolvedValue({ width: 800, height: 600 }),
    resize: jest.fn().mockReturnValue({
      toBuffer: jest.fn().mockResolvedValue(Buffer.from('image-bytes')),
    }),
  };
  const sharpFn = jest.fn(() => mockInstance);
  return sharpFn;
});
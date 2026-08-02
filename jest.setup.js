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
process.env.RESEND_API_KEY = 'test-resend-key'

// Provide a default global fetch for tests that expect it
if (typeof global.fetch === 'undefined') {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });
}

// Mock nativeDB to avoid real DB access during tests
jest.mock('@/lib/db-native', () => ({
  nativeDB: {
    getSetting: jest.fn().mockResolvedValue(null),
    getSettingsByPrefix: jest.fn().mockResolvedValue([]),
    findPhotos: jest.fn().mockResolvedValue([]),
    findCategories: jest.fn().mockResolvedValue([]),
    findPhotoById: jest.fn().mockResolvedValue(null),
    createPhoto: jest.fn().mockResolvedValue({ id: '1' }),
    getPhotoWithRelations: jest.fn().mockResolvedValue(null),
    findArticles: jest.fn().mockResolvedValue([]),
    findArticlesWithCategories: jest.fn().mockResolvedValue([]),
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

// Polyfill Web API globals for Next.js API route testing
if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    constructor(url, options = {}) {
      this.url = url;
      this.method = options.method || 'GET';
      this.headers = new Headers(options.headers);
      this._body = options.body;
    }
    get body() { return this._body; }
  };
}
if (typeof global.Response === 'undefined') {
  global.Response = class Response {
    constructor(body, options = {}) {
      this._body = body;
      this.status = options.status || 200;
      this.headers = new Headers(options.headers);
    }
  };
}
if (typeof global.Headers === 'undefined') {
  global.Headers = class Headers {
    constructor(init = {}) {
      this._headers = {};
      if (init) {
        Object.entries(init).forEach(([key, value]) => {
          this._headers[key.toLowerCase()] = value;
        });
      }
    }
    get(key) { return this._headers[key.toLowerCase()] || null; }
    set(key, value) { this._headers[key.toLowerCase()] = value; }
    has(key) { return key.toLowerCase() in this._headers; }
  };
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
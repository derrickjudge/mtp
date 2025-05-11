import { expect, afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';

// Import mocks
import './mocks';

declare module 'vitest' {
  interface Assertion<T = any>
    extends TestingLibraryMatchers<typeof expect.stringContaining, T> {}
}

expect.extend(matchers);

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

module.exports = {
  // Use Babel for all JavaScript/TypeScript transformation
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { configFile: './babel.test.js' }],
  },
  // Special handling for ESM modules - these packages will be transformed by Babel
  transformIgnorePatterns: [
    '/node_modules/(?!(@next|next|react-image-lightbox|uuid|jsonwebtoken)/)',
  ],
  // Ensure test environment has appropriate conditions for ESM
  testEnvironment: 'jsdom',
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // Test environments
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],
  moduleNameMapper: {
    // Handle module aliases (if you're using them in tsconfig.json)
    '^@/(.*)$': '<rootDir>/src/$1',
    // Ensure our mocks are used for tests
    '^@/lib/rate-limiter$': '<rootDir>/src/__mocks__/lib/rate-limiter.js',
    '^@/lib/database$': '<rootDir>/src/__mocks__/lib/database.js',
    '^@/services/authService$': '<rootDir>/src/__mocks__/services/authService.js',
    // Handle CSS imports
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // Handle image imports
    '^.+\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
  // File extensions Jest handles
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  // Environments for different types of tests
  projects: [
    {
      displayName: 'ui',
      testEnvironment: 'jsdom',
      testMatch: ['**/__tests__/components/**/*.{js,jsx,ts,tsx}'],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    },
    {
      displayName: 'admin',
      testEnvironment: 'jsdom',
      testMatch: ['**/__tests__/app/admin/**/*.{js,jsx,ts,tsx}'],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    },
    {
      displayName: 'auth',
      testEnvironment: 'jsdom',
      testMatch: ['**/__tests__/auth/**/*.{js,jsx,ts,tsx}'],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    },
    {
      displayName: 'utils',
      testEnvironment: 'jsdom',
      testMatch: ['**/__tests__/utils/**/*.{js,jsx,ts,tsx}'],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    },
    {
      displayName: 'server',
      testEnvironment: 'node',
      testMatch: [
        '**/__tests__/lib/**/*.{js,jsx,ts,tsx}',
        '**/__tests__/models/**/*.{js,jsx,ts,tsx}',
        '**/__tests__/api/**/*.{js,jsx,ts,tsx}',
        '**/__tests__/middleware.test.{js,jsx,ts,tsx}',
        '**/__tests__/services/**/*.{js,jsx,ts,tsx}'
      ],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    },
  ],
  // Test environment options
  testEnvironmentOptions: {
    customExportConditions: [''],
  },
  // Clear mocks between tests
  clearMocks: true,
  // Collect coverage
  collectCoverage: false,
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/_*.{js,jsx,ts,tsx}',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
  ],
  coverageDirectory: 'coverage',
  // Handle Next.js specifics
  transformIgnorePatterns: [
    '/node_modules/(?!(@next|next)/)',
  ],
};

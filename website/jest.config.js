module.exports = {
  // Use Babel for all JavaScript/TypeScript transformation
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { configFile: './babel.test.js' }],
  },
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // Test environments
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],
  moduleNameMapper: {
    // Handle module aliases (if you're using them in tsconfig.json)
    '^@/(.*)$': '<rootDir>/src/$1',
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
      testMatch: ['**/__tests__/components/**/*.ts?(x)'],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    },
    {
      displayName: 'utils',
      testEnvironment: 'jsdom',
      testMatch: ['**/__tests__/utils/**/*.ts?(x)'],
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    },
    {
      displayName: 'server',
      testEnvironment: 'node',
      testMatch: [
        '**/__tests__/lib/**/*.ts?(x)',
        '**/__tests__/models/**/*.ts?(x)',
        '**/__tests__/api/**/*.ts?(x)'
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

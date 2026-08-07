const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/index.{js,jsx,ts,tsx}',
  ],
}

// Dependencies that publish ESM only and therefore must be transformed before
// Jest (which runs CommonJS here) can require them. sanitize-html reaches
// htmlparser2 v12 and its dom* helpers, none of which ship a CJS build.
const ESM_ONLY_DEPENDENCIES = [
  'sanitize-html',
  'htmlparser2',
  'domhandler',
  'domutils',
  'dom-serializer',
  'domelementtype',
  'entities',
]

// createJestConfig is exported this way to ensure that next/jest can load the
// Next.js config which is async. next/jest only ever appends to
// transformIgnorePatterns -- its own '/node_modules/' entry matches first and
// wins -- so the resolved config is unwrapped here to replace that entry
// outright. This is test-only; the Next build handles ESM dependencies itself.
module.exports = async () => {
  const config = await createJestConfig(customJestConfig)()
  config.transformIgnorePatterns = [
    `/node_modules/(?!(${ESM_ONLY_DEPENDENCIES.join('|')})/)`,
    '^.+\\.module\\.(css|sass|scss)$',
  ]
  return config
}

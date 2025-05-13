# Testing Documentation

## Current Setup
- Using Jest with React Testing Library
- Tests are located in `src/__tests__` directory
- Using Next.js Jest configuration

## Test Files
1. `src/__tests__/setup.test.tsx` - Basic test setup verification
2. `src/__tests__/lib/supabase.test.ts` - Supabase client tests

## Environment Setup
- Mock environment variables in `jest.setup.js`
- Supabase URL and Anon Key are mocked for testing

## Running Tests
```bash
npm test           # Run all tests
npm run test:watch # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

## Recent Changes
- Fixed Supabase test file location
- Added proper directory structure for tests
- Created Supabase client with environment variable checks
- Added mock environment variables for testing

## Next Steps
- Add more component tests
- Add integration tests
- Add end-to-end tests with Cypress 
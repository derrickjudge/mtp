// Import testing libraries
require('@testing-library/jest-dom');

// Simple mock declarations - no JSX that could cause parsing errors
jest.mock('next/image', () => ({
  __esModule: true,
  default: function MockImage(props) {
    return { type: 'img', props };
  }
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: function MockLink(props) {
    return { type: 'a', props };
  }
}));

// Polyfill for TextEncoder/TextDecoder that's missing in JSDOM
if (typeof TextEncoder === 'undefined') {
  const util = require('util');
  global.TextEncoder = util.TextEncoder;
  global.TextDecoder = util.TextDecoder;
}

// Setup environment-specific configurations
if (typeof window !== 'undefined') {
  // We're in a browser-like environment (jsdom)
  // Nothing specific to set up here yet
} else {
  // We're in a Node.js environment
  // Setup MongoDB for server tests
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongoose = require('mongoose');
    let mongoServer;

    // Before all tests, connect to an in-memory MongoDB instance
    beforeAll(async () => {
      mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      
      await mongoose.connect(mongoUri);
    });

    // After all tests, disconnect and close the in-memory MongoDB instance
    afterAll(async () => {
      await mongoose.disconnect();
      await mongoServer.stop();
    });

    // Clear database collections between tests
    afterEach(async () => {
      const collections = mongoose.connection.collections;
      
      for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
      }
    });
  } catch (error) {
    console.warn('MongoDB setup error:', error.message);
    // Continue without MongoDB setup - this allows non-DB tests to run
  }
}

/**
 * Mock Validation Schemas for Tests
 * 
 * Provides mock validation schemas for testing API endpoints
 */

// Auth schemas for testing authentication endpoints
const authSchemas = {
  login: {
    username: { type: 'string', required: true },
    password: { type: 'string', required: true }
  },
  register: {
    username: { type: 'string', required: true },
    email: { type: 'email', required: true },
    password: { type: 'string', required: true }
  },
  passwordReset: {
    email: { type: 'email', required: true }
  }
};

// User schemas for testing user management endpoints
const userSchemas = {
  createUser: {
    username: { type: 'string', required: true },
    email: { type: 'email', required: true },
    password: { type: 'string', required: true },
    role: { type: 'string', required: true }
  },
  updateUser: {
    username: { type: 'string' },
    email: { type: 'email' },
    role: { type: 'string' }
  }
};

// Photo schemas for testing photo management endpoints
const photoSchemas = {
  createPhoto: {
    title: { type: 'string', required: true },
    description: { type: 'string' },
    imageUrl: { type: 'string', required: true }
  },
  updatePhoto: {
    title: { type: 'string' },
    description: { type: 'string' },
    imageUrl: { type: 'string' }
  }
};

// Contact form schema
const contactSchema = {
  name: { type: 'string', required: true },
  email: { type: 'email', required: true },
  subject: { type: 'string', required: true },
  message: { type: 'string', required: true }
};

// Settings schema
const settingsSchema = {
  siteName: { type: 'string' },
  siteDescription: { type: 'string' },
  contactEmail: { type: 'email' },
  logoUrl: { type: 'string' }
};

module.exports = {
  authSchemas,
  userSchemas,
  photoSchemas,
  contactSchema,
  settingsSchema
};

// Default export for modules using import syntax
module.exports.default = module.exports;

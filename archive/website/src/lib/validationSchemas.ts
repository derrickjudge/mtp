/**
 * API Validation Schemas
 * 
 * Centralized validation schemas for API endpoints.
 * This ensures consistent validation across all API routes.
 */

import { ValidationSchema } from './validation';

/**
 * Authentication validation schemas
 */
export const authSchemas = {
  // Login request validation
  login: {
    username: { 
      type: 'string', 
      required: true, 
      min: 3, 
      max: 50 
    },
    password: { 
      type: 'string', 
      required: true, 
      min: 6 
    }
  } as ValidationSchema,

  // Registration request validation
  register: {
    username: { 
      type: 'string', 
      required: true, 
      min: 3, 
      max: 50,
      pattern: /^[a-zA-Z0-9_]+$/
    },
    email: { 
      type: 'email', 
      required: true 
    },
    password: { 
      type: 'string', 
      required: true, 
      min: 8,
      validate: (value) => {
        // Password complexity validation
        const hasLetter = /[a-zA-Z]/.test(value);
        const hasNumber = /[0-9]/.test(value);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);
        
        if (!hasLetter) return 'Password must include at least one letter';
        if (!hasNumber) return 'Password must include at least one number';
        if (!hasSpecial) return 'Password must include at least one special character';
        
        return true;
      }
    },
    role: { 
      type: 'string', 
      enum: ['user', 'admin', 'editor']
    }
  } as ValidationSchema,

  // Password reset request validation
  passwordReset: {
    email: { 
      type: 'email', 
      required: true 
    }
  } as ValidationSchema,

  // Password update validation
  passwordUpdate: {
    token: { 
      type: 'string', 
      required: true 
    },
    password: { 
      type: 'string', 
      required: true, 
      min: 8,
      validate: (value) => {
        // Password complexity validation
        const hasLetter = /[a-zA-Z]/.test(value);
        const hasNumber = /[0-9]/.test(value);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);
        
        if (!hasLetter) return 'Password must include at least one letter';
        if (!hasNumber) return 'Password must include at least one number';
        if (!hasSpecial) return 'Password must include at least one special character';
        
        return true;
      }
    }
  } as ValidationSchema
};

/**
 * User management validation schemas
 */
export const userSchemas = {
  // Create user validation
  createUser: {
    username: { 
      type: 'string', 
      required: true, 
      min: 3, 
      max: 50,
      pattern: /^[a-zA-Z0-9_]+$/
    },
    email: { 
      type: 'email', 
      required: true 
    },
    password: { 
      type: 'string', 
      required: true, 
      min: 8 
    },
    role: { 
      type: 'string', 
      enum: ['user', 'admin', 'editor'],
      required: true
    }
  } as ValidationSchema,

  // Update user validation
  updateUser: {
    username: { 
      type: 'string', 
      min: 3, 
      max: 50,
      pattern: /^[a-zA-Z0-9_]+$/
    },
    email: { 
      type: 'email'
    },
    role: { 
      type: 'string', 
      enum: ['user', 'admin', 'editor']
    },
    active: {
      type: 'boolean'
    }
  } as ValidationSchema
};

/**
 * Photo management validation schemas
 */
export const photoSchemas = {
  // Create photo validation
  createPhoto: {
    title: { 
      type: 'string', 
      required: true, 
      min: 3, 
      max: 100 
    },
    description: { 
      type: 'string', 
      max: 500 
    },
    imageUrl: { 
      type: 'string', 
      required: true 
    },
    categoryId: { 
      type: 'number' 
    },
    tags: { 
      type: 'array' 
    },
    metadata: { 
      type: 'object' 
    }
  } as ValidationSchema,

  // Update photo validation
  updatePhoto: {
    title: { 
      type: 'string', 
      min: 3, 
      max: 100 
    },
    description: { 
      type: 'string', 
      max: 500 
    },
    imageUrl: { 
      type: 'string'
    },
    categoryId: { 
      type: 'number' 
    },
    tags: { 
      type: 'array' 
    },
    metadata: { 
      type: 'object' 
    },
    featured: {
      type: 'boolean'
    }
  } as ValidationSchema
};

/**
 * Contact form validation schema
 */
export const contactSchema = {
  name: { 
    type: 'string', 
    required: true, 
    min: 2, 
    max: 100 
  },
  email: { 
    type: 'email', 
    required: true 
  },
  subject: { 
    type: 'string', 
    required: true, 
    min: 3, 
    max: 200 
  },
  message: { 
    type: 'string', 
    required: true, 
    min: 10, 
    max: 5000 
  }
} as ValidationSchema;

/**
 * Settings validation schema
 */
export const settingsSchema = {
  siteName: { 
    type: 'string', 
    max: 100 
  },
  siteDescription: { 
    type: 'string', 
    max: 500 
  },
  contactEmail: { 
    type: 'email'
  },
  logoUrl: { 
    type: 'string', 
    max: 255 
  },
  primaryColor: { 
    type: 'string', 
    max: 20,
    pattern: /^#[0-9A-Fa-f]{6}$/
  },
  secondaryColor: { 
    type: 'string', 
    max: 20,
    pattern: /^#[0-9A-Fa-f]{6}$/
  },
  socialMedia: { 
    type: 'object' 
  },
  metaTags: { 
    type: 'object' 
  }
} as ValidationSchema;

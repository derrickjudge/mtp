/**
 * API Request Validation Utilities
 * 
 * Provides standardized validation for API requests to ensure
 * all data is properly validated before processing.
 */

import { NextRequest, NextResponse } from 'next/server';

// Basic type definitions for schema validation
export type ValidationSchema = {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'email';
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: RegExp;
    enum?: any[];
    validate?: (value: any) => boolean | string;
  }
};

export type ValidationError = {
  field: string;
  message: string;
};

/**
 * Validates request data against a defined schema
 * @param data The request data to validate
 * @param schema Validation schema defining the expected structure and rules
 * @returns Object containing validation results
 */
export function validateData(
  data: any, 
  schema: ValidationSchema
): { valid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  // Check each field defined in the schema
  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];

    // Check required fields
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push({
        field,
        message: `${field} is required`,
      });
      continue; // Skip further validation for this field
    }

    // Skip validation for undefined optional fields
    if (value === undefined || value === null) {
      continue;
    }

    // Type validation
    switch (rules.type) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push({
            field,
            message: `${field} must be a string`,
          });
        } else {
          // String-specific validations
          if (rules.min !== undefined && value.length < rules.min) {
            errors.push({
              field,
              message: `${field} must be at least ${rules.min} characters`,
            });
          }
          
          if (rules.max !== undefined && value.length > rules.max) {
            errors.push({
              field,
              message: `${field} must be no more than ${rules.max} characters`,
            });
          }
          
          if (rules.pattern && !rules.pattern.test(value)) {
            errors.push({
              field,
              message: `${field} has an invalid format`,
            });
          }
        }
        break;

      case 'email':
        if (typeof value !== 'string') {
          errors.push({
            field,
            message: `${field} must be a string`,
          });
        } else {
          // Email specific validation using a common email regex
          const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
          if (!emailRegex.test(value)) {
            errors.push({
              field,
              message: `${field} must be a valid email address`,
            });
          }
        }
        break;

      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          errors.push({
            field,
            message: `${field} must be a number`,
          });
        } else {
          // Number-specific validations
          if (rules.min !== undefined && value < rules.min) {
            errors.push({
              field,
              message: `${field} must be at least ${rules.min}`,
            });
          }
          
          if (rules.max !== undefined && value > rules.max) {
            errors.push({
              field,
              message: `${field} must be no more than ${rules.max}`,
            });
          }
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push({
            field,
            message: `${field} must be a boolean`,
          });
        }
        break;

      case 'array':
        if (!Array.isArray(value)) {
          errors.push({
            field,
            message: `${field} must be an array`,
          });
        } else {
          // Array-specific validations
          if (rules.min !== undefined && value.length < rules.min) {
            errors.push({
              field,
              message: `${field} must contain at least ${rules.min} items`,
            });
          }
          
          if (rules.max !== undefined && value.length > rules.max) {
            errors.push({
              field,
              message: `${field} must contain no more than ${rules.max} items`,
            });
          }
        }
        break;

      case 'object':
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          errors.push({
            field,
            message: `${field} must be an object`,
          });
        }
        break;
    }

    // Custom validation function
    if (rules.validate && typeof rules.validate === 'function') {
      const customValidation = rules.validate(value);
      if (customValidation !== true && typeof customValidation === 'string') {
        errors.push({
          field,
          message: customValidation,
        });
      } else if (customValidation !== true) {
        errors.push({
          field,
          message: `${field} failed validation`,
        });
      }
    }

    // Enum validation
    if (rules.enum && !rules.enum.includes(value)) {
      errors.push({
        field,
        message: `${field} must be one of: ${rules.enum.join(', ')}`,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitizes user input to prevent XSS and injection attacks
 * @param input String to sanitize
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  // Basic sanitization to prevent common script injections
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Creates a validation middleware for Next.js API routes
 * @param schema Validation schema to apply
 * @returns Validation result or null if valid
 */
export function validateRequest(
  req: NextRequest,
  schema: ValidationSchema
): ValidationError[] | null {
  let data: any;
  
  try {
    // Parse request body
    data = req.body ? req.body : {};
  } catch (error) {
    return [{
      field: 'body',
      message: 'Invalid request body format'
    }];
  }

  const validationResult = validateData(data, schema);
  
  if (!validationResult.valid) {
    return validationResult.errors;
  }
  
  return null;
}

/**
 * Creates a standardized error response for validation errors
 * @param errors Validation errors to include in response
 * @returns Formatted NextResponse with validation errors
 */
export function validationErrorResponse(errors: ValidationError[]): NextResponse {
  return NextResponse.json(
    {
      success: false,
      message: 'Validation failed',
      errors
    },
    { status: 400 }
  );
}

/**
 * Sanitizes an object's string properties recursively
 * @param obj Object to sanitize
 * @returns Sanitized object
 */
export function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'string') {
    return sanitizeInput(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
}

/**
 * API Request Validation Middleware
 * 
 * Provides reusable validation middleware for Next.js API routes
 * to ensure consistent validation and error handling.
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateRequest, validationErrorResponse, ValidationSchema } from '@/lib/validation';

/**
 * Creates a validation middleware for API routes
 * @param schema Validation schema to apply to request body
 * @returns A middleware function that validates requests against the schema
 */
export function createValidationMiddleware(schema: ValidationSchema) {
  return function validationMiddleware(req: NextRequest) {
    // Skip validation for non-mutation requests
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method || '')) {
      return null;
    }
    
    // Validate request body against schema
    const errors = validateRequest(req, schema);
    
    // If validation fails, return error response
    if (errors) {
      return validationErrorResponse(errors);
    }
    
    // If validation passes, continue processing
    return null;
  };
}

/**
 * Creates a comprehensive middleware chain for API routes
 * Applies multiple middleware functions in sequence
 * @param middlewares Array of middleware functions to apply
 * @returns A middleware function that applies all middleware in sequence
 */
export function createMiddlewareChain(middlewares: Array<(req: NextRequest) => NextResponse | null>) {
  return function middlewareChain(req: NextRequest): NextResponse | null {
    // Apply each middleware in sequence
    for (const middleware of middlewares) {
      const result = middleware(req);
      
      // If any middleware returns a response, return it immediately
      if (result) {
        return result;
      }
    }
    
    // If all middleware pass, continue processing
    return null;
  };
}

/**
 * Example usage:
 * 
 * // Define validation schema
 * const createUserSchema = {
 *   username: { type: 'string', required: true, min: 3, max: 20 },
 *   email: { type: 'email', required: true },
 *   password: { type: 'string', required: true, min: 8 }
 * };
 * 
 * // Create validation middleware
 * const validateCreateUser = createValidationMiddleware(createUserSchema);
 * 
 * // Use in route handler
 * export async function POST(req: NextRequest) {
 *   // Apply validation
 *   const validationError = validateCreateUser(req);
 *   if (validationError) return validationError;
 *   
 *   // Continue with request handling
 *   // ...
 * }
 * 
 * // Or use with middleware chain
 * const middleware = createMiddlewareChain([
 *   validateCreateUser,
 *   requireAuth,
 *   rateLimit({ maxRequests: 10, windowMs: 60 * 1000 })
 * ]);
 */

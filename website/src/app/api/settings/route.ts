/**
 * Settings API Endpoint
 * Handles site settings retrieval and updates with enhanced security
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRateLimit } from '@/lib/enhancedRateLimit';
import { applySecurityHeaders } from '@/middleware/securityHeaders';
import { validateRequest, validationErrorResponse, sanitizeObject } from '@/lib/validation';
import { settingsSchema } from '@/lib/validationSchemas';
import { requireRole } from '@/lib/secureAuth';

// Import mock settings service
import { getSettings, updateSettings, SiteSettings } from '@/services/mockSettingsService';

// Create a rate limiter
// Use stricter limits for settings since they affect the entire site
const settingsRateLimit = createRateLimit('STRICT');

/**
 * Helper function for consistent error responses with security headers
 */
function createErrorResponse(message: string, status: number = 400) {
  const response = NextResponse.json(
    { success: false, message },
    { status }
  );
  return applySecurityHeaders(response);
}

/**
 * Helper function for successful responses with security headers
 */
function createSuccessResponse(data: any, message?: string, status: number = 200) {
  const responseBody: any = { success: true };
  if (message) responseBody.message = message;
  if (data) responseBody.data = data;
  
  const response = NextResponse.json(responseBody, { status });
  return applySecurityHeaders(response);
}

// Default settings to use when database is unavailable
const defaultSettings = {
  siteName: 'MTP Collective',
  siteDescription: 'Photography portfolio website',
  contactEmail: '',
  logoUrl: '',
  primaryColor: '#000000',
  secondaryColor: '#ffffff',
  socialMedia: {
    instagram: '',
    twitter: '',
    facebook: ''
  },
  metaTags: {
    title: 'MTP Collective',
    description: 'Photography portfolio website',
    keywords: 'photography, portfolio, art'
  }
};

/**
 * GET /api/settings
 * Get site settings
 */
export async function GET(req: NextRequest) {
  try {
    // Apply rate limiting with enhanced rate limiter
    const rateLimitResult = await settingsRateLimit.check(req);
    if (!rateLimitResult.success) {
      return createErrorResponse(
        `Rate limit exceeded. Please try again in ${Math.ceil((rateLimitResult.reset - Date.now()) / 1000)} seconds.`,
        429
      );
    }

    console.log('[API] GET /api/settings - Fetching settings');
    
    try {
      // Use our mock settings service
      const result = await getSettings();
      
      if (!result.success || !result.data) {
        console.error('Error fetching settings from mock service');
        // Return default settings as fallback
        return createSuccessResponse(defaultSettings);
      }
      
      // Return the settings data
      return createSuccessResponse(result.data);
    } catch (error) {
      console.error('Error in settings service:', error);
      // Return default settings as fallback
      return createSuccessResponse(defaultSettings);
    }
  } catch (err) {
    console.error('Error fetching settings:', err);
    return createErrorResponse('Server error occurred while fetching settings', 500);
  }
}

/**
 * PUT /api/settings
 * Update site settings
 */
export async function PUT(req: NextRequest) {
  try {
    // Check rate limits first
    const rateLimitResult = await settingsRateLimit.check(req);
    if (!rateLimitResult.success) {
      return createErrorResponse(
        `Rate limit exceeded. Please try again in ${Math.ceil((rateLimitResult.reset - Date.now()) / 1000)} seconds.`,
        429
      );
    }

    // Verify admin privileges
    const requireAdminCheck = await requireRole(req, 'admin');
    if (requireAdminCheck.success === false) {
      return createErrorResponse(
        requireAdminCheck.message || 'Admin privileges required',
        403
      );
    }

    console.log('[API] PUT /api/settings - Updating settings');
    
    // Parse and validate request body
    let settings;
    try {
      settings = await req.json();
    } catch (error) {
      return createErrorResponse('Invalid JSON format', 400);
    }
    
    // Validate settings against schema
    const validationResult = validateRequest(settings, settingsSchema);
    if (!validationResult.success) {
      return validationErrorResponse(validationResult.errors);
    }
    
    // Sanitize settings to prevent XSS
    settings = sanitizeObject(settings);
    
    try {
      // Use our mock settings service to update settings
      const result = await updateSettings(settings as SiteSettings);
      
      if (!result.success) {
        return createErrorResponse('Failed to update settings', 500);
      }
      
      return createSuccessResponse(result.data, 'Settings updated successfully');
    } catch (error) {
      console.error('Error updating settings:', error);
      return createErrorResponse('Server error occurred while updating settings', 500);
    }
  } catch (err) {
    console.error('Error updating settings:', err);
    return createErrorResponse('Server error occurred while updating settings', 500);
  }
}

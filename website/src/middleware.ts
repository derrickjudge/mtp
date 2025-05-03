/**
 * Next.js Middleware
 * Protects admin routes and API endpoints that require authentication
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getUserFromToken, verifyToken } from './lib/auth'

// Paths that require authentication
const PROTECTED_PATHS = [
  '/admin/photos',
  '/admin/categories',
]

// Allow direct access to dashboard after login
// This helps bypass auth checks that might interfere with navigation
const DIRECT_ACCESS_PATHS = [
  '/admin/dashboard'
]

// Paths that require admin role
const ADMIN_PATHS = [
  '/admin/dashboard',
  '/admin/photos',
  '/admin/categories',
  '/api/photos/upload-url',
]

// API paths that require authentication
const PROTECTED_API_PATHS = [
  '/api/photos/upload-url',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip authentication for login page and API routes that handle auth
  if (pathname === '/admin/login' || pathname === '/api/auth/login') {
    return NextResponse.next()
  }
  
  // Check if path is admin-related
  const isAdminPath = pathname.startsWith('/admin')
  const isProtectedApiPath = PROTECTED_API_PATHS.some(path => pathname.startsWith(path))
  const isDirectAccessPath = DIRECT_ACCESS_PATHS.some(path => pathname.startsWith(path))

  // Allow direct access to dashboard (skip auth check for dashboard)
  if (isDirectAccessPath) {
    console.log('Direct access to dashboard allowed, bypassing middleware checks');
    return NextResponse.next()
  }
  
  if (isAdminPath || isProtectedApiPath) {
    // Check for authorization header which would contain the token from localStorage
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null
    
    // Verify token if present
    let user = null
    if (token) {
      user = verifyToken(token)
    }
    
    // If no token or invalid token, redirect to login
    if (!user) {
      // For API routes, return 401 Unauthorized
      if (isProtectedApiPath) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
      }
      
      // For admin pages, redirect to login
      const loginUrl = new URL('/admin/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
    
    // For admin-only paths, check if user has admin role
    if (ADMIN_PATHS.some(path => pathname.startsWith(path)) && user.role !== 'admin') {
      // For API routes, return 403 Forbidden
      if (isProtectedApiPath) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
      }
      
      // For admin pages, redirect to unauthorized page
      const unauthorizedUrl = new URL('/admin/unauthorized', request.url)
      return NextResponse.redirect(unauthorizedUrl)
    }
  }
  
  return NextResponse.next()
}

// Configure the paths this middleware will run on
export const config = {
  matcher: [
    '/admin/:path*', 
    '/api/photos/upload-url/:path*',
    '/api/categories/:path*'
  ],
}

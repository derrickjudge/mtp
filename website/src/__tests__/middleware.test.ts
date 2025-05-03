import { NextRequest, NextResponse } from 'next/server';
import { middleware } from '../middleware';
import { getUserFromToken, verifyToken } from '../lib/auth';

// Mock Next.js response and request utilities
jest.mock('next/server', () => {
  const originalModule = jest.requireActual('next/server');
  return {
    ...originalModule,
    NextResponse: {
      next: jest.fn(() => 'next-response'),
      redirect: jest.fn((url) => ({ redirectUrl: url })),
      json: jest.fn((data, options) => ({ data, options })),
    },
  };
});

// Mock auth functions
jest.mock('../lib/auth', () => ({
  getUserFromToken: jest.fn(),
  verifyToken: jest.fn(),
}));

describe('Authentication Middleware Tests', () => {
  let mockRequest: Partial<NextRequest>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a mock request
    mockRequest = {
      nextUrl: {
        pathname: '/admin/dashboard',
        search: '',
        clone: jest.fn().mockReturnThis(),
      },
      url: 'http://localhost:3000/admin/dashboard',
      cookies: {
        get: jest.fn(),
      },
      headers: {
        get: jest.fn(),
      },
    } as Partial<NextRequest>;
  });
  
  it('should bypass middleware for login page', () => {
    // Set the mock request to the login page
    mockRequest.nextUrl!.pathname = '/admin/login';
    
    middleware(mockRequest as NextRequest);
    
    // Verify that NextResponse.next() was called (not redirected)
    expect(NextResponse.next).toHaveBeenCalled();
    expect(NextResponse.redirect).not.toHaveBeenCalled();
  });
  
  it('should bypass middleware for dashboard page', () => {
    // Set the mock request to the dashboard page
    mockRequest.nextUrl!.pathname = '/admin/dashboard';
    
    middleware(mockRequest as NextRequest);
    
    // Verify that NextResponse.next() was called (not redirected)
    expect(NextResponse.next).toHaveBeenCalled();
    expect(NextResponse.redirect).not.toHaveBeenCalled();
  });
  
  it('should redirect to login page if no token for protected path', () => {
    // Set the mock request to a protected path
    mockRequest.nextUrl!.pathname = '/admin/photos';
    
    // Mock the headers to return no auth header
    (mockRequest.headers!.get as jest.Mock).mockReturnValue(null);
    
    middleware(mockRequest as NextRequest);
    
    // Verify that NextResponse.redirect() was called with login URL
    expect(NextResponse.redirect).toHaveBeenCalled();
    const redirectCall = (NextResponse.redirect as jest.Mock).mock.calls[0][0];
    expect(redirectCall.pathname).toBe('/admin/login');
  });
  
  it('should allow access if valid token for protected path', () => {
    // Set the mock request to a protected path
    mockRequest.nextUrl!.pathname = '/admin/photos';
    
    // Mock the headers to return a valid auth header
    (mockRequest.headers!.get as jest.Mock).mockReturnValue('Bearer valid-token');
    
    // Mock the verifyToken function to return a valid user
    (verifyToken as jest.Mock).mockReturnValue({
      userId: 1,
      username: 'admin',
      role: 'admin'
    });
    
    middleware(mockRequest as NextRequest);
    
    // Verify that NextResponse.next() was called (not redirected)
    expect(NextResponse.next).toHaveBeenCalled();
    expect(NextResponse.redirect).not.toHaveBeenCalled();
  });
  
  it('should redirect to unauthorized page if user role is not admin', () => {
    // Set the mock request to a admin-only path
    mockRequest.nextUrl!.pathname = '/admin/photos';
    
    // Mock the headers to return a valid auth header
    (mockRequest.headers!.get as jest.Mock).mockReturnValue('Bearer valid-token');
    
    // Mock the verifyToken function to return a non-admin user
    (verifyToken as jest.Mock).mockReturnValue({
      userId: 2,
      username: 'user',
      role: 'user'
    });
    
    middleware(mockRequest as NextRequest);
    
    // Verify that NextResponse.redirect() was called with unauthorized URL
    expect(NextResponse.redirect).toHaveBeenCalled();
    const redirectCall = (NextResponse.redirect as jest.Mock).mock.calls[0][0];
    expect(redirectCall.pathname).toBe('/admin/unauthorized');
  });
  
  it('should return 401 Unauthorized for protected API paths with no token', () => {
    // Set the mock request to a protected API path
    mockRequest.nextUrl!.pathname = '/api/photos/upload-url';
    
    // Mock the headers to return no auth header
    (mockRequest.headers!.get as jest.Mock).mockReturnValue(null);
    
    middleware(mockRequest as NextRequest);
    
    // Verify that NextResponse.json() was called with 401 status
    expect(NextResponse.json).toHaveBeenCalled();
    const jsonCall = (NextResponse.json as jest.Mock).mock.calls[0];
    expect(jsonCall[0]).toEqual({ message: 'Unauthorized' });
    expect(jsonCall[1]).toEqual({ status: 401 });
  });
  
  it('should return 403 Forbidden for admin API paths with non-admin token', () => {
    // Set the mock request to a protected API path
    mockRequest.nextUrl!.pathname = '/api/photos/upload-url';
    
    // Mock the headers to return a valid auth header
    (mockRequest.headers!.get as jest.Mock).mockReturnValue('Bearer valid-token');
    
    // Mock the verifyToken function to return a non-admin user
    (verifyToken as jest.Mock).mockReturnValue({
      userId: 2,
      username: 'user',
      role: 'user'
    });
    
    middleware(mockRequest as NextRequest);
    
    // Verify that NextResponse.json() was called with 403 status
    expect(NextResponse.json).toHaveBeenCalled();
    const jsonCall = (NextResponse.json as jest.Mock).mock.calls[0];
    expect(jsonCall[0]).toEqual({ message: 'Forbidden' });
    expect(jsonCall[1]).toEqual({ status: 403 });
  });
});

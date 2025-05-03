const { NextResponse } = require('next/server');
const { middleware } = require('../middleware');
const auth = require('../lib/auth');

// Mock Next.js response and request utilities
jest.mock('next/server', () => {
  return {
    NextResponse: {
      next: jest.fn(() => 'next-response'),
      redirect: jest.fn((url) => ({ redirectUrl: url })),
      json: jest.fn((data, options) => ({ data, options })),
    },
  };
});

// Mock auth functions
jest.mock('../lib/auth', () => ({
  verifyToken: jest.fn(),
}));

describe('Authentication Middleware Tests', () => {
  let mockRequest;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a mock request
    mockRequest = {
      nextUrl: {
        pathname: '/admin/dashboard',
        search: '',
        clone: jest.fn().mockReturnThis(),
        origin: 'http://localhost:3000',
        href: 'http://localhost:3000/admin/dashboard',
        protocol: 'http:',
        username: '',
        password: '',
        host: 'localhost:3000',
        hostname: 'localhost',
        port: '3000',
        toString: jest.fn().mockReturnValue('http://localhost:3000/admin/dashboard'),
        // Implement additional methods required by Next.js
        searchParams: new URLSearchParams(),
        createURL: jest.fn(),
        basePath: '',
        buildId: '',
        locale: '',
        defaultLocale: '',
        hash: '',
      },
      url: 'http://localhost:3000/admin/dashboard',
      cookies: {
        get: jest.fn(),
        getAll: jest.fn(),
        has: jest.fn(),
        set: jest.fn(),
        delete: jest.fn(),
      },
      headers: {
        get: jest.fn(),
        has: jest.fn(),
        append: jest.fn(),
        delete: jest.fn(),
        entries: jest.fn(),
        forEach: jest.fn(),
        keys: jest.fn(),
        values: jest.fn(),
      },
    };
  });
  
  it('should bypass middleware for login page', () => {
    // Set the mock request to the login page
    mockRequest.nextUrl.pathname = '/admin/login';
    
    middleware(mockRequest);
    
    // Verify that NextResponse.next() was called (not redirected)
    expect(NextResponse.next).toHaveBeenCalled();
    expect(NextResponse.redirect).not.toHaveBeenCalled();
  });
  
  it('should bypass middleware for dashboard page', () => {
    // Set the mock request to the dashboard page
    mockRequest.nextUrl.pathname = '/admin/dashboard';
    
    middleware(mockRequest);
    
    // Verify that NextResponse.next() was called (not redirected)
    expect(NextResponse.next).toHaveBeenCalled();
    expect(NextResponse.redirect).not.toHaveBeenCalled();
  });
  
  it('should redirect to login page if no token for protected path', () => {
    // Set the mock request to a protected path
    mockRequest.nextUrl.pathname = '/admin/photos';
    
    // Mock the headers to return no auth header
    mockRequest.headers.get.mockReturnValue(null);
    
    middleware(mockRequest);
    
    // Verify that NextResponse.redirect() was called
    expect(NextResponse.redirect).toHaveBeenCalled();
  });
  
  it('should allow access if valid token for protected path', () => {
    // Set the mock request to a protected path
    mockRequest.nextUrl.pathname = '/admin/photos';
    
    // Mock the headers to return a valid auth header
    mockRequest.headers.get.mockReturnValue('Bearer valid-token');
    
    // Mock the verifyToken function to return a valid user
    auth.verifyToken.mockReturnValue({
      userId: 1,
      username: 'admin',
      role: 'admin'
    });
    
    middleware(mockRequest);
    
    // Verify that NextResponse.next() was called (not redirected)
    expect(NextResponse.next).toHaveBeenCalled();
    expect(NextResponse.redirect).not.toHaveBeenCalled();
  });
  
  it('should redirect to unauthorized page if user role is not admin', () => {
    // Set the mock request to a admin-only path
    mockRequest.nextUrl.pathname = '/admin/photos';
    
    // Mock the headers to return a valid auth header
    mockRequest.headers.get.mockReturnValue('Bearer valid-token');
    
    // Mock the verifyToken function to return a non-admin user
    auth.verifyToken.mockReturnValue({
      userId: 2,
      username: 'user',
      role: 'user'
    });
    
    middleware(mockRequest);
    
    // Verify that NextResponse.redirect() was called
    expect(NextResponse.redirect).toHaveBeenCalled();
  });
  
  it('should return 401 Unauthorized for protected API paths with no token', () => {
    // Set the mock request to a protected API path
    mockRequest.nextUrl.pathname = '/api/photos/upload-url';
    
    // Mock the headers to return no auth header
    mockRequest.headers.get.mockReturnValue(null);
    
    middleware(mockRequest);
    
    // Verify that NextResponse.json() was called with 401 status
    expect(NextResponse.json).toHaveBeenCalled();
    const jsonCall = NextResponse.json.mock.calls[0];
    expect(jsonCall[0]).toEqual({ message: 'Unauthorized' });
    expect(jsonCall[1]).toEqual({ status: 401 });
  });
});

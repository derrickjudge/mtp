/**
 * Server-side cookie utilities for authentication
 * Works with Next.js API routes and solves cookie setting issues
 */

import { cookies } from 'next/headers';

/**
 * Set a cookie safely in Next.js API routes
 */
export async function setServerCookie(
  name: string,
  value: string,
  options: {
    httpOnly?: boolean;
    secure?: boolean;
    maxAge?: number;
    path?: string;
    sameSite?: 'strict' | 'lax' | 'none';
  } = {}
): Promise<void> {
  try {
    // Make cookies() awaitable per Next.js requirements
    // This prevents the "Route used cookies().set() without awaiting" error
    const cookieStore = await cookies();
    cookieStore.set({
      name,
      value,
      httpOnly: options.httpOnly ?? true,
      secure: options.secure ?? process.env.NODE_ENV === 'production',
      maxAge: options.maxAge ?? 60 * 60 * 24, // Default 24 hours
      path: options.path ?? '/',
      sameSite: options.sameSite ?? 'strict',
    });
  } catch (error) {
    console.error('Error setting cookie:', error);
  }
}

/**
 * Delete a cookie safely in Next.js API routes
 */
export async function deleteServerCookie(name: string): Promise<void> {
  try {
    // Make cookies() awaitable per Next.js requirements
    const cookieStore = await cookies();
    cookieStore.delete(name);
  } catch (error) {
    console.error('Error deleting cookie:', error);
  }
}

/**
 * Get a cookie value safely from request
 */
export async function getServerCookie(name: string): Promise<string | undefined> {
  try {
    // Make cookies() awaitable per Next.js requirements
    const cookieStore = await cookies();
    return cookieStore.get(name)?.value;
  } catch (error) {
    console.error('Error getting cookie:', error);
    return undefined;
  }
}

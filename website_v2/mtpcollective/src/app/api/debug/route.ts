import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'API routes are working',
    nextauth_secret: process.env.NEXTAUTH_SECRET ? 'Set' : 'Missing',
    nextauth_url: process.env.NEXTAUTH_URL ? 'Set' : 'Missing',
    node_env: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
} 
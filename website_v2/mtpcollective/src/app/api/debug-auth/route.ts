import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('🔍 Debug Auth - Starting...');
    
    // Test 1: Check environment variables
    const envCheck = {
      NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      POSTGRES_PRISMA_URL: !!process.env.POSTGRES_PRISMA_URL,
      DATABASE_URL: !!process.env.DATABASE_URL,
    };
    
    console.log('Environment variables:', envCheck);
    
    // Test 2: Check database connection
    let dbStatus = 'unknown';
    let userCount = 0;
    let adminUser = null;
    
    try {
      await prisma.$connect();
      dbStatus = 'connected';
      userCount = await prisma.user.count();
      adminUser = await prisma.user.findUnique({
        where: { email: 'admin@mtpcollective.com' },
        select: { id: true, email: true, role: true }
      });
    } catch (error) {
      dbStatus = `error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
    
    // Test 3: Check session
    let sessionStatus = 'unknown';
    let session = null;
    
    try {
      session = await getServerSession(authOptions);
      sessionStatus = session ? 'active' : 'none';
    } catch (error) {
      sessionStatus = `error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      env: envCheck,
      database: {
        status: dbStatus,
        userCount,
        adminUser
      },
      session: {
        status: sessionStatus,
        user: session?.user || null
      }
    });
    
  } catch (error) {
    console.error('Debug Auth Error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 
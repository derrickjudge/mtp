import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { nativeDB } from '@/lib/db-native';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

// GET /api/settings - Get all settings or filter by prefix
export async function GET(req: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(req);
    const rl = rateLimit(`settings:GET:${ip}`, { tokens: 100, windowMs: 60_000 });
    if (!rl.allowed) {
      return new NextResponse('Too Many Requests', { 
        status: 429, 
        headers: { 'Retry-After': String(rl.retryAfter) } 
      });
    }

    const { searchParams } = new URL(req.url);
    const prefix = searchParams.get('prefix');
    const key = searchParams.get('key');

    // If specific key requested
    if (key) {
      const setting = await nativeDB.getSetting(key);
      if (!setting) {
        return NextResponse.json({ error: 'Setting not found' }, { status: 404 });
      }
      return NextResponse.json(setting);
    }

    // If prefix filter requested
    if (prefix) {
      const settings = await nativeDB.getSettingsByPrefix(prefix);
      return NextResponse.json(settings);
    }

    // Return all settings
    const settings = await nativeDB.getAllSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PUT /api/settings - Create or update a setting (admin only)
export async function PUT(req: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(req);
    const rl = rateLimit(`settings:PUT:${ip}`, { tokens: 30, windowMs: 60_000 });
    if (!rl.allowed) {
      return new NextResponse('Too Many Requests', { 
        status: 429, 
        headers: { 'Retry-After': String(rl.retryAfter) } 
      });
    }

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { key, value, metadata } = await req.json();

    // Validate input
    if (!key || typeof key !== 'string') {
      return NextResponse.json(
        { error: 'Key is required and must be a string' },
        { status: 400 }
      );
    }

    if (value === undefined) {
      return NextResponse.json(
        { error: 'Value is required' },
        { status: 400 }
      );
    }

    const setting = await nativeDB.upsertSetting(key, value, metadata);
    return NextResponse.json(setting);
  } catch (error) {
    console.error('Error updating setting:', error);
    return NextResponse.json(
      { error: 'Failed to update setting' },
      { status: 500 }
    );
  }
}

// DELETE /api/settings - Delete a setting (admin only)
export async function DELETE(req: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(req);
    const rl = rateLimit(`settings:DELETE:${ip}`, { tokens: 20, windowMs: 60_000 });
    if (!rl.allowed) {
      return new NextResponse('Too Many Requests', { 
        status: 429, 
        headers: { 'Retry-After': String(rl.retryAfter) } 
      });
    }

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json(
        { error: 'Key is required' },
        { status: 400 }
      );
    }

    const deleted = await nativeDB.deleteSetting(key);
    if (!deleted) {
      return NextResponse.json({ error: 'Setting not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting setting:', error);
    return NextResponse.json(
      { error: 'Failed to delete setting' },
      { status: 500 }
    );
  }
}


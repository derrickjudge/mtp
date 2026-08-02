import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { nativeDB } from '@/lib/db-native';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

// Single-key settings that public (unauthenticated) pages legitimately need
// to read - e.g. the site logo, rendered in the nav for every visitor. Bulk
// reads (prefix or the full list) and every other key stay admin-only.
const PUBLIC_SETTING_KEYS = new Set(['site:logo']);

// Which public page each header:<name> setting controls. Used to revalidate
// on-demand after a write, so admin changes show up on the next request
// instead of waiting for a redeploy.
const HEADER_KEY_TO_PATH: Record<string, string> = {
  home: '/',
  about: '/about',
  portfolio: '/portfolio',
  events: '/events',
  articles: '/articles',
  contact: '/contact',
  services: '/services',
};

// Invalidate the cached page(s) affected by a settings write. The logo lives
// in the root layout and is shared by every page, so it revalidates the
// whole site; a header image only affects its one matching page.
function revalidateForSettingKey(key: string): void {
  if (key === 'site:logo') {
    revalidatePath('/', 'layout');
    return;
  }
  if (key.startsWith('header:')) {
    const path = HEADER_KEY_TO_PATH[key.slice('header:'.length)];
    if (path) {
      revalidatePath(path);
    }
  }
}

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

    const isPublicKeyRequest = !!key && PUBLIC_SETTING_KEYS.has(key);
    if (!isPublicKeyRequest) {
      const session = await getServerSession(authOptions);
      if (!session?.user || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

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
    revalidateForSettingKey(key);
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

    revalidateForSettingKey(key);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting setting:', error);
    return NextResponse.json(
      { error: 'Failed to delete setting' },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { nativeDB } from '@/lib/db-native';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { rateLimit, getClientIp } from '@/lib/rateLimit';
import { validateEmail, validatePassword, validateRole } from '@/lib/userValidation';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

const BCRYPT_COST = 12;

// GET /api/users - Get all users for admin interface
export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = rateLimit(`users:GET:${ip}`, { tokens: 100, windowMs: 60_000 });
    if (!rl.allowed) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: { 'Retry-After': String(rl.retryAfter) },
      });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const users = await nativeDB.findUsers();

    const usersForSelection = users.map(user => ({
      id: user.id,
      name: user.name || user.email,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    return NextResponse.json(usersForSelection);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { message: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST /api/users - Create a new user (admin only)
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = rateLimit(`users:POST:${ip}`, { tokens: 20, windowMs: 60_000 });
    if (!rl.allowed) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: { 'Retry-After': String(rl.retryAfter) },
      });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { email, password, name, role } = await req.json();

    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) {
      return NextResponse.json({ message: emailCheck.message }, { status: emailCheck.status });
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      return NextResponse.json({ message: passwordCheck.message }, { status: passwordCheck.status });
    }

    const roleCheck = validateRole(role);
    if (!roleCheck.valid) {
      return NextResponse.json({ message: roleCheck.message }, { status: roleCheck.status });
    }

    const trimmedEmail = email.trim();
    const existingUser = await nativeDB.findUserByEmail(trimmedEmail);
    if (existingUser) {
      return NextResponse.json(
        { message: 'A user with this email already exists' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_COST);

    const user = await nativeDB.createUser({
      email: trimmedEmail,
      password: hashedPassword,
      name,
      role: role || 'USER',
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { message: 'Failed to create user' },
      { status: 500 }
    );
  }
}

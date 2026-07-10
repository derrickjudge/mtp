import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { nativeDB } from '@/lib/db-native';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { rateLimit, getClientIp } from '@/lib/rateLimit';
import { validateEmail, validatePassword, validateRole } from '@/lib/userValidation';

const BCRYPT_COST = 12;

// PUT /api/users/[id] - Update a user (admin only)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ip = getClientIp(req);
    const rl = rateLimit(`users:PUT:${ip}`, { tokens: 30, windowMs: 60_000 });
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

    const { id } = params;
    const { email, password, name, role } = await req.json();

    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) {
      return NextResponse.json({ message: emailCheck.message }, { status: emailCheck.status });
    }

    const roleCheck = validateRole(role);
    if (!roleCheck.valid) {
      return NextResponse.json({ message: roleCheck.message }, { status: roleCheck.status });
    }

    if (password !== undefined) {
      const passwordCheck = validatePassword(password);
      if (!passwordCheck.valid) {
        return NextResponse.json({ message: passwordCheck.message }, { status: passwordCheck.status });
      }
    }

    const existingUser = await nativeDB.findUserById(id);
    if (!existingUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Prevent an admin from locking themselves out by removing their own role
    if (id === session.user.id && existingUser.role === 'ADMIN' && role && role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'You cannot remove your own admin role' },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim();
    const emailConflict = await nativeDB.findUserByEmail(trimmedEmail);
    if (emailConflict && emailConflict.id !== id) {
      return NextResponse.json(
        { message: 'A user with this email already exists' },
        { status: 409 }
      );
    }

    const hashedPassword = password ? await bcrypt.hash(password, BCRYPT_COST) : undefined;

    const user = await nativeDB.updateUser(id, {
      email: trimmedEmail,
      name,
      role: role || existingUser.role,
      password: hashedPassword,
    });

    if (!user) {
      return NextResponse.json({ message: 'Failed to update user' }, { status: 500 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { message: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete a user (admin only)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ip = getClientIp(req);
    const rl = rateLimit(`users:DELETE:${ip}`, { tokens: 20, windowMs: 60_000 });
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

    const { id } = params;

    const existingUser = await nativeDB.findUserById(id);
    if (!existingUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    if (id === session.user.id) {
      return NextResponse.json(
        { message: 'You cannot delete your own account' },
        { status: 400 }
      );
    }

    await nativeDB.deleteUser(id);

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { message: 'Failed to delete user' },
      { status: 500 }
    );
  }
}

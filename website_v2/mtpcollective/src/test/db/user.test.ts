import { describe, it, expect } from 'vitest';
import { createTestUser } from '../db-utils';
import { compare } from 'bcrypt';
import { prisma } from '../setup';

describe('User Model', () => {

  it('should create a user with hashed password', async () => {
    const userData = {
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123',
      role: 'USER' as const,
    };

    const user = await createTestUser(prisma, userData);

    // Check user was created
    expect(user).toBeDefined();
    expect(user.email).toBe(userData.email);
    expect(user.name).toBe(userData.name);
    expect(user.role).toBe(userData.role);

    // Check password was hashed
    const passwordMatches = await compare(userData.password, user.password);
    expect(passwordMatches).toBe(true);
  });

  it('should enforce unique email addresses', async () => {
    const userData = {
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123',
      role: 'USER' as const,
    };

    await createTestUser(prisma, userData);

    // Try to create another user with the same email
    await expect(createTestUser(prisma, userData)).rejects.toThrow();
  });

  it('should only allow valid roles', async () => {
    const userData = {
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123',
      role: 'INVALID_ROLE' as any,
    };

    await expect(createTestUser(prisma, userData)).rejects.toThrow();
  });

  it('should retrieve user by email', async () => {
    const userData = {
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123',
      role: 'USER' as const,
    };

    await createTestUser(prisma, userData);

    const user = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    expect(user).toBeDefined();
    expect(user?.email).toBe(userData.email);
    expect(user?.name).toBe(userData.name);
  });

  it('should update user details', async () => {
    const userData = {
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123',
      role: 'USER' as const,
    };

    const user = await createTestUser(prisma, userData);

    const updatedName = 'Updated Name';
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { name: updatedName },
    });

    expect(updatedUser.name).toBe(updatedName);
  });

  it('should delete user', async () => {
    const userData = {
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123',
      role: 'USER' as const,
    };

    const user = await createTestUser(prisma, userData);

    await prisma.user.delete({
      where: { id: user.id },
    });

    const deletedUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    expect(deletedUser).toBeNull();
  });
});

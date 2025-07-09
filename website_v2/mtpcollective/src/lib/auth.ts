import type { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { withServerlessDB, withRetry } from '@/lib/db';
import { rawDB } from '@/lib/db-raw';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';

// Updated auth configuration with raw SQL fallback for user operations
export const authOptions: NextAuthOptions = {
  // Only use PrismaAdapter in development to avoid serverless issues
  adapter: process.env.NODE_ENV === 'development' ? PrismaAdapter(prisma) : undefined,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/admin/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          const { email, password } = credentials as { email?: string; password?: string };
          if (!email || !password) {
            throw new Error('Invalid credentials');
          }

          // Use raw SQL to avoid prepared statement issues
          const user = await rawDB.findUserByEmail(email);

          if (!user || !user.password) {
            throw new Error('Invalid credentials');
          }

          const isPasswordValid = await bcrypt.compare(
            password,
            user.password
          );

          if (!isPasswordValid) {
            throw new Error('Invalid credentials');
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          console.error('Authorization error:', error);
          throw new Error('Invalid credentials');
        }
      },
    }),
  ],
  callbacks: {
    async session({ token, session }) {
      if (token) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.role = token.role;
      }

      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        // User just signed in
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.role = user.role;
        return token;
      }

      // Return previous token if the access token has not expired yet
      if (token.email) {
        try {
          // Use raw SQL to avoid prepared statement issues
          const dbUser = await rawDB.findUserByEmail(token.email);

          if (dbUser) {
            return {
              id: dbUser.id,
              name: dbUser.name,
              email: dbUser.email,
              role: dbUser.role,
            };
          }
        } catch (error) {
          console.error('JWT callback error:', error);
          // Return existing token if database query fails
        }
      }

      return token;
    },
  },
}; 
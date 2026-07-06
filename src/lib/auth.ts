import type { NextAuthOptions } from 'next-auth';
import { nativeDB } from '@/lib/db-native';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { rateLimit, getClientIpFromRecord } from '@/lib/rateLimit';

// Brute-force protection: attempts are counted per IP+account and per IP.
// In-memory buckets reset on serverless cold starts, so these are a slowdown,
// not a hard guarantee.
const LOGIN_ACCOUNT_LIMIT = { tokens: 5, windowMs: 15 * 60_000 };
const LOGIN_IP_LIMIT = { tokens: 20, windowMs: 15 * 60_000 };

// Updated auth configuration with native PostgreSQL client only
export const authOptions: NextAuthOptions = {
  // SECURITY: Add secret for JWT signing
  secret: process.env.NEXTAUTH_SECRET,
  // Use JWT strategy only - no database adapter
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // SECURITY FIX: Reduced from 30 days to 7 days
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
      async authorize(credentials, req) {
        const { email, password } = (credentials ?? {}) as { email?: string; password?: string };
        if (!email || !password) {
          throw new Error('Invalid credentials');
        }

        const ip = getClientIpFromRecord(req?.headers ?? {});
        const ipLimit = rateLimit(`login:ip:${ip}`, LOGIN_IP_LIMIT);
        const accountLimit = rateLimit(
          `login:account:${ip}:${email.toLowerCase()}`,
          LOGIN_ACCOUNT_LIMIT
        );
        if (!ipLimit.allowed || !accountLimit.allowed) {
          throw new Error('Too many login attempts. Please try again later.');
        }

        try {
          // Use native PostgreSQL client to completely bypass Prisma
          const user = await nativeDB.findUserByEmail(email);

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
          // Use native PostgreSQL client to completely bypass Prisma
          const dbUser = await nativeDB.findUserByEmail(token.email);

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
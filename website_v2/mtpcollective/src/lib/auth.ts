import type { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { withServerlessDB, withRetry } from '@/lib/db';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';

// Updated auth configuration with proper environment variable setup
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

          const user = await withRetry(async () => {
            return await withServerlessDB(async (client) => {
              return await client.user.findUnique({
                where: {
                  email,
                },
              });
            });
          });

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
          const dbUser = await withRetry(async () => {
            return await withServerlessDB(async (client) => {
              return await client.user.findFirst({
                where: {
                  email: token.email!,
                },
              });
            });
          });

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
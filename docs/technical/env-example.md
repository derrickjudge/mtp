# Environment Variables Configuration

This document outlines all the environment variables required for the MTP Collective website to function properly, both in development and production environments.

## Required Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Cloudflare R2 Configuration
R2_BUCKET_NAME=your_r2_bucket_name
R2_PUBLIC_URL=https://your-bucket-name.account-id.r2.dev
R2_ENDPOINT=https://account-id.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key

# Authentication
NEXTAUTH_SECRET=your_super_secret_key

# Security (optional)
ADMIN_IP_ALLOWLIST=
```

## Environment Variables for Vercel Deployment

When deploying to Vercel, you need to add these environment variables in the Vercel project settings:

1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Add each of the environment variables listed above

## Notes on Security

- **Never commit** your actual environment variables to version control
- Use different keys for development and production environments
- The `SUPABASE_SERVICE_ROLE_KEY` has admin privileges, so it should only be used in secure server contexts 
# Vercel Deployment Guide

This guide explains how to deploy the MTP Collective website to Vercel.

## Prerequisites

1. A Vercel account (https://vercel.com)
2. A GitHub account with this repository pushed to it
3. Supabase project set up with the required tables and authentication
4. Cloudflare R2 bucket configured for image storage

## Deployment Steps

### 1. Connect Repository to Vercel

1. Log in to your Vercel account
2. Click "Add New..." > "Project"
3. Import your GitHub repository
4. Select the mtpcollective directory from the monorepo if prompted

### 2. Configure Environment Variables

Set up all the required environment variables as defined in the `docs/env-example.md` file:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_URL`
- `R2_ENDPOINT`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `NEXTAUTH_SECRET`
- `ADMIN_IP_ALLOWLIST` (optional; comma-separated list or empty)

### 3. Configure Build Settings

The project includes a `vercel.json` file that configures most deployment settings automatically. Ensure that:

1. The build command is set to `npm run build`
2. The output directory is set to `.next`
3. The Node.js version is set to 18.x or higher

### 4. Deploy

1. Click "Deploy"
2. Wait for the build to complete
3. Your site should now be live at the provided Vercel URL

## Post-Deployment Setup

### 1. Set Up Custom Domain (Optional)

1. Go to your project settings in Vercel
2. Navigate to "Domains"
3. Add your custom domain and follow the verification steps

### 2. Configure Supabase Authentication Redirect URLs

1. Log in to your Supabase project
2. Go to Authentication > URL Configuration
3. Add your Vercel deployment URL to the Site URL and Redirect URLs

### 3. Verify R2 Access

1. Check that your application can access the R2 bucket from the Vercel deployment
2. Verify that image uploads and retrievals work correctly

## Continuous Deployment

Vercel automatically deploys new changes when you push to the main branch of your GitHub repository. If you want to change this behavior:

1. Go to your project settings in Vercel
2. Navigate to Git
3. Configure the production branch and deployment settings as needed

## Troubleshooting

### 1. Build Failures

- Check the build logs for specific errors
- Ensure all dependencies are correctly installed
- Verify that environment variables are correctly set

### 2. Runtime Errors

- Check the Vercel logs for runtime errors
- Test API endpoints to ensure they're working correctly
- Verify Supabase and R2 connection from the deployed environment

### 3. Supabase Connection Issues

- Verify that your Supabase project is on a plan that allows external connections
- Check that the Supabase URL and keys are correct
- Ensure your IP is not blocked by Supabase security settings

### 4. R2 Storage Issues

- Verify that your R2 credentials are correct
- Check CORS settings on your R2 bucket
- Ensure the R2 bucket policy allows the necessary operations 
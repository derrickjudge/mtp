# Production Deployment Guide

## 🚨 **URGENT: Authentication Fix Required**

The authentication is currently failing in production because the environment variables are not properly configured in Vercel.

## **Required Environment Variables for Production**

Set these in Vercel Dashboard at: https://vercel.com/your-team/mtp-delta/settings/environment-variables

### **Database Configuration**
```
POSTGRES_PRISMA_URL=postgres://postgres.denljmcgyghtpcygsocd:PIFjg7bVXaacfTs5@aws-0-us-west-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x

POSTGRES_URL_NON_POOLING=postgresql://postgres:PIFjg7bVXaacfTs5@db.denljmcgyghtpcygsocd.supabase.co:5432/postgres
```

### **NextAuth Configuration**
```
NEXTAUTH_SECRET=98Kkp6hQV3pNUIWCdYge6izr8cavQ2tH7sr2S9z5hr4=

NEXTAUTH_URL=https://mtp-delta.vercel.app
```

## **Current Status**

✅ **Local Development**: Working perfectly
- Database connection: ✅ Connected
- Admin user: ✅ Exists with correct password
- Authentication: ✅ Working

❌ **Production**: Failing
- Issue: Environment variables not properly set
- Symptom: Login page shows loading spinner indefinitely
- Root cause: `NEXTAUTH_URL` likely set to localhost instead of production URL

## **Fix Steps**

1. **Go to Vercel Dashboard**
   - Navigate to: https://vercel.com/your-team/mtp-delta/settings/environment-variables

2. **Set Environment Variables**
   - Add all variables listed above
   - Make sure `NEXTAUTH_URL` is set to `https://mtp-delta.vercel.app`
   - Ensure database URLs are correctly formatted

3. **Redeploy**
   - Trigger a new deployment after setting environment variables
   - Or run: `vercel --prod` from the project directory

## **Verification**

After deployment, test:
- https://mtp-delta.vercel.app/admin/login
- Login with: `admin@mtpcollective.com` / `admin123`
- Should redirect to admin panel successfully

## **Database Status**
- ✅ Admin user exists in database
- ✅ Password is correctly hashed
- ✅ User has ADMIN role
- ⚠️ No categories created yet (can be done through admin UI)
- ⚠️ 1 photo exists (likely test data)

## **Next Steps After Fix**
1. Test authentication in production
2. Create categories through admin UI
3. Set up R2 for photo uploads (optional)
4. Populate content 
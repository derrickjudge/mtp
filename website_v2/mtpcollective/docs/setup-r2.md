# Setting Up Cloudflare R2 for Photo Storage

The MTP Collective website uses Cloudflare R2 for storing uploaded photos. Here's how to set it up:

## 1. Create a Cloudflare R2 Bucket

1. **Log in to Cloudflare Dashboard**
   - Go to https://dash.cloudflare.com/
   - Navigate to R2 Object Storage

2. **Create a new bucket**
   - Click "Create bucket"
   - Choose a unique name (e.g., `mtp-photos`)
   - Select a location close to your users

3. **Configure public access**
   - Go to your bucket settings
   - Enable public access for the bucket
   - Note the public URL (e.g., `https://your-bucket.account-id.r2.dev`)

## 2. Create API Tokens

1. **Go to R2 API Tokens**
   - In Cloudflare dashboard, go to R2 → Manage R2 API tokens
   - Click "Create API token"

2. **Configure permissions**
   - **Token name**: `MTP Website Upload`
   - **Permissions**: `Object Read and Write`
   - **Bucket**: Select your bucket or use `*` for all buckets
   - **TTL**: Set to never expire or a long duration

3. **Save the credentials**
   - Copy the **Access Key ID**
   - Copy the **Secret Access Key**
   - Note the **Endpoint URL** (e.g., `https://account-id.r2.cloudflarestorage.com`)

## 3. Environment Variables

Add these to your `.env.local` file and Vercel environment variables:

```bash
# Cloudflare R2 Configuration
R2_BUCKET_NAME=your-bucket-name
R2_PUBLIC_URL=https://your-bucket.account-id.r2.dev
R2_ENDPOINT=https://account-id.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
```

## 4. Test the Configuration

Run the test script to verify your R2 setup:

```bash
npm run test-r2
```

## 5. Deploy to Production

1. **Add environment variables to Vercel**:
   - Go to your Vercel project dashboard
   - Navigate to Settings → Environment Variables
   - Add all the R2 environment variables

2. **Redeploy your application**:
   ```bash
   git push origin main
   ```

## Troubleshooting

### Common Issues

1. **"Access Denied" errors**
   - Check that your API token has the correct permissions
   - Verify the bucket name is correct

2. **"Bucket not found" errors**
   - Ensure the bucket name in your environment variables matches exactly
   - Check that the bucket exists in your Cloudflare account

3. **CORS errors**
   - Configure CORS settings in your R2 bucket if needed
   - Allow origins from your domain

### Testing Locally

You can test R2 access with:

```bash
npm run test-r2
```

This will verify your configuration and list objects in your bucket.

## Cost Considerations

- **Storage**: $0.015 per GB per month
- **Class A operations** (uploads): $4.50 per million requests
- **Class B operations** (downloads): $0.36 per million requests
- **Egress**: Free up to 10GB per month, then $0.09 per GB

For a photography website, costs are typically very low unless you have high traffic.

## Security Notes

- Never commit your R2 credentials to version control
- Use different buckets/credentials for development and production
- Consider setting up bucket policies for additional security
- Regularly rotate your API tokens 
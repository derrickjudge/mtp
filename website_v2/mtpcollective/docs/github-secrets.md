# GitHub Secrets Configuration for Vercel Deployment

This documentation explains how to set up the required GitHub repository secrets for automated Vercel deployments using the GitHub Actions workflows.

## Required Secrets

The following secrets need to be configured in your GitHub repository:

1. `VERCEL_TOKEN` - A Vercel personal access token
2. `VERCEL_ORG_ID` - Your Vercel organization ID
3. `VERCEL_PROJECT_ID` - Your Vercel project ID

## How to Get These Values

### VERCEL_TOKEN

1. Log in to your [Vercel account](https://vercel.com)
2. Go to Settings → Tokens
3. Create a new token with an appropriate name (e.g., "GitHub Actions Deployment")
4. Select the scope (recommend "Full Account" for CI/CD)
5. Copy the generated token

### VERCEL_ORG_ID and VERCEL_PROJECT_ID

1. Run `npx vercel link` in your project directory
2. Follow the prompts to link your project
3. After linking, check the `.vercel/project.json` file
4. The `orgId` value is your `VERCEL_ORG_ID`
5. The `projectId` value is your `VERCEL_PROJECT_ID`

Alternatively, you can find these values in your Vercel dashboard:
- Org ID: Settings → General → Organization ID
- Project ID: In the project settings → General → Project ID

## Adding Secrets to GitHub

1. Go to your GitHub repository
2. Click on "Settings" > "Secrets and variables" > "Actions"
3. Click "New repository secret"
4. Add each of the required secrets:
   - Name: `VERCEL_TOKEN`
   - Value: (paste your Vercel token)
5. Repeat for `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID`

## Security Notes

- Keep these tokens secure and never share them publicly
- Consider setting expiration dates on your Vercel tokens
- Restrict the token permissions to only what's needed
- Rotate tokens periodically for better security 
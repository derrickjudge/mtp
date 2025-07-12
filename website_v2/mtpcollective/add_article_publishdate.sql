-- Migration: Add publishDate column to Article table
-- This allows articles to have custom dates separate from createdAt

-- Add the publishDate column to the Article table
ALTER TABLE "Article" 
ADD COLUMN "publishDate" TIMESTAMP(3);

-- Update the article listing query order to use publishDate when available
-- (This is handled in the application code - no SQL changes needed)

-- Optional: Set publishDate to createdAt for existing articles if desired
-- UPDATE "Article" SET "publishDate" = "createdAt" WHERE "publishDate" IS NULL;

-- Note: The application will use COALESCE("publishDate", "createdAt") for ordering
-- so articles without publishDate will fall back to createdAt for sorting 
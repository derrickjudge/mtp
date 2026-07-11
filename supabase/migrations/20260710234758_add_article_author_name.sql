-- Add a free-text byline to Article, independent of the User table.
-- Lets an article credit an author who has no admin account (e.g. a guest
-- or freelance contributor). NULL/blank is treated as "Anonymous Author"
-- at the application layer.
alter table "Article" add column if not exists "authorName" text;

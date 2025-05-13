-- MTP Photography Website - Seed Data
-- Migration: 002
-- Created: 2025-04-30

-- -----------------------------------------------------
-- Sample photo data (for development only)
-- -----------------------------------------------------

-- Ensuring categories exist (safe to run multiple times)
INSERT IGNORE INTO `categories` (`name`, `description`) VALUES
('Concerts', 'Concert and music event photography'),
('Sports', 'Sports and athletic event photography'),
('Street', 'Urban and street photography'),
('Nature', 'Landscape and wildlife photography'),
('Automotive', 'Car and automotive photography');

-- Sample tags
INSERT IGNORE INTO `tags` (`name`) VALUES
('music'), ('rock'), ('live'), ('basketball'), ('sports'),
('action'), ('urban'), ('night'), ('city'), ('landscape'),
('mountains'), ('water'), ('cars'), ('vintage'), ('classic');

-- Sample photos
-- Note: These will use the same placeholder images as our static data
INSERT INTO `photos` (`title`, `description`, `category_id`, `file_url`, `thumbnail_url`, `width`, `height`, `upload_date`) VALUES
(
  'Rock Concert', 
  'Live performance at a major venue', 
  (SELECT id FROM categories WHERE name = 'Concerts'), 
  'https://picsum.photos/800/600?random=1', 
  'https://picsum.photos/400/300?random=1',
  800,
  600,
  '2025-03-15 00:00:00'
),
(
  'Basketball Game', 
  'Championship game action shot', 
  (SELECT id FROM categories WHERE name = 'Sports'), 
  'https://picsum.photos/800/600?random=2', 
  'https://picsum.photos/400/300?random=2',
  800,
  600,
  '2025-03-20 00:00:00'
),
(
  'Downtown at Night', 
  'City streets after dark with neon lights', 
  (SELECT id FROM categories WHERE name = 'Street'), 
  'https://picsum.photos/800/600?random=3', 
  'https://picsum.photos/400/300?random=3',
  800,
  600,
  '2025-03-25 00:00:00'
),
(
  'Mountain Lake', 
  'Serene mountain lake at sunrise', 
  (SELECT id FROM categories WHERE name = 'Nature'), 
  'https://picsum.photos/800/600?random=4', 
  'https://picsum.photos/400/300?random=4',
  800,
  600,
  '2025-03-30 00:00:00'
),
(
  'Classic Car Show', 
  'Vintage automobiles on display', 
  (SELECT id FROM categories WHERE name = 'Automotive'), 
  'https://picsum.photos/800/600?random=5', 
  'https://picsum.photos/400/300?random=5',
  800,
  600,
  '2025-04-05 00:00:00'
);

-- Link photos with tags
-- First, get the IDs for more reliable insertion
SET @photo1 = (SELECT id FROM photos WHERE title = 'Rock Concert' LIMIT 1);
SET @photo2 = (SELECT id FROM photos WHERE title = 'Basketball Game' LIMIT 1);
SET @photo3 = (SELECT id FROM photos WHERE title = 'Downtown at Night' LIMIT 1);
SET @photo4 = (SELECT id FROM photos WHERE title = 'Mountain Lake' LIMIT 1);
SET @photo5 = (SELECT id FROM photos WHERE title = 'Classic Car Show' LIMIT 1);

-- Now add photo tags (if the photos were inserted)
INSERT IGNORE INTO `photo_tags` (`photo_id`, `tag_id`)
SELECT @photo1, id FROM tags WHERE name IN ('music', 'rock', 'live') AND @photo1 IS NOT NULL
UNION
SELECT @photo2, id FROM tags WHERE name IN ('basketball', 'sports', 'action') AND @photo2 IS NOT NULL
UNION
SELECT @photo3, id FROM tags WHERE name IN ('urban', 'night', 'city') AND @photo3 IS NOT NULL
UNION
SELECT @photo4, id FROM tags WHERE name IN ('landscape', 'mountains', 'water') AND @photo4 IS NOT NULL
UNION
SELECT @photo5, id FROM tags WHERE name IN ('cars', 'vintage', 'classic') AND @photo5 IS NOT NULL;

-- Create an admin user (password is hashed, this is just a placeholder)
-- In a real implementation, we would hash the password properly
INSERT IGNORE INTO `users` (`username`, `email`, `password`, `role`) VALUES
('admin', 'admin@mtpphotography.com', 'hashed_password_placeholder', 'admin');

-- MTP Photography Database Schema
-- This script creates all required tables for the application

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Photos table
CREATE TABLE IF NOT EXISTS photos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category_id INT NOT NULL,
  upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  file_url VARCHAR(1024) NOT NULL,
  thumbnail_url VARCHAR(1024) NOT NULL,
  width INT DEFAULT 1200,
  height INT DEFAULT 800,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  INDEX idx_photos_category (category_id),
  INDEX idx_photos_title (title)
);

-- Photo Tags junction table
CREATE TABLE IF NOT EXISTS photo_tags (
  photo_id INT NOT NULL,
  tag_id INT NOT NULL,
  PRIMARY KEY (photo_id, tag_id),
  FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'editor', 'viewer') DEFAULT 'viewer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert seed data for categories
INSERT INTO categories (name, description) VALUES 
  ('Concerts', 'Concert and music event photography'),
  ('Sports', 'Sports and athletic event photography'),
  ('Street', 'Urban and street photography'),
  ('Nature', 'Landscape and wildlife photography'),
  ('Automotive', 'Car and automotive photography')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- Insert seed data for tags
INSERT INTO tags (name) VALUES 
  ('music'), ('rock'), ('live'),
  ('basketball'), ('sports'), ('action'),
  ('urban'), ('night'), ('city'),
  ('landscape'), ('mountains'), ('water'),
  ('cars'), ('vintage'), ('classic')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Insert seed data for photos
INSERT INTO photos (title, description, category_id, file_url, thumbnail_url, upload_date, width, height) VALUES 
  ('Rock Concert', 'Live performance at a major venue', 1, 'https://picsum.photos/800/600?random=1', 'https://picsum.photos/400/300?random=1', '2025-03-15', 800, 600),
  ('Basketball Game', 'Championship game action shot', 2, 'https://picsum.photos/800/600?random=2', 'https://picsum.photos/400/300?random=2', '2025-03-20', 800, 600),
  ('Downtown at Night', 'City streets after dark with neon lights', 3, 'https://picsum.photos/800/600?random=3', 'https://picsum.photos/400/300?random=3', '2025-03-25', 800, 600),
  ('Mountain Lake', 'Serene mountain lake at sunrise', 4, 'https://picsum.photos/800/600?random=4', 'https://picsum.photos/400/300?random=4', '2025-03-30', 800, 600),
  ('Classic Car Show', 'Vintage automobiles on display', 5, 'https://picsum.photos/800/600?random=5', 'https://picsum.photos/400/300?random=5', '2025-04-05', 800, 600)
ON DUPLICATE KEY UPDATE title = VALUES(title);

-- Insert photo tags
-- First, get the IDs of the photos and tags to relate them
INSERT INTO photo_tags (photo_id, tag_id) 
SELECT p.id, t.id FROM 
  photos p JOIN tags t ON 
  (p.title = 'Rock Concert' AND t.name IN ('music', 'rock', 'live')) OR
  (p.title = 'Basketball Game' AND t.name IN ('basketball', 'sports', 'action')) OR
  (p.title = 'Downtown at Night' AND t.name IN ('urban', 'night', 'city')) OR
  (p.title = 'Mountain Lake' AND t.name IN ('landscape', 'mountains', 'water')) OR
  (p.title = 'Classic Car Show' AND t.name IN ('cars', 'vintage', 'classic'))
ON DUPLICATE KEY UPDATE photo_id = VALUES(photo_id);

-- Insert admin user (password is hashed in actual implementation)
INSERT INTO users (username, email, password, role) VALUES 
  ('admin', 'admin@mtpphotography.com', 'password_hash_placeholder', 'admin')
ON DUPLICATE KEY UPDATE email = VALUES(email);

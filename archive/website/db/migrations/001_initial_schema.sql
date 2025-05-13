-- MTP Photography Website - Initial Schema
-- Migration: 001
-- Created: 2025-04-30

-- Use utf8mb4 character set for proper Unicode support including emojis
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------
-- Table `categories`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `categories` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `idx_category_name` (`name` ASC)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `photos`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `photos` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `category_id` INT UNSIGNED NOT NULL,
  `file_url` VARCHAR(1024) NOT NULL,
  `thumbnail_url` VARCHAR(1024) NOT NULL,
  `width` INT UNSIGNED NOT NULL DEFAULT 1200,
  `height` INT UNSIGNED NOT NULL DEFAULT 800,
  `upload_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_photo_category` (`category_id` ASC),
  INDEX `idx_photo_title` (`title` ASC),
  INDEX `idx_photo_upload_date` (`upload_date` DESC),
  CONSTRAINT `fk_photo_category`
    FOREIGN KEY (`category_id`)
    REFERENCES `categories` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `tags`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `tags` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `idx_tag_name` (`name` ASC)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `photo_tags` (Junction table for many-to-many relationship)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `photo_tags` (
  `photo_id` INT UNSIGNED NOT NULL,
  `tag_id` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`photo_id`, `tag_id`),
  INDEX `idx_photo_tags_tag` (`tag_id` ASC),
  CONSTRAINT `fk_photo_tags_photo`
    FOREIGN KEY (`photo_id`)
    REFERENCES `photos` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_photo_tags_tag`
    FOREIGN KEY (`tag_id`)
    REFERENCES `tags` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Table `users` (For future authentication)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(100) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'editor', 'viewer') NOT NULL DEFAULT 'viewer',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `idx_user_username` (`username` ASC),
  UNIQUE INDEX `idx_user_email` (`email` ASC)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- Initial seed data - Categories
-- -----------------------------------------------------
INSERT INTO `categories` (`name`, `description`) VALUES
('Concerts', 'Concert and music event photography'),
('Sports', 'Sports and athletic event photography'),
('Street', 'Urban and street photography'),
('Nature', 'Landscape and wildlife photography'),
('Automotive', 'Car and automotive photography');

SET FOREIGN_KEY_CHECKS = 1;

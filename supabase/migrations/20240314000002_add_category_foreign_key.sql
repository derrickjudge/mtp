-- Add foreign key constraint to photos table
ALTER TABLE photos
  ADD CONSTRAINT fk_photos_category
  FOREIGN KEY (category_id)
  REFERENCES categories(id)
  ON DELETE SET NULL; 
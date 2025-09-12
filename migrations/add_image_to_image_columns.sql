-- Migration: Add image-to-image support columns to image_generations table
-- Created: 2025-09-09

-- Add generation_mode column (text-to-image or image-to-image)
ALTER TABLE image_generations 
ADD COLUMN IF NOT EXISTS generation_mode VARCHAR(20) DEFAULT 'text-to-image' CHECK (generation_mode IN ('text-to-image', 'image-to-image'));

-- Add source_image_url column for image-to-image mode
ALTER TABLE image_generations 
ADD COLUMN IF NOT EXISTS source_image_url TEXT;

-- Add comment to document the new columns
COMMENT ON COLUMN image_generations.generation_mode IS 'Type of generation: text-to-image or image-to-image';
COMMENT ON COLUMN image_generations.source_image_url IS 'Source image URL for image-to-image generation mode';

-- Create index on generation_mode for filtering
CREATE INDEX IF NOT EXISTS idx_image_generations_mode ON image_generations(generation_mode);

-- Update any existing records to have the default mode
UPDATE image_generations 
SET generation_mode = 'text-to-image' 
WHERE generation_mode IS NULL;
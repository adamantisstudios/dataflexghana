-- Update properties table to support multiple images
-- Change image_url column to image_urls array
ALTER TABLE properties 
DROP COLUMN IF EXISTS image_url;

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';

-- Update existing properties with placeholder if they have no images
UPDATE properties 
SET image_urls = ARRAY['/placeholder.svg'] 
WHERE image_urls IS NULL OR array_length(image_urls, 1) IS NULL;

-- Add index for better performance on image_urls queries
CREATE INDEX IF NOT EXISTS idx_properties_image_urls ON properties USING GIN (image_urls);

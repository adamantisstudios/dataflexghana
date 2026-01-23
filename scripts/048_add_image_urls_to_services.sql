-- Check if image_urls column exists in services table, if not add it
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'services' AND COLUMN_NAME = 'image_urls') THEN
        ALTER TABLE services ADD COLUMN image_urls TEXT[] DEFAULT '{}';
    END IF;
END $$;

-- Migrate existing image_url data to image_urls array if needed
UPDATE services 
SET image_urls = ARRAY[image_url] 
WHERE image_url IS NOT NULL 
AND (image_urls IS NULL OR array_length(image_urls, 1) IS NULL);

-- Create a comment for the column
COMMENT ON COLUMN services.image_urls IS 'Array of image URLs for the service gallery';

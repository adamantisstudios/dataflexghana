-- Agent profile completion fields (optional at registration, required after approval)

ALTER TABLE agents ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS profession TEXT;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS exact_location TEXT;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

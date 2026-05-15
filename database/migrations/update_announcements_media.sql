-- Update announcements to support media (Images and Videos)
ALTER TABLE announcements 
ADD COLUMN IF NOT EXISTS media_url TEXT,
ADD COLUMN IF NOT EXISTS media_type TEXT; -- e.g., 'image' or 'video'

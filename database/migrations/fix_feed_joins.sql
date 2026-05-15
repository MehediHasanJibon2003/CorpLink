-- Fix foreign key relationships for Corporate Feed joins
-- This allows Supabase to join 'announcements' with 'profiles' via 'created_by'

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'announcements_created_by_profiles_fkey'
  ) THEN
    ALTER TABLE announcements
    ADD CONSTRAINT announcements_created_by_profiles_fkey
    FOREIGN KEY (created_by) REFERENCES profiles(id);
  END IF;

  -- Also for post_comments and post_reactions if needed
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'post_comments_employee_id_profiles_fkey'
  ) THEN
    ALTER TABLE post_comments
    ADD CONSTRAINT post_comments_employee_id_profiles_fkey
    FOREIGN KEY (employee_id) REFERENCES profiles(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'post_reactions_employee_id_profiles_fkey'
  ) THEN
    ALTER TABLE post_reactions
    ADD CONSTRAINT post_reactions_employee_id_profiles_fkey
    FOREIGN KEY (employee_id) REFERENCES profiles(id);
  END IF;
END $$;

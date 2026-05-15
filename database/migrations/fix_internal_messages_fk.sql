-- Fix for Missing Relationship Error
-- Run this in Supabase SQL Editor to allow joining internal_messages with profiles

-- 1. Ensure sender_id has a relationship with profiles
ALTER TABLE internal_messages
DROP CONSTRAINT IF EXISTS internal_messages_sender_id_fkey,
ADD CONSTRAINT internal_messages_sender_id_fkey 
  FOREIGN KEY (sender_id) 
  REFERENCES profiles(id) 
  ON DELETE CASCADE;

-- 2. Ensure receiver_id (if used) also has a relationship with profiles
ALTER TABLE internal_messages
DROP CONSTRAINT IF EXISTS internal_messages_receiver_id_fkey,
ADD CONSTRAINT internal_messages_receiver_id_fkey 
  FOREIGN KEY (receiver_id) 
  REFERENCES profiles(id) 
  ON DELETE CASCADE;

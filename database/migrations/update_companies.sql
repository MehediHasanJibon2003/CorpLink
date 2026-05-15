-- Run this in your Supabase SQL Editor to add the missing columns to the companies table
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive', 'rejected')),
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'basic' CHECK (plan IN ('basic', 'standard', 'enterprise')),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- Add gallery JSONB column to events and posts tables
-- Run this once in your Supabase SQL editor (https://supabase.com/dashboard > SQL Editor)

ALTER TABLE events ADD COLUMN IF NOT EXISTS gallery JSONB DEFAULT '[]';
ALTER TABLE posts  ADD COLUMN IF NOT EXISTS gallery JSONB DEFAULT '[]';

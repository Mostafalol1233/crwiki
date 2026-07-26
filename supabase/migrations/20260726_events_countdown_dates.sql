-- Add countdown date columns to events table
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/qywburkldwdkegztsgjj/editor

ALTER TABLE events ADD COLUMN IF NOT EXISTS start_date text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS end_date text;

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'events' 
ORDER BY ordinal_position;

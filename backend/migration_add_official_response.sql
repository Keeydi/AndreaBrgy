-- Migration: Add official_response field to reports table
-- Run this if the field doesn't exist yet

ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS official_response TEXT NULL 
AFTER status;


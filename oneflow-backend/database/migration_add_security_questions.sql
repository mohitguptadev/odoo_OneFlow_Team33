-- Migration: Add security questions for password reset
-- Run this script to add security_question and security_answer columns to users table

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS security_question VARCHAR(255),
ADD COLUMN IF NOT EXISTS security_answer_hash VARCHAR(255);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_security_question ON users(email, security_question);


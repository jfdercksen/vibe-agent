-- Migration: Add key_takeaways column to blog_posts
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/cfkovdyvmbnnyzihqanp/sql/new

ALTER TABLE blog_posts
  ADD COLUMN IF NOT EXISTS key_takeaways TEXT;

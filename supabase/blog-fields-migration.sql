-- Blog Post Extended Fields Migration
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/cfkovdyvmbnnyzihqanp/sql/new
--
-- Adds SEO scores, readability scores, categorization, alt text,
-- external sources, and processing log to blog_posts.

ALTER TABLE blog_posts
  ADD COLUMN IF NOT EXISTS seo_score            INTEGER,
  ADD COLUMN IF NOT EXISTS seo_analysis         TEXT,
  ADD COLUMN IF NOT EXISTS readability_score    INTEGER,
  ADD COLUMN IF NOT EXISTS readability_analysis TEXT,
  ADD COLUMN IF NOT EXISTS category             TEXT,
  ADD COLUMN IF NOT EXISTS tags                 TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS alt_text             TEXT,
  ADD COLUMN IF NOT EXISTS external_sources     TEXT,
  ADD COLUMN IF NOT EXISTS processing_log       TEXT;

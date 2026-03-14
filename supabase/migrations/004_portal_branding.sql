-- ============================================================
-- LaunchTrack - Client Portal Branding
-- ============================================================

ALTER TABLE organizations
  ADD COLUMN brand_color TEXT NOT NULL DEFAULT '#3b82f6',
  ADD COLUMN portal_tagline TEXT;

-- ============================================================
-- LaunchTrack - Custom Domain Support
-- ============================================================

ALTER TABLE organizations
  ADD COLUMN custom_domain TEXT UNIQUE,
  ADD COLUMN custom_domain_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN custom_domain_verify_token TEXT;

-- Run this in the Supabase SQL Editor (or any psql session connected to your DB).
-- Purpose: enable Row Level Security (RLS) on job-portal tables.
--
-- IMPORTANT:
-- - The backend (Spring Boot) connects to Postgres directly using the
--   database user/password, which BYPASSES RLS. These statements will not
--   break the backend as long as it keeps using that privileged connection.
-- - Supabase's REST/GraphQL APIs use the 'anon'/'authenticated' roles.
--   With RLS enabled and no permissive policies, those roles cannot read or
--   modify the tables (default deny) -- which is what we want for this app,
--   because all data access goes through the Spring Boot backend.
--
-- Adjust table names if your actual schema differs (e.g. user roles table).

ALTER TABLE IF EXISTS users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS jobs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS applications  ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS roles         ENABLE ROW LEVEL SECURITY;

-- Optional hardening: also force RLS for table owners (recommended for defense-in-depth).
-- Be careful: this can affect migrations/maintenance tools running as the owner.
-- ALTER TABLE users          FORCE ROW LEVEL SECURITY;
-- ALTER TABLE jobs          FORCE ROW LEVEL SECURITY;
-- ALTER TABLE applications  FORCE ROW LEVEL SECURITY;
-- ALTER TABLE roles         FORCE ROW LEVEL SECURITY;

-- If you later want the Supabase REST API to access a table, you MUST add an
-- explicit policy, e.g. read-only for authenticated users:
-- CREATE POLICY "authenticated_read_jobs" ON jobs
--   FOR SELECT TO authenticated USING (true);
"
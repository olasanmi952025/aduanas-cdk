-- Optional seed: create extension and a simple table if desired
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Initialize database for NestJS API
-- Note: In official Postgres images, the default database is already created.
-- This script runs inside the default database context on first-time init.

-- Create extensions if needed (safe if already exists)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

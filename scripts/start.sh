#!/bin/bash
set -e

export NODE_TLS_REJECT_UNAUTHORIZED=0

# Create the database if it doesn't exist (connect to default 'postgres' db first)
echo "Ensuring database exists..."
DB_URL="${DATABASE_URL}"
# Extract database name from URL (the path after the last /)
DB_NAME=$(echo "$DB_URL" | sed -E 's|.*/([^?]+).*|\1|')
# Replace the database name with 'postgres' to connect to the default db
ADMIN_URL=$(echo "$DB_URL" | sed -E "s|/$DB_NAME|/postgres|")

node -e "
  const { Pool } = require('pg');
  const url = process.argv[1];
  const dbName = process.argv[2];
  const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });
  pool.query('SELECT 1 FROM pg_database WHERE datname = \$1', [dbName]).then(r => {
    if (r.rows.length === 0) {
      console.log('Creating database ' + dbName + '...');
      return pool.query('CREATE DATABASE \"' + dbName + '\"');
    } else {
      console.log('Database ' + dbName + ' exists.');
    }
  }).then(() => pool.end()).catch(e => { console.error('DB create error:', e.message); pool.end(); });
" "$ADMIN_URL" "$DB_NAME"

echo "Running database schema sync..."
./node_modules/.bin/drizzle-kit push --force

echo "Adding notification_email column to forms if missing..."
node -e "
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: process.argv[1], ssl: { rejectUnauthorized: false } });
  pool.query(\`ALTER TABLE forms ADD COLUMN IF NOT EXISTS notification_email text\`)
    .then(() => { console.log('notification_email column ready.'); return pool.end(); })
    .catch(e => { console.error('Column add error:', e.message); pool.end(); });
" "$DB_URL"

echo "Ensuring media table exists..."
node -e "
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: process.argv[1], ssl: { rejectUnauthorized: false } });
  pool.query(\`
    CREATE TABLE IF NOT EXISTS \"media\" (
      \"id\" serial PRIMARY KEY,
      \"filename\" text NOT NULL,
      \"object_path\" text NOT NULL,
      \"folder\" text NOT NULL DEFAULT 'general',
      \"content_type\" text,
      \"size\" integer,
      \"uploaded_by\" integer,
      \"created_at\" timestamp NOT NULL DEFAULT now()
    );
  \`).then(() => { console.log('Media table ready.'); return pool.end(); })
    .catch(e => { console.error('Media table error:', e.message); pool.end(); });
" "$DB_URL"

echo "Ensuring media_folders table exists..."
node -e "
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: process.argv[1], ssl: { rejectUnauthorized: false } });
  pool.query(\`
    CREATE TABLE IF NOT EXISTS \"media_folders\" (
      \"id\" serial PRIMARY KEY,
      \"path\" text NOT NULL UNIQUE,
      \"created_by\" integer,
      \"created_at\" timestamp NOT NULL DEFAULT now()
    );
    INSERT INTO media_folders (path) VALUES ('events'), ('team'), ('sermons'), ('pages'), ('general')
    ON CONFLICT (path) DO NOTHING;
  \`).then(() => { console.log('Media folders table ready.'); return pool.end(); })
    .catch(e => { console.error('Media folders table error:', e.message); pool.end(); });
" "$DB_URL"

echo "Ensuring session table exists..."
node -e "
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: process.argv[1], ssl: { rejectUnauthorized: false } });
  pool.query(\`
    CREATE TABLE IF NOT EXISTS \"session\" (
      \"sid\" varchar NOT NULL COLLATE \"default\",
      \"sess\" json NOT NULL,
      \"expire\" timestamp(6) NOT NULL,
      CONSTRAINT \"session_pkey\" PRIMARY KEY (\"sid\")
    );
    CREATE INDEX IF NOT EXISTS \"IDX_session_expire\" ON \"session\" (\"expire\");
  \`).then(() => { console.log('Session table ready.'); return pool.end(); })
    .catch(e => { console.error('Session table error:', e.message); pool.end(); });
" "$DB_URL"

echo "Ensuring city_groups tables exist..."
node -e "
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: process.argv[1], ssl: { rejectUnauthorized: false } });
  pool.query(\`
    CREATE TABLE IF NOT EXISTS \"city_groups\" (
      \"id\" serial PRIMARY KEY,
      \"name\" text NOT NULL,
      \"description\" text,
      \"meeting_day\" text,
      \"meeting_time\" text,
      \"is_active\" boolean NOT NULL DEFAULT true,
      \"sort_order\" integer NOT NULL DEFAULT 0,
      \"created_at\" timestamp NOT NULL DEFAULT now(),
      \"updated_at\" timestamp NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS \"city_group_signups\" (
      \"id\" serial PRIMARY KEY,
      \"name\" text NOT NULL,
      \"email\" text NOT NULL,
      \"phone\" text,
      \"group_ids\" integer[] NOT NULL,
      \"created_at\" timestamp NOT NULL DEFAULT now()
    );
  \`).then(() => { console.log('City groups tables ready.'); return pool.end(); })
    .catch(e => { console.error('City groups table error:', e.message); pool.end(); });
" "$DB_URL"

echo "Ensuring user_city_groups table exists..."
node -e "
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: process.argv[1], ssl: { rejectUnauthorized: false } });
  pool.query(\`
    CREATE TABLE IF NOT EXISTS \"user_city_groups\" (
      \"id\" serial PRIMARY KEY,
      \"user_id\" integer NOT NULL,
      \"city_group_id\" integer NOT NULL,
      \"other_group_name\" text,
      \"created_at\" timestamp NOT NULL DEFAULT now(),
      UNIQUE(\"user_id\", \"city_group_id\")
    );
  \`).then(() => { console.log('User city groups table ready.'); return pool.end(); })
    .catch(e => { console.error('User city groups table error:', e.message); pool.end(); });
" "$DB_URL"

echo "Ensuring pco_donations table exists..."
node -e "
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: process.argv[1], ssl: { rejectUnauthorized: false } });
  pool.query(\`
    CREATE TABLE IF NOT EXISTS \"pco_donations\" (
      \"id\" serial PRIMARY KEY,
      \"pco_donation_id\" text NOT NULL UNIQUE,
      \"pco_person_id\" text,
      \"donor_email\" text,
      \"donor_name\" text,
      \"user_id\" integer,
      \"amount_cents\" integer NOT NULL,
      \"fund_name\" text,
      \"fund_id\" text,
      \"payment_method\" text,
      \"received_at\" timestamp,
      \"created_at\" timestamp NOT NULL DEFAULT now()
    );
  \`).then(() => { console.log('pco_donations table ready.'); return pool.end(); })
    .catch(e => { console.error('pco_donations table error:', e.message); pool.end(); });
" "$DB_URL"

echo "Ensuring events sort columns exist..."
node -e "
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: process.argv[1], ssl: { rejectUnauthorized: false } });
  pool.query(\`
    ALTER TABLE events ADD COLUMN IF NOT EXISTS sort_order integer;
    ALTER TABLE events ADD COLUMN IF NOT EXISTS pinned text;
  \`).then(() => { console.log('Events sort columns ready.'); return pool.end(); })
    .catch(e => { console.error('Events sort columns error:', e.message); pool.end(); });
" "$DB_URL"

echo "Fixing media paths with double /objects/ prefix..."
node -e "
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: process.argv[1], ssl: { rejectUnauthorized: false } });
  pool.query(\`UPDATE media SET object_path = REPLACE(object_path, '/objects/', '/') WHERE object_path LIKE '/objects/%'\`)
    .then(r => { console.log('Fixed ' + r.rowCount + ' media paths.'); return pool.end(); })
    .catch(e => { console.error('Media path fix error:', e.message); pool.end(); });
" "$DB_URL"

echo "Starting server..."
node dist/index.cjs

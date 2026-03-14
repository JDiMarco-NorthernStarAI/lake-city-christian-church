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

echo "Starting server..."
node dist/index.cjs

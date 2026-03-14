#!/bin/bash
set -e

echo "Running database schema sync..."
NODE_TLS_REJECT_UNAUTHORIZED=0 ./node_modules/.bin/drizzle-kit push --force

echo "Starting server..."
node dist/index.cjs

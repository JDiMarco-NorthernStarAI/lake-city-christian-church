#!/bin/bash
set -e

echo "Running database schema sync..."
./node_modules/.bin/drizzle-kit push --force

echo "Starting server..."
node dist/index.cjs

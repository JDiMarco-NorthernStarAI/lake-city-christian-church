#!/bin/bash
set -e

echo "Running database schema sync..."
npx drizzle-kit push --force

echo "Starting server..."
node dist/index.cjs

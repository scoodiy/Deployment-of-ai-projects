#!/bin/bash
set -e

echo "Initializing database..."

# Wait for postgres
until docker exec postgres pg_isready -U postgres; do
  echo "Waiting for postgres..."
  sleep 2
done

# Create database
docker exec postgres psql -U postgres -c "CREATE DATABASE quantbot;" 2>/dev/null || true

echo "Database initialized."

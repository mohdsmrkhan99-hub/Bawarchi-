#!/usr/bin/env bash
set -e

cd /workspaces/Bawarchi-/bawarchi-app

echo "===== STARTING BAWARCHI ====="

echo "Starting PostgreSQL..."
if docker inspect bawarchi-postgres >/dev/null 2>&1; then
    docker start bawarchi-postgres >/dev/null 2>&1 || true
else
    echo "ERROR: bawarchi-postgres container does not exist."
    echo "Do NOT create a new database automatically."
    exit 1
fi

echo "Waiting for PostgreSQL..."
for i in {1..20}; do
    if docker exec bawarchi-postgres pg_isready -U postgres >/dev/null 2>&1; then
        echo "PostgreSQL: READY"
        break
    fi
    sleep 1
done

echo "Generating Prisma client..."
npx prisma generate

echo "Clearing Next.js development cache..."
rm -rf .next

echo "Starting Bawarchi..."
npm run dev

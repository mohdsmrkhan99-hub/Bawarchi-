#!/usr/bin/env bash
set -e

ROOT="/workspaces/Bawarchi-"
APP="$ROOT/bawarchi-app"
STAMP=$(date +%Y%m%d-%H%M%S)

cd "$ROOT"

echo "======================================"
echo " NEW BAWARCHI — SAFE SAVE"
echo "======================================"

echo "[1/6] Creating filesystem backup..."
BACKUP="$ROOT/bawarchi-safe-backup-$STAMP"
mkdir -p "$BACKUP"

rsync -a \
  --exclude=node_modules \
  --exclude=.next \
  --exclude=.git \
  "$APP/" "$BACKUP/bawarchi-app/"

echo "Backup: $BACKUP"

echo "[2/6] Checking Git status..."
git status --short

echo "[3/6] Saving ALL current source changes..."
git add -A

if git diff --cached --quiet; then
  echo "No new Git changes to commit."
else
  git commit -m "chore: save current Bawarchi application state"
fi

echo "[4/6] Validating Prisma..."
cd "$APP"
npx prisma validate
npx prisma generate

echo "[5/6] Typecheck + lint..."
npm run typecheck
npm run lint

echo "[6/6] Production build..."
npm run build

echo ""
echo "======================================"
echo " BAWARCHI SAFE SAVE COMPLETE"
echo "======================================"
echo ""
echo "Git commit:"
cd "$ROOT"
git log -1 --oneline

echo ""
echo "Backup:"
echo "$BACKUP"

echo ""
echo "IMPORTANT:"
echo "Your current working application is now saved."
echo "Do NOT reset, checkout, or delete anything."

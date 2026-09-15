#!/usr/bin/env bash
set -u

APP="/workspaces/Bawarchi-/bawarchi-app"
OUT="/tmp/bawarchi-batch1-audit.txt"

cd "$APP" || exit 1

{
echo "===== BAWARCHI BATCH 1 AUDIT ====="
date
echo

echo "===== GIT ====="
git -C /workspaces/Bawarchi- status --short
git -C /workspaces/Bawarchi- log -5 --oneline
echo

echo "===== DATABASE ====="
docker ps --filter "name=bawarchi-postgres" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
npx prisma validate 2>&1
echo

echo "===== PRISMA MODELS ====="
grep -E '^model ' prisma/schema.prisma 2>/dev/null || true
echo

echo "===== ROUTES ====="
find app -type f \( -name 'page.tsx' -o -name 'route.ts' -o -name 'actions.ts' \) | sort
echo

echo "===== TABLE/ORDER/KITCHEN/DASHBOARD REFERENCES ====="
grep -RniE \
'prisma\.(table|order|orderItem|kitchen|kot|branch|floor|section)|createOrder|updateOrder|placeOrder|send.*kitchen|status|tableId|floorId|sectionId' \
app lib --include='*.ts' --include='*.tsx' 2>/dev/null | head -500
echo

echo "===== TABLE FILES ====="
find app/tables -type f -maxdepth 3 -print 2>/dev/null
echo

echo "===== ORDER FILES ====="
find app/orders -type f -maxdepth 3 -print 2>/dev/null
echo

echo "===== KITCHEN FILES ====="
find app/kitchen -type f -maxdepth 3 -print 2>/dev/null
echo

echo "===== DASHBOARD ====="
find app -maxdepth 2 -type f -path '*/page.tsx' -print | sort | head -100
echo

echo "===== API ====="
find app/api -type f -name 'route.ts' -print 2>/dev/null | sort
echo

echo "===== PACKAGE SCRIPTS ====="
node -e "console.log(require('./package.json').scripts)"
echo

echo "===== TYPECHECK ====="
npm run typecheck 2>&1 | tail -80
echo

echo "===== LINT ====="
npm run lint 2>&1 | tail -80

echo
echo "===== AUDIT COMPLETE ====="
echo "REPORT=$OUT"

} > "$OUT" 2>&1

cat "$OUT"

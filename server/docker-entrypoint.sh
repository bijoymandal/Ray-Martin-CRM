#!/bin/sh
set -e

echo "[Entrypoint] Ensuring Prisma client is generated..."
npx prisma generate

echo "[Entrypoint] Synchronizing Prisma schema with MongoDB..."
npx prisma db push --skip-generate

exec "$@"

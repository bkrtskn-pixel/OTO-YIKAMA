#!/usr/bin/env bash
# Codespace ilk açılışta bir kez çalışır: bağımlılıklar, ortam dosyaları, veritabanı.
set -euo pipefail

npm install -g pnpm@9.15.9
pnpm install

[ -f apps/api/.env ] || cp apps/api/.env.example apps/api/.env
[ -f apps/web/.env.local ] || cp apps/web/.env.example apps/web/.env.local

pnpm --filter @kuzhan/shared build
pnpm --filter @kuzhan/api db:generate

# PostgreSQL konteynerinin hazır olmasını bekle
for i in $(seq 1 30); do
  if node -e "require('net').connect(5432,'127.0.0.1').on('connect',()=>process.exit(0)).on('error',()=>process.exit(1))"; then break; fi
  sleep 1
done

pnpm db:deploy
pnpm db:seed

echo ""
echo "Kurulum tamam. Uygulamayı başlatmak için terminale yazın:  pnpm dev"
echo "Ardından 'Ports' sekmesinden 3000 numaralı portu açın (site: /, panel: /panel)."

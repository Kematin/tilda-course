#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "Нет файла .env. Выполните: cp .env.example .env" >&2
  exit 1
fi

if grep -q 'CHANGE_ME' .env; then
  echo "Заполните COURSE_PASSWORD_HASH в .env." >&2
  exit 1
fi

docker compose config --quiet
docker compose pull
docker compose up -d
docker compose ps

domain="$(sed -n 's/^COURSE_DOMAIN=//p' .env | tail -n 1)"
port="$(sed -n 's/^COURSE_PORT=//p' .env | tail -n 1)"
port="${port:-8080}"

echo "Caddy доступен для Nginx: http://127.0.0.1:${port}"
echo "После подключения Nginx курс будет доступен: https://${domain}"

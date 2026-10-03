#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")/.."

docker compose config --quiet
docker compose exec -T caddy caddy validate --config /etc/caddy/Caddyfile

domain="$(sed -n 's/^COURSE_DOMAIN=//p' .env | tail -n 1)"
port="$(sed -n 's/^COURSE_PORT=//p' .env | tail -n 1)"
port="${port:-8080}"
direct_status="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 15 "http://127.0.0.1:${port}/")"
external_status="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 15 "https://${domain}/")"

if [ "$direct_status" != "401" ]; then
  echo "Caddy на 127.0.0.1:${port}: ожидался HTTP 401, получен ${direct_status}." >&2
  exit 1
fi

if [ "$external_status" != "401" ]; then
  echo "Nginx на https://${domain}/: ожидался HTTP 401, получен ${external_status}." >&2
  exit 1
fi

echo "Цепочка Nginx → Caddy и защита паролем работают: получен HTTP 401."

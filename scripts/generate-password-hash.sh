#!/usr/bin/env sh
set -eu

echo "Введите пароль ученика дважды. Ввод не будет отображаться."
docker run --rm -it caddy:2.11.6-alpine caddy hash-password

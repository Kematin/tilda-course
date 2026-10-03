# Развёртывание курса на coolaf.online

Схема запуска: публичный Nginx завершает HTTPS и проксирует запросы в контейнер Caddy на `127.0.0.1:8080`. Caddy раздаёт страницы и видео, а HTTP Basic Auth закрывает весь курс одним логином и паролем.

> Важно: `localStorage` привязан к адресу сайта. После перехода с GitHub Pages на `coolaf.online` прогресс и выбранная тема начнут сохраняться заново; браузер не разрешает новому домену прочитать данные старого домена.

## 1. DNS и сеть

На момент подготовки проекта `coolaf.online` имеет A-запись `130.17.14.24`. Убедитесь, что это публичный IP нужного сервера.

На сервере должны быть доступны входящие порты Nginx:

- TCP 80 — выпуск сертификата и перенаправление на HTTPS;
- TCP 443 — HTTPS;

Caddy не занимает публичные порты. Docker публикует его только на `127.0.0.1:8080`, поэтому обратиться к нему извне сервера нельзя.

Внутри контейнера Caddy всегда слушает порт `8080`. Если нужен другой локальный порт, например `8359`, меняйте только `COURSE_PORT=8359` в `.env` и тот же порт в `proxy_pass` Nginx. Строку `:8080` в `Caddyfile` менять не нужно.

## 2. Подготовка проекта

На сервере установите Docker Engine и Docker Compose Plugin, затем скопируйте проект в `/home/www/course-tilda`.

Из корня проекта на локальном компьютере выполните:

```bash
ssh www@coolaf.online 'mkdir -p /home/www/course-tilda'
scp -rp Caddyfile compose.yaml DEPLOY.md .env.example .gitignore deploy public scripts videos www@coolaf.online:/home/www/course-tilda/
```

`scp` показывает прогресс каждого файла в интерактивной консоли. Команда предполагает, что `www` — SSH-пользователь, а `coolaf.online` — имя сервера. Локальный `.env` намеренно не отправляется.

```bash
cd /home/www/course-tilda
cp .env.example .env
./scripts/generate-password-hash.sh
```

Скрипт напечатает хеш. Откройте `.env` и вставьте хеш между одинарными кавычками:

```dotenv
COURSE_DOMAIN=coolaf.online
COURSE_PORT=8080
COURSE_USER=student
COURSE_PASSWORD_HASH='$2a$14$...'
```

Если выбран `COURSE_PORT=8359`, upstream в Nginx должен выглядеть так:

```nginx
proxy_pass http://127.0.0.1:8359;
```

Файл `.env` исключён из Git. Не публикуйте его и не храните в нём обычный пароль.

## 3. Видео

Видео и материалы уже находятся в корневом каталоге `videos/`. Он подключается в контейнер отдельно и доступен сайту по URL `/videos/`, но полностью исключён из Git.

Рекомендуемая структура для новых файлов:

```text
videos/
├── module-1/
│   ├── lesson-1.mp4
│   └── lesson-2.mp4
└── module-2/
    └── lesson-1.mp4
```

Затем укажите путь внутри `videos/` в `public/js/course-data.js` через функцию `lesson(...)`:

```js
lesson("lesson-95", "95. Новый урок", "module-9/lesson-95.mp4")
```

MP4 желательно подготовить с H.264/AAC и `faststart`:

```bash
ffmpeg -i input.mp4 -c copy -movflags +faststart output.mp4
```

Если браузер не поддерживает исходный кодек:

```bash
ffmpeg -i input.mp4 -c:v libx264 -crf 24 -preset medium -c:a aac -b:a 128k -movflags +faststart output.mp4
```

## 4. Запуск Caddy

```bash
./scripts/start.sh
```

Проверьте локальный upstream. Ответ `401 Unauthorized` означает, что Caddy работает и запрашивает пароль:

```bash
curl -I http://127.0.0.1:8080/
```

## 5. Подключение к Nginx

Готовый virtual host находится в `deploy/nginx/coolaf.online.conf`. Если для `coolaf.online` уже существует HTTPS-конфигурация, не заменяйте её целиком: перенесите в существующий `server` только блок `location /`.

В новом virtual host проверьте пути к сертификатам, затем:

```bash
sudo cp deploy/nginx/coolaf.online.conf /etc/nginx/sites-available/coolaf.online.conf
sudo ln -s /etc/nginx/sites-available/coolaf.online.conf /etc/nginx/sites-enabled/coolaf.online.conf
sudo nginx -t
sudo systemctl reload nginx
```

Если symlink уже существует, повторно создавать его не нужно. Если сертификата ещё нет, сначала выпустите его вашим текущим способом управления сертификатами Nginx, затем включайте HTTPS-конфигурацию.

Nginx передаёт заголовок авторизации и Range-запросы. Это сохраняет вход по паролю и перемотку MP4 без проксирования Caddy в публичную сеть.

Конфигурация рассчитана на Nginx, установленный непосредственно на сервере. Если Nginx тоже работает в Docker, `127.0.0.1` внутри его контейнера указывает не на хост: подключите оба сервиса к общей Docker-сети и используйте `proxy_pass http://caddy:8080`.

Просмотр логов:

```bash
docker compose logs -f caddy
```

Проверка Caddy, всей цепочки Nginx → Caddy, HTTPS и Basic Auth:

```bash
./scripts/check.sh
```

Обновление страниц или данных курса не требует пересборки контейнера: каталог `public/` подключён read-only. После изменения достаточно обновить страницу в браузере. При изменении `Caddyfile` выполните:

```bash
docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile
```

## 6. Остановка и откат

Остановить сайт без удаления сертификатов:

```bash
docker compose down
```

Чтобы полностью откатить подключение курса, сначала удалите или отключите добавленный virtual host Nginx, выполните `sudo nginx -t` и перезагрузите Nginx. Другие сайты и сертификаты при этом не изменяются.

Откат не уничтожает данные: страницы остаются в `public/`, видео и материалы — в `videos/`, а команды запуска их не изменяют.

## Практические задания

Все задания находятся в `public/js/course-data.js` внутри соответствующего модуля:

```js
assignment: {
  title: "Название задания",
  description: "Что нужно сделать",
  images: [
    {
      src: "./assets/assignments/module-1-example.jpg",
      alt: "Описание изображения для доступности",
      caption: "Необязательная подпись"
    }
  ]
}
```

Изображения кладите в `public/assets/assignments/`. Для нескольких изображений добавьте несколько объектов в `images`.

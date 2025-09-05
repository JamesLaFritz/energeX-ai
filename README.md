# energeX-ai

A tiny, production-style stack that demonstrates a JWT-secured API in **Lumen (PHP)**, a **Node.js (TypeScript)** read-through cache using **Redis**, **MySQL** for persistence, an **Nginx** edge, and a minimal **React** frontend. Includes Docker Compose, unit/integration tests, and API docs (Swagger & Postman).

## Architecture at a glance

```
+-------------+        +------------+         +-----------+
|  Frontend   |  --->  |   Nginx    |  --->   |  Lumen    |
|  (React)    |        | (8080)     |         |  API (PHP)|
+------+------+        +------+-----+         +-----+-----+
       |                       |                    |
       |                       |                    |  JWT / MySQL
       |   (optional)          |                    v
       |  /docs proxy          |             +-------------+
       |  to Swagger UI        |             |   MySQL     |
       v                       |             +-------------+
+------+------+                |
| Swagger UI |  <--------------+   (also exposed directly on 8081 if enabled)
+------------+                 |
                               |
                               |  (optional cache reads)
                               v
                     +---------+---------+       +-------------+
                     |  cache-node (TS)  | <---> |   Redis     |
                     |  /cache/* on 4000 |       +-------------+
                     +-------------------+
```

---

## Repository Layout

> Tip: PHP tests live inside `backend-php/` so PHPUnit can find them via PSR-4 autoloading.

```
energeX-ai/
  backend-php/                     # Lumen (PHP 8.2 FPM) app
    app/
      Exceptions/                  # Global exception handler
      Http/
        Controllers/
          AuthController.php       # /api/register, /api/login (JWT)
          PostController.php       # /api/posts CRUD + cache busting
          Controller.php           # Base controller
        Middleware/
          Authenticate.php         # JWT auth middleware
          Cors.php                 # CORS for the API
      Models/
        Post.php                   # Eloquent Post model (+ user relation)
        User.php                   # Eloquent User model (JWT auth)
    bootstrap/app.php              # Lumen bootstrapping/config wiring
    config/                        # cache.php, database.php, auth.php, etc.
    database/
      migrations/
        2025_01_01_000000_create_users_table.php
        2025_01_01_000001_create_posts_table.php
        2025_09_03_000002_add_timestamps_to_users_table.php
        2025_09_03_105206_add_timestamps_to_posts_table.php
      seeders/DatabaseSeeder.php   # Optional demo data
    routes/web.php                 # Defines /api/* routes
    tests/                         # ✅ PHPUnit test suite (PSR-4: Tests\)
      Feature/
        AuthTest.php               # Register → Login → JWT token
        PostCacheTest.php          # Cache warm/bust + TTL assertions
      TestCase.php                 # Base test class
    composer.json                  # PHP deps & autoload (incl. Tests\ mapping)
    phpunit.xml                    # PHPUnit config (env + test discovery)
    Dockerfile                     # PHP-FPM image for Lumen
    .env                           # App env (used by container)

  cache-node/                      # Node + TypeScript cache microservice
    src/
      app.ts                       # Express app, routes & CORS
      db.ts                        # MySQL pool (mysql2)
      redis.ts                     # Redis client & helpers
      server.ts                    # Server bootstrap (listens on PORT)
      index.ts                     # Entry for dev (ts-node-dev)
      types.ts                     # Shared types (Zod schemas, etc.)
    tests/                         # ✅ Jest tests (ts-jest)
      health.test.ts               # /cache/health
      posts.cache.test.ts          # /cache/posts hit/miss behavior
      posts.byId.test.ts           # /cache/posts/:id hit/miss/404
    package.json                   # Node deps & scripts
    tsconfig.json                  # TS build options
    tsconfig.jest.json             # TS transform for Jest
    Dockerfile                     # Node 20 Alpine build (prunes dev deps)
    .env                           # Service env (PORT, REDIS_URL, etc.)

  frontend/                        # React + Vite minimal UI
    src/
      api/client.ts                # Axios client (baseURL, auth header)
      auth/AuthContext.tsx         # JWT in context/localStorage
      components/NavBar.tsx
      pages/                       # Screens: Login, Register, PostList, NewPost
        Login.tsx
        Register.tsx
        PostList.tsx
        NewPost.tsx
      types.ts
      App.tsx
      main.tsx
    index.html
    package.json
    tsconfig.json
    vite.config.ts
    Dockerfile
    .env                           # FRONTEND_* + API base URLs

  docs/                            # API documentation
    openapi.yaml                   # Swagger/OpenAPI 3.1 spec
    postman_collection.json        # Postman collection (importable)

  infra/                           # Ops: local dev with Docker Compose
    docker-compose.yml             # mysql, redis, php, nginx, cache-node, swagger
    nginx/
      default.conf                 # Nginx vhost (PHP-FPM, optional /docs proxy)

  .gitignore                       # Project ignores (node, php, IDE, env, build)
  README.md                        # (you’re here)
```

---

## Quickstart

1. **Environment files**

* `backend-php/.env` (copy from example if you add one)

    * `APP_KEY` not strictly required for Lumen; **`JWT_SECRET` is required**
      Generate:

      ```bash
      openssl rand -hex 64
      # or in the container: php -r "echo bin2hex(random_bytes(64)), PHP_EOL;"
      ```
* `cache-node/.env` (used by the container)

  ```
  PORT=4000
  CACHE_TTL_SECONDS=3600
  CACHE_PREFIX=lumen_cache
  REDIS_URL=redis://redis:6379
  MYSQL_HOST=mysql
  MYSQL_PORT=3306
  MYSQL_USER=appuser
  MYSQL_PASSWORD=appsecret
  MYSQL_DB=app
  FRONTEND_ORIGIN=http://localhost:5173
  ```
* `frontend/.env`

  ```
  VITE_LUMEN_BASE=http://localhost:8080/api
  VITE_CACHE_BASE=http://localhost:4000/cache
  ```

2. **Bring up the stack**

```bash
cd infra
docker compose up -d
```

* App (Lumen): [http://localhost:8080](http://localhost:8080) (`/api/*`)
* Cache (Node): [http://localhost:4000](http://localhost:4000) (`/cache/*`)
* Frontend: [http://localhost:5173](http://localhost:5173)
* (Optional) Swagger UI:

    * **Zero-port option (recommended):** [http://localhost:8081](http://localhost:8081) (see Swagger section)
    * Or proxy at **[http://localhost:8080/docs/](http://localhost:8080/docs/)** via Nginx (see notes)

---

## Endpoints

**Lumen (JWT)**

* `POST /api/register`
* `POST /api/login` → `{ token }`
* `GET /api/posts` *(Authorization: Bearer …)*
* `POST /api/posts` *(Authorization: Bearer …)*

**cache-node (read-through cache)**

* `GET /cache/health`
* `GET /cache/posts`
* `GET /cache/posts/:id`

**Caching strategy**

* List key: `lumen_cache:posts:all`
* Item key: `lumen_cache:posts:id:{id}`
* TTL: **60s** on Lumen (example) / **configurable** on Node (`CACHE_TTL_SECONDS`)
* Bust on create/update/delete (Lumen calls `Cache::forget` on both keys)

---

## Running tests

### PHP (PHPUnit) inside the container

```bash
# from ./infra
docker compose exec -w /var/www/html php bash -lc "composer dump-autoload && vendor/bin/phpunit --testdox"
# filter by test case
docker compose exec -w /var/www/html php bash -lc "vendor/bin/phpunit --filter PostCacheTest --testdox"
```

### Node (Jest) on host

```bash
cd cache-node
npm test
```

> The runtime container prunes devDeps; run Node tests on host or in a one-off:
> `docker compose run --rm cache-node sh -lc "npm ci && npm test"`

---

## API Documentation

A short video showcasing and explaining my solution [Watch(Provided By Loom)](https://democreator.wondershare.com/app/preview?id=c6f70859-c8ac-4810-a27a-21cfd00e66e1)

### Swagger / OpenAPI

You have two ways to serve Swagger UI:

**A) Dedicated port (simplest, avoids Nginx proxy quirks)**

```yaml
# infra/docker-compose.yml
swagger:
  image: swaggerapi/swagger-ui
  container_name: energex_swagger
  ports: ["8081:8080"]
  environment:
    SWAGGER_JSON: /usr/share/nginx/html/openapi.yaml
  volumes:
    - ../docs/openapi.yaml:/usr/share/nginx/html/openapi.yaml:ro
```

* Open **[http://localhost:8081](http://localhost:8081)**
* If you still see the **“Swagger Petstore”** example, it means the UI loaded its default spec. Use:
  **[http://localhost:8081/?url=/openapi.yaml](http://localhost:8081/?url=/openapi.yaml)**
  (or check the `SWAGGER_JSON` env and file mount path)
* Use the **Servers** dropdown to switch between:

    * `http://localhost:8080` (Lumen `/api/*`)
    * `http://localhost:4000` (cache-node `/cache/*`)
* Click **Authorize** → choose `bearerAuth` → paste **the raw JWT** (no `Bearer ` prefix; Swagger adds it).

**B) Proxy behind Nginx at `/docs/` (optional)**

```nginx
# infra/nginx/default.conf
location /docs/ {
  proxy_pass http://swagger:8080/;
}
```

> If Nginx logs `host not found in upstream "swagger"`, ensure the `swagger` service exists in `docker-compose.yml` and both services share the same Compose project/network. Also restart Nginx **after** Swagger is started.

### Postman

I have posted it already at [energeX API](https://documenter.getpostman.com/view/48187666/2sB3HkpLEF)

If you would like to do it yourself for this or your own app here's how.

* Import `docs/postman_collection.json`
* Optional environment: [Select a Postman Agent for requests](https://learning.postman.com/docs/getting-started/basics/about-postman-agent/#select-a-postman-agent-for-requests)
  * Desktop Agent - (Recommended) Send requests using the Postman Desktop Agent app. 

* Requests:

    * `POST {{lumen_base}}/api/login` → copy `token`
    * Add header `Authorization: Bearer {{token}}`
    * `GET {{lumen_base}}/api/posts`
    * `GET {{cache_base}}/cache/posts`

---

## Development workflow

* **PHP autoload (tests):** ensure `composer.json` has:

  ```json
  "autoload-dev": { "psr-4": { "Tests\\": "tests/" } }
  ```

  Then run `composer dump-autoload` (the container command above does this).
* **Frontend:** Vite dev server not used here; the container serves the static build on port 5173.
* **Cache-node:** `npm run dev` for local dev (ts-node-dev), container uses `npm run build` → `node dist/server.js`.

---

## Troubleshooting

* **401 / “Wrong number of segments” (JWT):** missing/invalid `Authorization: Bearer <token>`.
* **`cache-node` “ECONNREFUSED redis:6379”:** check `REDIS_URL=redis://redis:6379` in `cache-node/.env` and that the service name is `redis` in Compose.
* **`cache-node` not listening on 4000:** confirm `server.ts` calls `app.listen(PORT)` and env `PORT=4000` is present at runtime.
* **Swagger shows “Petstore”:** pass `?url=/openapi.yaml` in the UI URL or set `SWAGGER_JSON` env; verify the bind mount path is correct.
* **PHPUnit can’t find tests / PSR-4 warnings:** move tests under `backend-php/tests`, keep `namespace Tests\Feature;` and run from `/var/www/html`.

---

## Security notes (demo)

* JWTs are stored client-side for convenience (localStorage). For real apps prefer HTTP-only cookies and CSRF protection.
* CORS is open to the dev frontend origin; tighten as needed.
* Do not commit real secrets (`.env` is ignored). Use Docker secrets or a vault in production.

---

## License

MIT (or your preferred license)

---
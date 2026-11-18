# ShopSphere — full-stack ecommerce (React + Redux, Spring Boot, MySQL, Docker)

A complete, runnable store: product catalogue with search/filter/sort/pagination, cart, JWT login,
checkout, order history and an admin area for products and orders.

## Run it (one command)

Requires Docker Desktop / Docker Engine with Compose v2.

```bash
docker compose up --build
```

| What        | URL                                   |
|-------------|---------------------------------------|
| Store       | http://localhost:3000                 |
| API         | http://localhost:8080/api/products    |
| Health      | http://localhost:8080/actuator/health |
| MySQL (host)| localhost:3307  (user `shop` / `shop_pass`, db `shopsphere`) |

First start takes a few minutes (Maven + npm downloads). The database is seeded automatically.

| Role  | Email                    | Password   |
|-------|--------------------------|------------|
| Admin | admin@shopsphere.com     | Admin@123  |
| User  | user@shopsphere.com      | User@1234  |

Stop with `docker compose down` (data kept) or `docker compose down -v` (wipe the database).

## Develop without rebuilding images

```bash
docker compose up -d mysql          # only the database (make db)
cd backend  && mvn spring-boot:run  # API on :8080   (make backend)
cd frontend && npm install && npm run dev   # UI on :5173, /api is proxied to :8080   (make frontend)
```

Needs JDK 17+, Maven 3.9+, Node 20+.

## Folder structure

```
shopsphere/
├── docker-compose.yml          mysql + backend + frontend
├── .env.example                optional overrides (passwords, JWT secret, ports)
├── Makefile                    shortcuts: up, down, db, backend, frontend, test
├── .github/workflows/ci.yml    CI: test backend, build frontend, build/push Docker images
├── backend/                    Spring Boot 3.3 · Java 17 · Maven
│   ├── Dockerfile              multi-stage build, non-root runtime
│   ├── pom.xml
│   └── src/main/java/com/shopsphere/
│       ├── config/             SecurityConfig (filter chain, CORS, BCrypt), DataSeeder (demo data)
│       ├── security/           JwtService, JwtAuthFilter, CustomUserDetailsService
│       ├── entity/             User, Category, Product, Order, OrderItem (+ enums)
│       ├── repository/         Spring Data JPA repositories
│       ├── service/            AuthService, ProductService, OrderService (business rules)
│       ├── controller/         Auth, Product, Order, Admin REST controllers
│       ├── dto/ util/          request/response records, entity→DTO mapper
│       └── exception/          ApiException + GlobalExceptionHandler (uniform JSON errors)
└── frontend/                   React 18 · Vite · Redux Toolkit · React Router 6 · Axios
    ├── Dockerfile, nginx.conf  static build served by nginx, /api proxied to the backend
    └── src/
        ├── app/store.js        Redux store + localStorage persistence (session, cart)
        ├── features/           auth, cart, products, orders slices (state + async thunks)
        ├── api/axios.js        API client: adds the JWT, redirects to /login on 401
        ├── components/         Navbar, ProductCard, ProductImage, Pagination, ProtectedRoute
        └── pages/              Home, ProductDetails, Cart, Checkout, Orders, Login, Register, Admin
```

## How the pieces work

**Authentication (Spring Security + JWT).** `POST /api/auth/login` checks the password with
`AuthenticationManager` (BCrypt) and returns a signed JWT. The React app stores it and sends
`Authorization: Bearer <token>` on every call (`api/axios.js`). `JwtAuthFilter` validates the
token and loads the user; `SecurityConfig` decides who may reach what:

| Route                                   | Access        |
|-----------------------------------------|---------------|
| `POST /api/auth/register`, `/login`     | public        |
| `GET /api/products`, `/products/{id}`, `/categories` | public |
| `POST /api/orders`, `GET /api/orders/my`, `GET /api/auth/me` | signed-in user |
| `/api/admin/**` (product CRUD, all orders, status changes) | `ROLE_ADMIN` |

Public registration always creates a `USER`; the admin is created by the seeder.

**Ordering.** The cart lives in Redux (and localStorage). On checkout only product ids and
quantities are sent. `OrderService.place` re-reads price and stock from MySQL inside one
transaction with row locks, so a tampered cart cannot change the price and the last item cannot be
sold twice. Cancelling an order restores stock.

**Images.** Product photos are hot-linked from Unsplash (see `DataSeeder`). If a link ever
fails, `ProductImage` swaps in a placeholder, so the UI never shows a broken image. Admins can
paste any image URL when adding products.

## Environment variables

Set in `.env` (see `.env.example`) or directly on the backend container.

| Variable | Default | Purpose |
|----------|---------|---------|
| `SPRING_DATASOURCE_URL/USERNAME/PASSWORD` | local MySQL on 3307 | database connection |
| `JWT_SECRET` | dev key in repo | Base64, ≥ 32 bytes. **Change for any real deployment** (`openssl rand -base64 48`) |
| `JWT_EXPIRATION_MS` | 86400000 | token lifetime (24 h) |
| `CORS_ALLOWED_ORIGINS` | localhost:5173,3000 | only matters when UI and API are on different origins |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | admin@shopsphere.com / Admin@123 | seeded admin |
| `VITE_API_URL`, `VITE_CURRENCY` (frontend) | `/api`, `USD` | API base URL, price currency |

## DevOps

* **Docker:** both images are multi-stage (build tools never reach the runtime image); the Spring
  Boot container runs as a non-root user; MySQL has a health check and the API waits for it.
* **CI/CD (`.github/workflows/ci.yml`):** on every push/PR it runs `mvn verify` (includes the JWT
  unit tests), builds the frontend, and builds both Docker images. On `main` it also pushes them to
  GitHub Container Registry (`ghcr.io/<owner>/<repo>/backend|frontend`, tagged `latest` and the commit SHA).
* **Deploying:** copy `docker-compose.yml` and a real `.env` to a server and run
  `docker compose pull && docker compose up -d` after pointing the `build:` entries at your
  registry images, or run the same images on any container platform. Put a TLS-terminating proxy
  (Caddy, Traefik, nginx, a cloud load balancer) in front of the `frontend` container.

## Before going to production

* Replace the default passwords and `JWT_SECRET`; remove the demo credentials hint in `pages/Login.jsx`.
* Switch `spring.jpa.hibernate.ddl-auto` from `update` to `validate` and manage the schema with Flyway.
* Don't publish MySQL's port (remove the `3307:3306` mapping).
* Payments are cash-on-delivery in this project. To take cards, add Stripe (or similar) on the
  server in `OrderService` and mark orders `PAID` from its webhook.
* Add rate limiting on `/api/auth/**` and consider refresh tokens / HttpOnly cookies instead of localStorage.

## Troubleshooting

* *Port 3000/8080/3307 already in use* — set `WEB_PORT` / `MYSQL_PORT` in `.env`, or stop the other service.
* *Backend restarts at first start* — MySQL is still initialising; Compose retries automatically.
* *Product images missing* — the machine can't reach images.unsplash.com; placeholders from picsum.photos are used instead.

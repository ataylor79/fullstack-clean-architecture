# Workout App API

REST API for managing workouts, sets, and exercises. Built with Express, TypeScript, PostgreSQL, and Knex.

## Prerequisites

- Node.js 20+
- pnpm
- PostgreSQL 14+

## Getting started

### 1. Install dependencies

From the monorepo root:

```bash
pnpm install
```

### 2. Create a database

```sql
CREATE DATABASE workout;
CREATE DATABASE workout_test;
CREATE USER workout WITH PASSWORD 'workout';
GRANT ALL PRIVILEGES ON DATABASE workout TO workout;
GRANT ALL PRIVILEGES ON DATABASE workout_test TO workout;
```

### 3. Configure environment variables

Copy the example file and fill in values:

```bash
cp .env.example .env
```

| Variable           | Required         | Description                                                    |
| ------------------ | ---------------- | -------------------------------------------------------------- |
| `PORT`             | No (default 3000) | Port the server listens on                                    |
| `DATABASE_URL`     | Yes              | Postgres connection string for development                     |
| `TEST_DATABASE_URL`| No               | Postgres connection string for tests (defaults to `workout_test`) |
| `ACCESS_TOKEN_SECRET` | Yes (prod)    | Secret used to sign JWTs. Any random string in development.   |
| `NODE_ENV`         | No               | `development`, `test`, or `production`                         |
| `RESEND_API_KEY`   | Yes (prod)       | [Resend](https://resend.com) API key for sending emails        |
| `EMAIL_FROM_DOMAIN`| No               | Sender domain for emails (e.g. `yourapp.com`)                 |
| `APP_URL`          | No               | Base URL included in email links (e.g. `https://yourapp.com`) |
| `CORS_ORIGIN`      | No               | Comma-separated list of allowed origins in production          |

In development, emails are not sent — verification and password reset tokens are captured in memory and logged to no-op stubs.

### 4. Run migrations and seed

```bash
pnpm db:migrate
pnpm db:seed    # seeds the exercises reference table
```

### 5. Start the development server

```bash
pnpm dev
```

The API runs at `http://localhost:3000`. Interactive API docs are at `http://localhost:3000/docs`.

---

## Commands

| Command           | Description                                      |
| ----------------- | ------------------------------------------------ |
| `pnpm dev`        | Start dev server with hot reload (`tsx watch`)   |
| `pnpm build`      | Compile TypeScript to `dist/`                    |
| `pnpm start`      | Run the compiled build                           |
| `pnpm test`       | Run all tests (single pass)                      |
| `pnpm test:watch` | Run tests in watch mode                          |
| `pnpm typecheck`  | Type-check without emitting files                |
| `pnpm db:migrate` | Run pending migrations                           |
| `pnpm db:rollback`| Roll back the last migration batch               |
| `pnpm db:seed`    | Seed the database with reference data            |

---

## Architecture

```
src/
├── application/       # Use cases (pure business logic, no framework deps)
│   └── usecases/
│       ├── auth/
│       ├── workouts/
│       └── sets/
├── domain/            # Entities, repository interfaces, service interfaces
│   ├── entities/
│   ├── repositories/
│   └── services/
├── infrastructure/    # DB, email, token utilities — implements domain interfaces
│   ├── auth/
│   ├── database/
│   │   ├── migrations/
│   │   └── seeds/
│   ├── email/
│   └── repositories/
├── presentation/      # Express routes, middleware, OpenAPI spec
│   ├── middleware/
│   ├── routes/
│   └── openapi.ts
└── tests/
    ├── helpers/
    ├── auth/
    ├── exercises/
    ├── middleware/
    └── workouts/
```

The codebase follows a layered architecture:

- **Domain** defines what the app knows (entities and interfaces), with no dependencies on any other layer.
- **Application** contains use cases that orchestrate domain logic. They depend only on domain interfaces.
- **Infrastructure** implements those interfaces using real tools (Postgres via Knex, Resend for email, argon2 for hashing).
- **Presentation** wires everything together into HTTP routes using Express.

---

## API overview

Full interactive docs at `/docs` when the server is running.

### Auth (`/auth`)

| Method | Path                        | Auth     | Description                                    |
| ------ | --------------------------- | -------- | ---------------------------------------------- |
| POST   | `/auth/register`            | —        | Register. Returns access token, sets refresh cookie. |
| POST   | `/auth/login`               | —        | Log in. Returns access token, sets refresh cookie.   |
| POST   | `/auth/refresh`             | Cookie   | Rotate refresh token, get new access token.    |
| POST   | `/auth/logout`              | Cookie   | Revoke refresh token.                          |
| GET    | `/auth/verify`              | —        | Verify email via `?token=` query param.        |
| POST   | `/auth/resend-verification` | Bearer   | Resend verification email.                     |
| GET    | `/auth/me`                  | Bearer   | Get current user profile.                      |
| POST   | `/auth/forgot-password`     | —        | Send password reset email.                     |
| POST   | `/auth/reset-password`      | —        | Reset password using token from email.         |

### Workouts (`/api/workouts`)

All routes require a valid Bearer token.

| Method | Path                                    | Description                        |
| ------ | --------------------------------------- | ---------------------------------- |
| GET    | `/api/workouts`                         | List authenticated user's workouts |
| POST   | `/api/workouts`                         | Create a workout (email must be verified) |
| GET    | `/api/workouts/:id`                     | Get workout with embedded sets     |
| PATCH  | `/api/workouts/:id`                     | Update workout                     |
| DELETE | `/api/workouts/:id`                     | Delete workout                     |
| POST   | `/api/workouts/:workoutId/sets`         | Add a set                          |
| PATCH  | `/api/workouts/:workoutId/sets/:setId`  | Update a set                       |
| DELETE | `/api/workouts/:workoutId/sets/:setId`  | Delete a set                       |

### Exercises (`/api/exercises`)

All routes require a valid Bearer token. Mutations (POST, PATCH, DELETE) additionally require `isAdmin: true`.

| Method | Path                    | Description          |
| ------ | ----------------------- | -------------------- |
| GET    | `/api/exercises`        | List all exercises   |
| GET    | `/api/exercises/:id`    | Get exercise by ID   |
| POST   | `/api/exercises`        | Create exercise (admin) |
| PATCH  | `/api/exercises/:id`    | Update exercise (admin) |
| DELETE | `/api/exercises/:id`    | Delete exercise (admin) |

---

## Authentication

The API uses a dual-token scheme:

- **Access token** — short-lived JWT (15 min), sent as `Authorization: Bearer <token>` header.
- **Refresh token** — long-lived (30 days), stored as an `httpOnly` cookie. Used to rotate to a new pair via `POST /auth/refresh`.

Refresh tokens are single-use (rotation on every refresh). Reusing an old token is detected and returns 401.

All tokens (refresh, email verification, password reset) are stored as SHA-256 hashes. Raw tokens are only ever transmitted to the client once.

---

## Testing

Tests use Vitest and Supertest against a real PostgreSQL database (`workout_test`). There are no mocks — all tests hit the actual DB.

```bash
pnpm test
```

Tests run sequentially (`fileParallelism: false`) to avoid DB conflicts. Each test truncates all tables in a `beforeEach` hook.

The email service is replaced with a no-op in test/development that stores sent tokens in memory. Tests retrieve them via `getCapturedToken(email)` and `getCapturedResetToken(email)` from `@infrastructure/email`.

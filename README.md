# Workout App

A full-stack workout tracking application. Log workouts, track sets and reps, and browse a shared exercise library.

## Packages

This is a pnpm monorepo with three packages:

| Package | Description |
| ------- | ----------- |
| `packages/api` | Express REST API — auth, workouts, sets, exercises |
| `packages/web` | React frontend — Vite, TanStack Router, TanStack Query, Tailwind |
| `packages/shared` | Shared TypeScript types consumed by both api and web |

## Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL 14+

## Getting started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set up the database

Create two databases — one for development and one for tests:

```sql
CREATE DATABASE workout;
CREATE DATABASE workout_test;
CREATE USER workout WITH PASSWORD 'workout';
GRANT ALL PRIVILEGES ON DATABASE workout TO workout;
GRANT ALL PRIVILEGES ON DATABASE workout_test TO workout;
```

### 3. Configure environment variables

```bash
cp packages/api/.env.example packages/api/.env
```

Edit `packages/api/.env` with your values. See [`packages/api/README.md`](packages/api/README.md) for the full variable reference.

### 4. Run migrations and seed

```bash
pnpm --filter @workout-app/api db:migrate
pnpm --filter @workout-app/api db:seed
```

### 5. Start everything

```bash
pnpm dev
```

This starts the API (port 3000) and the web frontend (port 5173) in parallel. The Vite dev server proxies `/api` requests to the API, so no CORS configuration is needed locally.

- Frontend: http://localhost:5173
- API: http://localhost:3000
- API docs (Swagger UI): http://localhost:3000/docs

---

## Commands

Run from the monorepo root:

| Command | Description |
| ------- | ----------- |
| `pnpm dev` | Start all packages in development mode |
| `pnpm build` | Build all packages |
| `pnpm test` | Run all tests |
| `pnpm typecheck` | Type-check all packages |
| `pnpm lint` | Lint with Biome |
| `pnpm format` | Format with Biome |
| `pnpm check:fix` | Lint and auto-fix with Biome |

To run a command in a single package:

```bash
pnpm --filter @workout-app/api <command>
pnpm --filter @workout-app/web <command>
```

---

## Stack

**API**
- [Express](https://expressjs.com) — HTTP framework
- [Knex](https://knexjs.org) — query builder and migrations
- [PostgreSQL](https://postgresql.org) — database
- [argon2](https://github.com/ranisalt/node-argon2) — password hashing
- [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) — JWT access tokens
- [Zod](https://zod.dev) — request validation
- [Resend](https://resend.com) — transactional email (verification, password reset)
- [Vitest](https://vitest.dev) + [Supertest](https://github.com/ladjs/supertest) — integration tests against a real DB

**Web**
- [React 18](https://react.dev)
- [Vite](https://vitejs.dev)
- [TanStack Router](https://tanstack.com/router) — file-based routing
- [TanStack Query](https://tanstack.com/query) — server state management
- [Tailwind CSS](https://tailwindcss.com)

**Shared**
- TypeScript types for `Workout`, `WorkoutSet`, and `Exercise` — imported by both api and web to keep the contract in sync

**Tooling**
- [pnpm workspaces](https://pnpm.io/workspaces) — monorepo package management
- [Biome](https://biomejs.dev) — linter and formatter (replaces ESLint + Prettier)
- [TypeScript](https://www.typescriptlang.org) across all packages

---

## Project structure

```
workout-app/
├── packages/
│   ├── api/          # REST API (see packages/api/README.md)
│   ├── web/          # React frontend
│   └── shared/       # Shared TypeScript types
├── package.json      # Root scripts and devDependencies
└── pnpm-workspace.yaml
```

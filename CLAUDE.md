# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Buffalo ("Bureau des Demandes Absurdes") is a playful internal request management system. It has a dual interface: users submit humorous requests, and admins manage/process them. The stack is a NestJS GraphQL API backed by MongoDB, with a React + Vite frontend using Apollo Client.

**Quick start**: `docker compose up --build`

- User UI: http://localhost:5173/user
- Admin UI: http://localhost:5173/admin (localhost-only access)
- GraphQL Playground: http://localhost:3000/graphql

## Development Commands

### Backend (`apps/backend/`)

```bash
npm run start:dev    # Watch mode (hot reload)
npm run build        # Compile TypeScript
npm run start        # Production start
```

### Frontend (`apps/frontend/`)

```bash
npm run dev          # Vite dev server on port 5173
npm run build        # tsc + vite build
npm run preview      # Preview production build
```

### Environment Variables

- Backend: `MONGO_URI` (default: `mongodb://localhost:27017/buffalo`)
- Frontend: `VITE_GRAPHQL_PROXY_TARGET` (default: `http://backend:3000`), `VITE_APP_NAME` (default: `"Buffalo"`)

## Architecture

### Monorepo Structure

```
apps/
  backend/   — NestJS GraphQL server (port 3000)
  frontend/  — React + Vite SPA (port 5173)
docker/      — Dockerfiles + MongoDB seed script
```

### Backend: Hexagonal / Clean Architecture

The entire domain lives in `apps/backend/src/modules/request/` organized in four layers:

| Layer | Path | Responsibility |
|---|---|---|
| Domain | `domain/` | Entities, enums, repository port (interface) |
| Application | `application/` | Use cases (CreateRequest, GetRequests, MarkRequestDone) |
| Infrastructure | `infrastructure/` | Mongoose schemas, repository adapter |
| Interface | `interfaces/graphql/` | Resolvers, GraphQL types, guards |

The `RequestRepositoryPort` interface decouples use cases from MongoDB. Use cases are injected via NestJS DI and called from the resolver.

GraphQL schema is **code-first** — decorators (`@ObjectType`, `@Field`, `@Resolver`) generate the schema at runtime.

### Frontend

```
src/
  pages/         — UserPage.tsx, AdminPage.tsx
  components/    — IdentifyForm, RequestForm, UserRequestsBadge, RequestList
  graphql/       — queries.ts, mutations.ts, subscriptions.ts
  themes.ts      — 5 theme definitions (random per session)
  config.ts      — App name and localStorage key constants
```

Apollo Client uses a **split link**: subscriptions go over WebSocket (`graphql-ws`), other operations over HTTP. Both routes proxy through Vite to the backend.

User identity is stored in `localStorage` (no backend auth). Admin access is enforced server-side by `LocalhostAdminGuard` (checks origin header + client IP).

### Real-time (GraphQL Subscriptions)

The admin page subscribes to `requestCreated` and `requestUpdated` events, which trigger refetches and browser notifications. Subscriptions use in-memory `PubSub` (single backend instance only — not suitable for horizontal scaling without replacement).

### Request Numbering

Request numbers are generated atomically using a `request-counters` MongoDB collection with `$inc`. This prevents duplicates under concurrent writes.

## Key Patterns

- **Guard-based admin auth**: `LocalhostAdminGuard` on resolver methods — origin and IP both validated.
- **Pagination**: Server-side; max 100 items per page enforced in the repository adapter.
- **Themes**: Random from a pool of 5, injected as CSS variables at the component level.
- **Subscription filtering**: `withFilter` from `graphql-subscriptions` used for user-specific subscription events.

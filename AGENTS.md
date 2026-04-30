# AGENTS.md

This file provides agent-oriented guidance for working in this repository.

## Overview

Buffalo ("Bureau des Demandes Absurdes") is a playful internal request management system. It has a dual interface: users submit humorous requests, and admins manage and process them. The stack is a NestJS GraphQL API backed by MongoDB, with a React + Vite frontend using Apollo Client.

Quick start: `docker compose up --build`

- User UI: http://localhost:5173/user
- Admin UI: http://localhost:5173/admin
- GraphQL Playground: http://localhost:3100/graphql

## Development Commands

### Backend (`apps/backend/`)

```bash
npm run start:dev
npm run build
npm run start
```

### Frontend (`apps/frontend/`)

```bash
npm run dev
npm run build
npm run preview
```

## Environment Variables

- Backend: `MONGO_URI` (default: `mongodb://localhost:27017/buffalo`), `PORT` (default: `3100`)
- Frontend: `VITE_GRAPHQL_PROXY_TARGET` (default: `http://backend:3100`), `VITE_APP_NAME` (default: `"Buffalo"`)

## Architecture

### Monorepo Structure

```text
apps/
  backend/   - NestJS GraphQL server (port 3100 by default)
  frontend/  - React + Vite SPA (port 5173)
docker/      - Dockerfiles and MongoDB seed script
```

### Backend

The main domain lives in `apps/backend/src/modules/request/` with four layers:

| Layer | Path | Responsibility |
|---|---|---|
| Domain | `domain/` | Entities, enums, repository port |
| Application | `application/` | Use cases |
| Infrastructure | `infrastructure/` | Mongoose schemas and repository adapter |
| Interface | `interfaces/graphql/` | Resolvers, GraphQL types, guards |

The GraphQL schema is code-first. Use cases are injected through NestJS DI and called from resolvers.

### Frontend

```text
src/
  pages/         - UserPage.tsx, AdminPage.tsx
  components/    - UI forms, badges, and request lists
  graphql/       - queries.ts, mutations.ts, subscriptions.ts
  themes.ts      - theme definitions
  config.ts      - app name and localStorage keys
```

Apollo Client uses a split HTTP and WebSocket setup via Vite proxying.

## Key Patterns

- Admin access is enforced server-side by `LocalhostAdminGuard`.
- Pagination is server-side with limits enforced in the repository adapter.
- GraphQL subscriptions use in-memory `PubSub`, so the current setup is single-instance only.
- Request numbers are generated atomically through MongoDB counters.

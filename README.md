# Buffalo - Bureau des Demandes Absurdes

Application interne ludique permettant de soumettre des demandes techniques cote utilisateur, et de les suivre/traiter cote admin.

## Demarrage rapide (Docker)

```bash
docker compose up --build
```

## URLs

| Service | URL |
|---|---|
| Interface utilisateur | http://localhost:5173/user |
| Interface admin | http://localhost:5173/admin |
| GraphQL Playground | http://localhost:3200/graphql |

## Fonctionnalites

### Cote utilisateur (`/user`)

- Identification locale (stockage navigateur)
- Theme aleatoire a chaque session/nouvelle demande
- Creation d'une demande avec criticite
- `message` optionnel
- Ecran de succes avec numero de demande (`requestNumber`)

### Cote admin (`/admin`)

- Acces autorise uniquement depuis localhost
- Liste des demandes triees de la plus recente a la plus ancienne
- Pagination cote serveur
- Filtres (statut, criticite) + recherche
- Action "Marquer comme traite"
- Mise a jour temps reel via GraphQL Subscriptions (`requestCreated`, `requestUpdated`)
- Notifications navigateur a l'arrivee d'une nouvelle demande (si permission accordee)

## Variables d'environnement (frontend)

Dans `apps/frontend/.env.local`:

```env
# Dev local hors Docker (sinon fallback: http://backend:3200)
VITE_GRAPHQL_PROXY_TARGET=http://localhost:3200

# Nom de l'app affiche dans l'UI (fallback: Buffalo)
VITE_APP_NAME=OnlyFab
```

## Variables d'environnement (backend)

- `MONGO_URI` (optionnel) - fallback: `mongodb://localhost:27017/buffalo`
- `PORT` (optionnel) - fallback: `3200`

## API GraphQL

### Query: demandes paginees

```graphql
query GetRequests($page: Int, $pageSize: Int, $status: RequestStatus, $criticality: Criticality, $search: String) {
  requests(page: $page, pageSize: $pageSize, status: $status, criticality: $criticality, search: $search) {
    items {
      id
      requestNumber
      userDisplayName
      message
      criticality
      status
      createdAt
      processedAt
    }
    total
    page
    pageSize
    totalPages
  }
}
```

### Mutation: creation de demande (`message` optionnel)

```graphql
mutation CreateRequest($input: CreateRequestInput!) {
  createRequest(input: $input) {
    id
    requestNumber
    status
  }
}
```

Exemple de variables:

```json
{
  "input": {
    "userDisplayName": "John",
    "message": null,
    "criticality": "HIGH",
    "themeKey": "noir-demoniaque"
  }
}
```

### Mutation: marquer traite

```graphql
mutation MarkRequestAsDone($requestId: String!) {
  markRequestAsDone(requestId: $requestId) {
    id
    requestNumber
    status
    processedAt
  }
}
```

### Subscriptions (admin)

```graphql
subscription {
  requestCreated {
    id
    requestNumber
    userDisplayName
    status
  }
}
```

```graphql
subscription {
  requestUpdated {
    id
    requestNumber
    status
    processedAt
  }
}
```

## Architecture

```
apps/
  backend/          # NestJS + GraphQL code-first + Mongoose
    src/modules/request/
      domain/
      application/
      infrastructure/
      interfaces/graphql/
  frontend/         # React + Vite + TypeScript + Apollo Client
    src/components/
    src/pages/
    src/graphql/

docker/
  backend.Dockerfile
  frontend.Dockerfile
  mongo-init/seed.js
docker-compose.yml
```

## Notes implementation

- Le numero de demande est genere de facon atomique via un compteur Mongo (`request-counters`).
- Les subscriptions utilisent `graphql-ws`.
- Le client Apollo utilise un split HTTP/WS.
- En multi-instance backend, remplacer le PubSub memoire par un broker (ex: Redis) pour propager les events.

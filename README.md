# 🐃 Buffalo — Bureau des Demandes Absurdes

Application interne ludique permettant à vos collègues de soumettre des demandes techniques via une interface fun et thématique, et au lead tech de gérer une todo list simple.

![Stack](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![Stack](https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white)
![Stack](https://img.shields.io/badge/GraphQL-E10098?style=flat&logo=graphql&logoColor=white)
![Stack](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white)
![Stack](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)

## 🚀 Démarrage

```bash
docker compose up --build
```

C'est tout. ☕

## 🌐 URLs

| Service | URL |
|---------|-----|
| 👤 Interface utilisateur | http://localhost:5173/user |
| 🛠️ Interface admin | http://localhost:5173/admin |
| 📊 GraphQL Playground | http://localhost:3000/graphql |

## 🎭 Fonctionnement

### Côté Utilisateur (`/user`)

1. L'utilisateur s'identifie (nom libre ou utilisateur existant)
2. Un **thème aléatoire** est affiché parmi 5 thèmes absurdes :
   - 🦩 **Rose Absurde** — surréalisme et flamants roses
   - 😈 **Noir Démoniaque** — pactes diaboliques
   - 📊 **Gris Corporate** — formalisme ironique
   - 🔮 **Contrat Mystique** — magie et parchemins
   - 👑 **Support Premium Ironique** — faux VIP
3. L'utilisateur rédige sa demande avec une criticité
4. Message de confirmation fun → possibilité d'enchaîner

### Côté Admin (`/admin`)

- Vue de toutes les demandes (polling auto)
- Filtres par statut et criticité
- Recherche libre
- Bouton "marquer comme traité"

## 🏗️ Architecture

```
apps/
  backend/          # NestJS + GraphQL code-first
    src/
      modules/
        user/       # domaine User (hexa pragmatique)
        request/    # domaine Request (hexa pragmatique)
  frontend/         # React + Vite + TypeScript
    src/
      components/   # IdentifyForm, RequestForm, RequestList
      pages/        # UserPage, AdminPage
      graphql/      # queries & mutations
      themes.ts     # 5 thèmes ludiques

docker/
  backend.Dockerfile
  frontend.Dockerfile
  mongo-init/seed.js
docker-compose.yml
```

Chaque domaine backend suit l'architecture hexagonale :

```
domain/          → entités, enums, ports
application/     → use cases, DTOs
infrastructure/  → mongoose schemas, adapters
interfaces/      → graphql resolvers, types, inputs
```

## 🔧 Stack technique

- **Frontend** : React 18, TypeScript, Vite, Apollo Client, React Router v6
- **Backend** : NestJS 10, GraphQL (code-first), Mongoose
- **BDD** : MongoDB 7
- **Infra** : Docker Compose, hot reload dev

## 📦 Seed

Le seed MongoDB crée automatiquement :
- 4 utilisateurs : Faro, Alice, Bob, Charlie
- 3 demandes exemples avec criticités variées

## 📝 API GraphQL

### Queries

```graphql
query { users { id displayName } }
query { requests(status: OPEN, criticality: HIGH) { id message userDisplayName } }
```

### Mutations

```graphql
mutation { identifyUser(input: { displayName: "John" }) { id displayName } }
mutation { createRequest(input: { userId: "...", userDisplayName: "John", message: "Fix prod", criticality: HIGH, themeKey: "noir-demoniaque" }) { id } }
mutation { markRequestAsDone(requestId: "...") { id status } }
```

---

*Built with 🐃 and absurdity.*

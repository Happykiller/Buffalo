Scaffold a new feature module following the Buffalo hexagonal architecture.

The user will provide a feature name (e.g. "notification", "tag"). Create the full module structure under `apps/backend/src/modules/<feature>/`:

```
<feature>/
  domain/
    <feature>.entity.ts          # Class with @ObjectType if exposed via GraphQL
    <feature>-repository.port.ts # Abstract class / interface for the repository
  application/
    create-<feature>.usecase.ts  # One use case per file
    create-<feature>.dto.ts      # class-validator DTO
  infrastructure/
    <feature>.schema.ts          # Mongoose schema + document type
    <feature>-repository.adapter.ts  # Implements the port
  interfaces/graphql/
    <feature>.resolver.ts        # @Resolver with injected use cases
    <feature>.type.ts            # @ObjectType GraphQL type
  <feature>.module.ts            # NestJS module wiring everything together
```

Rules:
- Use cases receive the repository port via `@Inject()` — never the adapter directly.
- The module must register the Mongoose schema and provide the PubSub token if subscriptions are needed.
- Export the module from `app.module.ts` imports array.
- Do not add anything beyond what is strictly necessary for the requested feature.

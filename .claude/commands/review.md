Review the current staged/unstaged changes in the context of the Buffalo project architecture.

1. Run `git diff HEAD` to see all current changes.
2. Evaluate the changes against these project-specific criteria:
   - **Hexagonal architecture**: Changes in `application/` must not import from `infrastructure/` or `interfaces/`. Domain layer must stay pure.
   - **GraphQL code-first**: New types must use `@ObjectType`, `@Field`, `@InputType` decorators — no SDL files.
   - **Admin guard**: Any new admin-only resolver methods must be protected with `@UseGuards(LocalhostAdminGuard)`.
   - **Subscriptions**: New subscription events must be published via the shared `PUB_SUB` token and filtered with `withFilter`.
   - **Pagination**: Repository queries must respect the 100-item max page size.
   - **Validation**: New DTOs must use `class-validator` decorators.
3. Report issues by file and line number.
4. Suggest fixes only where violations exist — do not refactor unrelated code.

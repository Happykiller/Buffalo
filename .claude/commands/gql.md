Test a GraphQL operation against the running Buffalo backend (http://localhost:3000/graphql).

The user will describe the operation they want to test (query, mutation, or subscription).

1. Write the GraphQL operation.
2. Execute it using the appropriate tool (curl via Bash for queries/mutations).
3. Show the raw response and explain the result.

Available operations (from the schema):
- Queries: `requests(page, pageSize, status, criticality, search)`, `userRequests(userDisplayName, status, limit)`, `backendVersion`
- Mutations: `createRequest(input)`, `markRequestAsDone(requestId)`
- Subscriptions: `requestCreated`, `requestUpdated`, `userRequestCreated(userDisplayName)`, `userRequestUpdated(userDisplayName)`

Note: `requests` and `markRequestAsDone` require localhost origin (admin guard). Add `-H "Origin: http://localhost"` to curl commands for those.

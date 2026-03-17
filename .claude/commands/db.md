Query or inspect the Buffalo MongoDB database using the MongoDB MCP server.

The database is `buffalo` with two collections:
- `requests` — main collection (fields: userDisplayName, requestNumber, message, criticality, status, themeKey, createdAt, processedAt)
- `request-counters` — atomic counter for requestNumber generation

Use the MongoDB MCP tools to answer the user's question. Examples of what you can do:
- List all OPEN requests sorted by criticality
- Count requests per status
- Find requests from a specific user
- Check the current requestNumber counter value
- Inspect indexes on the requests collection

Always display results in a readable table or formatted list.

Check the status of the Buffalo Docker environment.

Run the following commands and summarize the results:

1. `docker compose ps` — show running services and their health
2. `docker compose logs --tail=50 backend` — last 50 lines of backend logs
3. `docker compose logs --tail=20 mongo` — last 20 lines of MongoDB logs

Then report:
- Which services are up/down
- Any errors or warnings in the logs
- Suggested fix if a service is unhealthy (e.g. MongoDB connection refused → check MONGO_URI, restart order)

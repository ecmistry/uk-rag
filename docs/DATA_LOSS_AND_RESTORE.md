# Why Data Can Be Lost and How to Restore It

## The application does NOT delete metrics

The UK RAG Portal codebase **never** deletes or clears metrics from the database. The only database delete operations are for commentaries (when an admin deletes a commentary). Metrics are only **upserted** (insert or update) when you run a data refresh or the load script.

So if you see "all data lost" or empty cards, the data was not removed by the application code.

## Likely causes of data loss

1. **Database not persisted**
   - If MongoDB runs in a **Docker container without a volume**, all data is in the container filesystem. Restarting the container (or the host) wipes it.
   - **Fix**: Run MongoDB with a volume so data is stored on the host, e.g. `docker run -v /data/db:/data/db mongo`.

2. **MongoDB Atlas (or other cloud)**
   - Free-tier clusters can be **paused** after inactivity; restoring can sometimes start with a fresh state depending on provider.
   - The **connection string** might point to a different project/cluster (e.g. after recreating a cluster).
   - **Fix**: In Atlas, confirm the cluster is running and that `DATABASE_URL` / `MONGODB_URI` in `.env` matches the correct cluster.

3. **Wrong or changed `DATABASE_URL`**
   - If `.env` was changed, or you run the app in a different environment (e.g. different server, CI), the app may be pointing at a **different database** that was never populated.
   - **Fix**: Ensure `DATABASE_URL` (or `MONGODB_URI`) in the environment where the app runs is the one where you previously loaded data.

4. **Server / process restart with ephemeral DB**
   - Restarting the Node process does **not** clear MongoDB. But if MongoDB itself is ephemeral (e.g. no volume, or an in-memory store), then any **MongoDB** restart would lose data.
   - **Fix**: Use a persisted MongoDB instance (local with data directory, or cloud with persistent storage).

## How to restore metrics data

After fixing the cause above (so the app is talking to the correct, persistent database), repopulate metrics in one of these ways:

### Option 1: Load script (all categories)

From the project root, with `DATABASE_URL` set:

```bash
export DATABASE_URL="mongodb://..."   # your real connection string
npm run load:metrics
```

This fetches and upserts metrics for Economy, Employment, Education, Crime, Healthcare, and Defence. It can take a few minutes (it calls external APIs).

### Option 2: Data Refresh in the UI (admin only)

1. Log in as an admin.
2. Open **Data Refresh**.
3. Use the refresh button for each category (e.g. Economy, Education, Crime, Healthcare, Defence) to fetch and save that category’s metrics.

You can also refresh **All** in one go if the UI supports it.

### Option 3: Check that data is in the DB

To confirm that the app is using the right database and that data is present:

```bash
# If using mongosh and a local DB name uk_rag_portal:
mongosh uk_rag_portal --eval "db.metrics.countDocuments()"
```

If the count is 0, the database is empty and you need to run the load script or Data Refresh as above.

## Summary

| Cause                         | What to do                                              |
|------------------------------|---------------------------------------------------------|
| MongoDB not persisted        | Run MongoDB with a volume / persistent storage         |
| Wrong or changed DATABASE_URL| Set correct `DATABASE_URL` / `MONGODB_URI` in `.env`   |
| Atlas cluster paused / reset | Restore or recreate cluster and update connection string |
| Database empty for any reason | Run `npm run load:metrics` or Data Refresh in the UI   |

The application does not clear metrics; restoring data is done by re-running the load script or Data Refresh after fixing the database connection and persistence.

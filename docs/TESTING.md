# Testing

## Running tests

```bash
npm run test
```

**With database (required for education and metrics tests):**

```bash
DATABASE_URL=mongodb://localhost:27017/uk_rag_portal_test npm run test
```

Use `uk_rag_portal_test` so test data is separate from the app database (`uk_rag_portal`). MongoDB creates the database on first write.

## Database requirement

These tests use the real MongoDB layer (no mocks) and **require a running MongoDB** and `DATABASE_URL` (or `MONGODB_URI`) in the environment:

- **server/education.test.ts** – refresh, list, getById, RAG validation (all call into `db`)
- **server/metrics.test.ts** – “returns metric with history when it exists”, “correctly calculates GDP growth status” (they call `upsertMetric` and `getById`)

If `DATABASE_URL` is not set or MongoDB is not reachable, those tests fail with **"Database not available"**.

To run the full suite with the database:

1. Ensure MongoDB is running (e.g. on the same server or a remote instance).
2. Set the connection string when running tests, for example:

   ```bash
   DATABASE_URL=mongodb://localhost:27017/uk_rag_portal npm run test
   ```

   or, if you use `.env` and your test runner loads it:

   ```bash
   npm run test
   ```

Tests that do **not** need a database:

- **server/auth.logout.test.ts**
- **server/crime.test.ts**
- **server/education-integration.test.ts** (hits external DfE API)
- **server/population-breakdown.test.ts** (hits Python script + ONS)

## Skipping network-dependent integration tests

To skip tests that call external APIs or the Python script (e.g. in CI without network):

```bash
SKIP_NETWORK_TESTS=1 npm run test
```

This skips the population-breakdown integration test that asserts non-zero underemployment.

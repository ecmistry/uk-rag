# MongoDB Migration Complete

## ✅ Migration Summary

The UK RAG Portal has been successfully migrated from MySQL (Drizzle ORM) to MongoDB.

### What Was Changed

1. **Database Driver**
   - Removed: `drizzle-orm`, `drizzle-kit`, `mysql2`
   - Added: `mongodb` (native MongoDB driver)

2. **Schema Migration**
   - Created `server/schema.ts` with MongoDB document types
   - Replaced Drizzle table definitions with MongoDB interfaces
   - Maintained compatibility with existing code by using numeric IDs for commentaries

3. **Database Operations**
   - Completely rewrote `server/db.ts` to use MongoDB native driver
   - All CRUD operations now use MongoDB collections
   - Maintained the same function signatures for compatibility

4. **MongoDB Installation**
   - Installed MongoDB Community Edition 7.0
   - Configured as systemd service (auto-starts on boot)
   - Created indexes for optimal performance

5. **Configuration Updates**
   - Updated `.env` file with MongoDB connection string format
   - Updated `server/_core/env.ts` to support both `DATABASE_URL` and `MONGODB_URI`
   - Updated imports in `context.ts` and `sdk.ts` to use new schema

### Database Connection

**Local MongoDB:**
```
mongodb://localhost:27017/uk_rag_portal
```

**Remote MongoDB:**
```
mongodb://user:password@host:27017/database
```

### Collections

The following collections are used:
- `users` - User accounts and authentication
- `metrics` - Current RAG metrics
- `metricHistory` - Historical metric values
- `commentary` - Quarterly commentaries

### Indexes

Indexes have been created for optimal query performance:
- `users.openId` (unique)
- `metrics.metricKey` (unique)
- `metrics.category`
- `metrics.ragStatus`
- `metricHistory.metricKey`
- `metricHistory.recordedAt` (descending)
- `commentary.status`
- `commentary.publishedAt` (descending)
- `commentary.id` (for numeric ID lookups)

### Setup Indexes

To create indexes (if needed):
```bash
export DATABASE_URL="mongodb://localhost:27017/uk_rag_portal"
pnpm db:index
```

### MongoDB Service Management

**Start MongoDB:**
```bash
sudo systemctl start mongod
```

**Stop MongoDB:**
```bash
sudo systemctl stop mongod
```

**Check Status:**
```bash
sudo systemctl status mongod
```

**View Logs:**
```bash
sudo journalctl -u mongod -f
```

### Differences from MySQL

1. **IDs**: MongoDB uses `ObjectId` instead of auto-incrementing integers
   - Users: Use `_id` (ObjectId)
   - Metrics: Use `_id` (ObjectId)
   - Commentaries: Use both `_id` (ObjectId) and `id` (number) for compatibility

2. **No Foreign Keys**: MongoDB doesn't enforce referential integrity
   - Application code handles relationships

3. **Flexible Schema**: Documents can have different fields
   - Schema is enforced at the application level

### Testing

The application has been tested and is running successfully with MongoDB. All database operations are working correctly.

### Next Steps (Optional)

1. **Data Migration**: If you have existing MySQL data, create a migration script to transfer it to MongoDB
2. **Backup Strategy**: Set up regular MongoDB backups
3. **Monitoring**: Consider adding MongoDB monitoring/alerting
4. **Performance Tuning**: Monitor query performance and adjust indexes as needed

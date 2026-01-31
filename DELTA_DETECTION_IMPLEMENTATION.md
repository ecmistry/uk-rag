# Delta Detection and Scheduled Data Pulls Implementation

## Overview

This document describes the implementation of scheduled data pulls with delta detection for CSV and Excel files. The system tracks file metadata (ETag, Last-Modified, Content-Length) to detect changes and only processes new data.

## Components

### 1. File Metadata Tracking (`server/fileMetadata.ts`)

Tracks metadata for each downloaded file:
- **URL**: Source file URL
- **ETag**: HTTP ETag header (most reliable change indicator)
- **Last-Modified**: HTTP Last-Modified header
- **Content-Length**: File size in bytes
- **Last Processed**: Timestamp of last successful processing
- **Data Periods Processed**: Array of time periods already imported

**Key Functions:**
- `getFileMetadata()`: Retrieve or create metadata record
- `updateFileMetadata()`: Update metadata after processing
- `hasFileChanged()`: Compare current headers with stored metadata
- `getProcessedPeriods()`: Get list of already-processed time periods
- `addProcessedPeriods()`: Mark time periods as processed

### 2. File Change Detection (`server/fileChangeDetector.ts`)

Uses HTTP HEAD requests to check file metadata without downloading:
- Makes HEAD request to get headers (ETag, Last-Modified, Content-Length)
- Compares with stored metadata to detect changes
- Updates metadata cache

**Key Functions:**
- `checkFileChange()`: Check single file for changes
- `checkMultipleFiles()`: Batch check multiple files

### 3. Scheduled Data Pull Service (`server/scheduledDataPull.ts`)

Orchestrates incremental data pulls:
- Pulls data for all categories
- Checks for already-processed time periods
- Only inserts new data points
- Skips duplicates

**Key Functions:**
- `pullCategoryData()`: Pull data for single category with delta detection
- `pullAllCategories()`: Pull all categories
- `runScheduledPull()`: Entry point for scheduled execution

### 4. Database Schema

New collection: `fileMetadata`
```typescript
{
  url: string;
  metricKey: string;
  category: string;
  etag?: string;
  lastModified?: string;
  contentLength?: number;
  lastProcessed?: Date;
  dataPeriodsProcessed?: string[];
}
```

Indexes:
- `{ url: 1, metricKey: 1 }` (unique)
- `{ category: 1 }`
- `{ lastChecked: -1 }`

## How It Works

### Initial Pull
1. System checks file metadata (HEAD request)
2. If no previous metadata exists, downloads and processes file
3. Stores metadata (ETag, Last-Modified, Content-Length)
4. Tracks processed time periods

### Subsequent Pulls (Delta Detection)
1. System makes HEAD request to check current file headers
2. Compares ETag/Last-Modified/Content-Length with stored metadata
3. If changed:
   - Downloads file
   - Compares new data with existing time periods in database
   - Only inserts new time periods
   - Updates metadata and processed periods list
4. If unchanged:
   - Skips download (no new data)

### Time Period Tracking
- Each metric's time periods (e.g., "2024 Q1", "2025 SEP") are tracked
- Before inserting history, system checks if period already exists
- Duplicate periods are skipped
- New periods are added to `dataPeriodsProcessed` array

## Usage

### Manual Pull
```bash
# Pull all categories with delta detection
npm run pull:scheduled

# Pull specific category
npm run pull:category Economy
```

### Scheduled Pulls (Cron)

Set up cron jobs:
```bash
cd /home/ec2-user/uk-rag-portal
./server/createScheduledJob.sh
```

This creates:
- **Daily pull**: 2 AM every day
- **Weekly pull**: 3 AM every Sunday (full refresh for safety)

### Programmatic Usage
```typescript
import { pullCategoryData, pullAllCategories } from './server/scheduledDataPull';

// Pull single category
const result = await pullCategoryData('Economy', true);

// Pull all categories
const results = await pullAllCategories(true);
```

## Benefits

1. **Efficiency**: Only downloads files when they've changed
2. **Incremental Processing**: Only processes new time periods
3. **No Duplicates**: Prevents duplicate data entries
4. **Bandwidth Savings**: HEAD requests are much smaller than full downloads
5. **Reliability**: Tracks processed periods to avoid data loss on retries

## File Change Detection Methods

The system uses multiple methods (in order of reliability):

1. **ETag** (most reliable): Unique identifier for file version
2. **Last-Modified**: Timestamp of last file modification
3. **Content-Length**: File size (indicates changes but less reliable)

If any of these differ from stored metadata, file is considered changed.

## Limitations

1. **Server Support**: Some servers don't support HEAD requests or ETag headers
   - Fallback: Always download (safe but less efficient)

2. **File Format Changes**: If file structure changes but metadata doesn't, system may miss updates
   - Mitigation: Weekly full refresh

3. **Time Period Format**: Relies on consistent time period formatting
   - Ensure Python scripts output consistent period strings

## Future Enhancements

1. **Content Hashing**: Calculate file hash for additional verification
2. **Retry Logic**: Automatic retry on failures
3. **Notifications**: Alert on data pull failures
4. **Metrics Dashboard**: Track pull success rates and data freshness
5. **Parallel Processing**: Process multiple files concurrently

## Testing

Test delta detection:
```bash
# First pull (will download everything)
npm run pull:scheduled

# Second pull (should skip unchanged files)
npm run pull:scheduled
```

Check logs:
```bash
tail -f logs/scheduled-pull.log
```

## Troubleshooting

**Issue**: Files always downloading even when unchanged
- Check if server supports ETag/Last-Modified headers
- Verify metadata is being stored correctly in MongoDB

**Issue**: Duplicate data appearing
- Check `dataPeriodsProcessed` array in `fileMetadata` collection
- Verify time period format is consistent

**Issue**: Scheduled pulls not running
- Check crontab: `crontab -l`
- Check logs: `tail -f logs/scheduled-pull.log`
- Verify DATABASE_URL is set in cron environment

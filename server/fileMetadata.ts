/**
 * File Metadata Tracking for Delta Detection
 * Tracks CSV/Excel file changes to enable incremental data pulls
 */

import { getDb } from "./db";

export interface FileMetadata {
  _id?: string;
  url: string;
  metricKey: string;
  category: string;
  etag?: string | null;
  lastModified?: string | null;
  contentLength?: number | null;
  fileHash?: string | null;
  lastProcessed?: Date;
  lastChecked?: Date;
  dataPeriodsProcessed?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Get or create file metadata record
 */
export async function getFileMetadata(
  url: string,
  metricKey: string,
  category: string
): Promise<FileMetadata | null> {
  const db = await getDb();
  if (!db) return null;

  const collection = db.collection<FileMetadata>("fileMetadata");
  const metadata = await collection.findOne({ url, metricKey });

  if (!metadata) {
    const newMetadata: FileMetadata = {
      url,
      metricKey,
      category,
      lastChecked: new Date(),
      dataPeriodsProcessed: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await collection.insertOne(newMetadata);
    return newMetadata;
  }

  return metadata;
}

/**
 * Update file metadata after processing
 */
export async function updateFileMetadata(
  url: string,
  metricKey: string,
  updates: Partial<FileMetadata>
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const collection = db.collection<FileMetadata>("fileMetadata");
  await collection.updateOne(
    { url, metricKey },
    {
      $set: {
        ...updates,
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );
}

/**
 * Check if file has changed by comparing metadata
 */
export async function hasFileChanged(
  url: string,
  metricKey: string,
  currentEtag?: string | null,
  currentLastModified?: string | null,
  currentContentLength?: number | null
): Promise<boolean> {
  const metadata = await getFileMetadata(url, metricKey, "");
  if (!metadata) return true;

  if (currentEtag && metadata.etag) {
    if (currentEtag !== metadata.etag) return true;
  }

  if (currentLastModified && metadata.lastModified) {
    if (currentLastModified !== metadata.lastModified) return true;
  }

  if (currentContentLength !== undefined && metadata.contentLength !== undefined) {
    if (currentContentLength !== metadata.contentLength) return true;
  }

  if (!currentEtag && !currentLastModified && currentContentLength === undefined) {
    return true;
  }

  return false;
}

/**
 * Get processed time periods for a metric
 */
export async function getProcessedPeriods(
  metricKey: string,
  url?: string
): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];

  const collection = db.collection<FileMetadata>("fileMetadata");
  const query: any = { metricKey };
  if (url) query.url = url;

  const metadata = await collection.findOne(query);
  return metadata?.dataPeriodsProcessed || [];
}

/**
 * Add processed time periods
 */
export async function addProcessedPeriods(
  metricKey: string,
  url: string,
  periods: string[]
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const collection = db.collection<FileMetadata>("fileMetadata");
  await collection.updateOne(
    { url, metricKey },
    {
      $addToSet: {
        dataPeriodsProcessed: { $each: periods },
      },
      $set: {
        lastProcessed: new Date(),
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );
}

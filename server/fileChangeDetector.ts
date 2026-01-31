/**
 * File Change Detection Utility
 * Checks HTTP headers to determine if remote files have changed
 */

import axios from "axios";
import { hasFileChanged, updateFileMetadata, getFileMetadata } from "./fileMetadata";

export interface FileChangeInfo {
  hasChanged: boolean;
  etag?: string | null;
  lastModified?: string | null;
  contentLength?: number | null;
  shouldDownload: boolean;
}

/**
 * Check if a remote file has changed using HTTP HEAD request
 */
export async function checkFileChange(
  url: string,
  metricKey: string,
  category: string
): Promise<FileChangeInfo> {
  try {
    const response = await axios.head(url, {
      timeout: 30000,
      headers: {
        "User-Agent": "UK-RAG-Dashboard/1.0",
      },
      validateStatus: (status) => status < 500,
    });

    const etag = response.headers["etag"] || response.headers["ETag"] || null;
    const lastModified =
      response.headers["last-modified"] ||
      response.headers["Last-Modified"] ||
      null;
    const contentLength =
      response.headers["content-length"] ||
      response.headers["Content-Length"]
        ? parseInt(
            response.headers["content-length"] ||
              response.headers["Content-Length"] ||
              "0"
          )
        : null;

    const changed = await hasFileChanged(
      url,
      metricKey,
      etag,
      lastModified,
      contentLength
    );

    await updateFileMetadata(url, metricKey, {
      url,
      metricKey,
      category,
      etag,
      lastModified,
      contentLength,
      lastChecked: new Date(),
    });

    return {
      hasChanged: changed,
      etag,
      lastModified,
      contentLength,
      shouldDownload: changed,
    };
  } catch (error) {
    console.warn(
      `[File Change Detection] HEAD request failed for ${url}:`,
      error instanceof Error ? error.message : "Unknown error"
    );
    return {
      hasChanged: true,
      shouldDownload: true,
    };
  }
}

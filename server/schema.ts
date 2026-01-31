/**
 * MongoDB Schema Types
 * Replaces the Drizzle MySQL schema with MongoDB document types
 */

import { ObjectId } from "mongodb";

// ============================================================================
// User Schema
// ============================================================================

export interface User {
  _id: ObjectId;
  openId: string;
  name?: string | null;
  email?: string | null;
  loginMethod?: string | null;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
}

export interface InsertUser {
  openId: string;
  name?: string | null;
  email?: string | null;
  loginMethod?: string | null;
  role?: "user" | "admin";
  createdAt?: Date;
  updatedAt?: Date;
  lastSignedIn?: Date;
}

// ============================================================================
// Metric Schema
// ============================================================================

export interface Metric {
  _id: ObjectId;
  metricKey: string;
  name: string;
  category: string;
  value: string; // Stored as string to preserve precision
  unit: string;
  ragStatus: "red" | "amber" | "green";
  dataDate: string;
  sourceUrl?: string | null;
  lastUpdated: Date;
  createdAt: Date;
}

export interface InsertMetric {
  metricKey: string;
  name: string;
  category: string;
  value: string;
  unit: string;
  ragStatus: "red" | "amber" | "green";
  dataDate: string;
  sourceUrl?: string | null;
  lastUpdated?: Date;
  createdAt?: Date;
}

// ============================================================================
// Metric History Schema
// ============================================================================

export interface MetricHistory {
  _id: ObjectId;
  metricKey: string;
  value: string;
  ragStatus: "red" | "amber" | "green";
  dataDate: string;
  recordedAt: Date;
}

export interface InsertMetricHistory {
  metricKey: string;
  value: string;
  ragStatus: "red" | "amber" | "green";
  dataDate: string;
  recordedAt?: Date;
}

// ============================================================================
// Commentary Schema
// ============================================================================

export interface Commentary {
  _id: ObjectId;
  id?: number; // Numeric ID for compatibility with existing code
  title: string;
  content: string;
  period: string;
  authorId: ObjectId;
  status: "draft" | "published";
  publishedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface InsertCommentary {
  title: string;
  content: string;
  period: string;
  authorId: ObjectId | number; // Accept both for compatibility
  status?: "draft" | "published";
  publishedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

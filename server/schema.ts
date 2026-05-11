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
  information?: string;
}

export interface InsertMetricHistory {
  metricKey: string;
  value: string;
  ragStatus: "red" | "amber" | "green";
  dataDate: string;
  recordedAt?: Date;
  information?: string;
}

// ============================================================================
// Fleet Inventory Schema (Phase 2 of news-aware defence pipeline)
// ============================================================================
//
// One document per individually-tracked unit (hull, squadron, etc.) backing
// the defence mass-score metrics. Each row carries its own provenance so a
// score movement can always be traced back to a specific status change with
// a citation. Sea Mass is the first metric to be migrated onto this model;
// Land Mass / Air Mass remain on hardcoded counts until they too have a
// per-unit roster.

export type FleetInventoryCategory = "sea_mass" | "land_mass" | "air_mass";

// Sea Mass roles map onto the Sea Mass pillar model in defence_data_fetcher.py.
// `carrier` and `ssbn` both feed the Strategic pillar; `ssn` feeds Undersea;
// `escort` feeds Escort; `rfa` feeds Support; `patrol_mcm` feeds Constabulary.
export type SeaMassRole =
  | "carrier"
  | "ssbn"
  | "ssn"
  | "escort"
  | "rfa"
  | "patrol_mcm";

// Fleet status. Only `active` and `refit` count toward the mass score
// (refitting hulls are still in the order of battle). `low_readiness`,
// `withdrawn`, and `decommissioned` are excluded.
export type FleetItemStatus =
  | "active"
  | "refit"
  | "low_readiness"
  | "withdrawn"
  | "decommissioned";

export interface FleetInventoryItem {
  _id: ObjectId;
  itemId: string; // stable slug, e.g. "hms-iron-duke"
  name: string; // display name, e.g. "HMS Iron Duke"
  className: string; // e.g. "Type 23 Frigate"
  category: FleetInventoryCategory;
  role: string; // SeaMassRole for sea_mass; free-form for other categories
  status: FleetItemStatus;
  // Quantity represented by this inventory row. Defaults to 1 when absent so
  // existing Sea Mass per-hull rows keep their original meaning. Land Mass
  // and Air Mass use aggregate rows (e.g. "Warrior IFV" with quantity 632).
  quantity?: number;
  statusChangedAt: Date;
  statusSourceUrl?: string | null; // citation for the current status
  statusSourceTitle?: string | null; // optional human label for the citation
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface InsertFleetInventoryItem {
  itemId: string;
  name: string;
  className: string;
  category: FleetInventoryCategory;
  role: string;
  status: FleetItemStatus;
  quantity?: number;
  statusChangedAt?: Date;
  statusSourceUrl?: string | null;
  statusSourceTitle?: string | null;
  notes?: string | null;
}

// Statuses that contribute toward the mass score (still part of the OOB).
export const FLEET_COUNTED_STATUSES: ReadonlySet<FleetItemStatus> = new Set<FleetItemStatus>([
  "active",
  "refit",
]);

// ============================================================================
// Fleet Change Proposal Schema (Phase 3 of news-aware defence pipeline)
// ============================================================================
//
// A proposal represents a candidate status change to a fleet inventory item,
// extracted from a single news article by the nightly defence_news_watcher.
// Proposals are NEVER auto-applied — they sit in `pending_review` until an
// admin approves or rejects them, at which point the inventory may flip.

export type ProposalStatus =
  | "pending_review"
  | "approved"
  | "rejected"
  | "auto_rejected"; // dropped before review (e.g. low confidence)

export interface FleetChangeProposal {
  _id: ObjectId;
  itemId: string; // matched inventory item; "" if no match was found
  vesselNameFromArticle: string; // string the LLM extracted from the article
  currentStatus: FleetItemStatus | null; // status at proposal time (null if no match)
  proposedStatus: FleetItemStatus;
  evidenceQuote: string; // short excerpt from the article justifying the change
  articleUrl: string;
  articleTitle: string;
  articleSource: string; // e.g. "Navy Lookout"
  articlePublishedAt: Date | null;
  confidence: number; // 0..1 self-reported by the LLM
  status: ProposalStatus;
  createdAt: Date;
  reviewedAt?: Date;
  reviewerEmail?: string;
  reviewNotes?: string;
}

export interface InsertFleetChangeProposal {
  itemId: string;
  vesselNameFromArticle: string;
  currentStatus: FleetItemStatus | null;
  proposedStatus: FleetItemStatus;
  evidenceQuote: string;
  articleUrl: string;
  articleTitle: string;
  articleSource: string;
  articlePublishedAt: Date | null;
  confidence: number;
  status?: ProposalStatus;
}

// Confidence threshold below which the watcher auto-rejects without surfacing
// to admin. Keep in sync with CONFIDENCE_FLOOR in defence_news_watcher.py.
export const PROPOSAL_CONFIDENCE_FLOOR = 0.7;

// Dedup window: a fresh proposal for the same (itemId, proposedStatus) within
// this many days is collapsed onto the existing record rather than reopened.
export const PROPOSAL_DEDUP_WINDOW_DAYS = 30;

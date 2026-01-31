# Query Info Pattern – Sharing Data Source Queries on Dashboards

**Purpose:** Let colleagues see the underlying query for a table, chart, or KPI so they can reconcile data and debug issues. Use a small eye icon next to the section title; clicking opens a dialog with the query (copyable).

## Component

- **Location:** `client/src/components/QueryInfoDialog.tsx`
- **Usage:** Import `QueryInfoDialog` and pass `title`, `query`, and optionally `description`.

```tsx
import { QueryInfoDialog } from "@/components/QueryInfoDialog";

<div className="flex items-center gap-2">
  <CardTitle>Your Table or Chart Title</CardTitle>
  <QueryInfoDialog
    title="Your Table – data source"
    query={YOUR_QUERY_STRING}
    description="Optional: parameters, dataset, or backend procedure name."
  />
</div>
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `title` | string | Dialog title (e.g. "User Stories and Feature Requests – data source") |
| `query` | string | Full SQL or query text shown in the dialog (copyable) |
| `description` | string? | Short note (parameters, dataset, backend procedure) |
| `triggerLabel` | string? | Aria-label for the eye button (default: "View data source query") |
| `className` | string? | Extra class for the trigger button |

## Query Content

- **Source of truth:** The real query lives in the backend (e.g. `server/bigquery-*.ts`). The string you pass to `QueryInfoDialog` is for **display only** and should match the backend logic so colleagues can run it (e.g. in BigQuery) after substituting parameters.
- **Parameter placeholders:** Use placeholders like `<version>`, `<startDate>` in the displayed query and explain them in `description` (e.g. "Replace &lt;version&gt; with the selected version.").
- **Length:** Prefer the full query; the dialog is scrollable. If the query is built dynamically, document the structure and parameters in `description`.

## Example (RAG Build – User Stories chart)

- **Page:** `/pe/rag-build` – "User Stories and Feature Requests" chart
- **Backend:** `server/bigquery-pe-release.ts` – `getPEReleaseAnalysis()`
- **Frontend:** `client/src/pages/pe/RAGBuild.tsx` – constant `USER_STORIES_QUERY` + `QueryInfoDialog` next to the card title

## Example (RAG Build – User Stories and Feature Requests, In Progress (not ideated) table)

- **Page:** `/pe/rag-build` – table "User Stories and Feature Requests, In Progress (not ideated)"
- **Backend:** `server/bigquery-pe-release.ts` – `getStoriesWithoutIBR(bypassCache)`
- **Procedure:** `dashboard.pe.storiesWithoutIBR`
- **Frontend:** `client/src/pages/pe/RAGBuild.tsx` – constant `STORIES_WITHOUT_IBR_QUERY` + `QueryInfoDialog` next to the card title
- **Parameters:** None. Query is fixed (no version/date filters).
- **Dataset:** `reporting-299920` (Jira). Tables: `jira.issue`, `jira.issue_type`, `jira.status`, `jira.project`, `jira.issue_field_history`, `jira.field_option`, `jira.issue_multiselect_history`.

### Underlying query (individual elements)

This is the query run by `getStoriesWithoutIBR()`. It returns stories and feature requests that are in progress (status In Progress, In Code Review, Ready for Test, In Testing) and do **not** have the IBR label. Frontend sorts by last_updated.

```sql
SELECT 
  p.key AS project,
  i.key AS issue_key,
  i.updated AS last_updated,
  t.name AS type,
  s.name AS status,
  (SELECT fo.name
   FROM `reporting-299920.jira.issue_field_history` ifht
   JOIN `reporting-299920.jira.field_option` fo ON fo.id = CAST(ifht.value AS INT64)
   WHERE ifht.issue_id = i.id
     AND ifht.field_id = "customfield_10034"
     AND ifht.is_active = TRUE
  ) AS team
FROM `reporting-299920.jira.issue` i
JOIN `reporting-299920.jira.issue_type` t ON t.id = i.issue_type
JOIN `reporting-299920.jira.status` s ON s.id = i.status
JOIN `reporting-299920.jira.project` p ON p.id = i.project
WHERE p.key IN ("APIM", "AM", "CJ", "AE", "GKO", "ES")
  AND t.name IN ("Story", "Feature Request")
  AND i._fivetran_deleted = FALSE
  AND (i.resolution IS NULL OR CAST(i.resolution AS INT64) = 10000)
  AND s.name IN ("In Progress", "In Code Review", "Ready for Test", "In Testing")
  AND NOT EXISTS (
    SELECT 1
    FROM `reporting-299920.jira.issue_multiselect_history` ibr
    WHERE ibr.issue_id = i.id
      AND ibr.field_id = "labels"
      AND ibr.is_active = TRUE
      AND ibr.value = "IBR"
  )
-- ORDER BY removed in backend for cache efficiency; frontend sorts by last_updated
```

## Example (RAG Churn – Total $ Renewals Due in 2026 scorecard)

- **Page:** `/customer-success/rag-churn` – scorecard "Total $ Renewals Due in 2026"
- **Backend:** `server/bigquery-churn.ts` – `getChurnDashboard(startDate?, endDate?, pod?, bypassCache)`
- **Procedure:** `dashboard.churnDashboard`
- **Frontend:** `client/src/pages/customer-success/RAGChurnDashboard.tsx` – constant `TOTAL_RENEWALS_DUE_2026_QUERY` + `QueryInfoDialog` next to the card title
- **Parameters:** Summary cards use full 2026 date filter (not the page date range). Optional `pod` filter (Deal Geo Pods) when not "All".
- **Dataset:** `reporting-299920` (HubSpot). Tables: `hubspot.deal`, `hubspot.deal_company`, `hubspot.company`, `hubspot.owner`, `hubspot.deal_pipeline_stage`.

### Underlying query (Total $ Renewals Due in 2026)

The scorecard value is **SUM(property_amount_in_home_currency)** over all customer-renewal deals with close date in 2026. The backend runs the same main churn query with the **summary** date filter fixed to 2026 (`property_closedate >= '2026-01-01' AND property_closedate < '2027-01-01'`). When the user selects a Pod, the backend adds a pod filter to `deal_base`. The full query (with all computed columns and JOINs) is in `getChurnDashboard()`; the frontend dialog shows a simplified query that produces the same rows used for the sum.

### Example (RAG Churn – Closed Won Renewals in 2026 scorecard)

- **Page:** `/customer-success/rag-churn` – scorecard "Closed Won Renewals in 2026"
- **Backend:** `server/bigquery-churn.ts` – `getChurnDashboard()` (same summary query as Total $ Renewals Due)
- **Procedure:** `dashboard.churnDashboard`
- **Frontend:** `client/src/pages/customer-success/RAGChurnDashboard.tsx` – constant `CLOSED_WON_RENEWALS_2026_QUERY` + `QueryInfoDialog` next to the card title
- **Value:** **SUM(property_amount_in_home_currency)** for rows where **Deal_stage = 'Closed won'** (and close date has quarter). Same summary query; filtering by stage is done in backend JS after the query.

### Example (RAG Churn – Closed Lost Renewals in 2026 scorecard)

- **Page:** `/customer-success/rag-churn` – scorecard "Closed Lost Renewals in 2026"
- **Backend:** `server/bigquery-churn.ts` – `getChurnDashboard()` (same summary query)
- **Procedure:** `dashboard.churnDashboard`
- **Frontend:** `client/src/pages/customer-success/RAGChurnDashboard.tsx` – constant `CLOSED_LOST_RENEWALS_2026_QUERY` + `QueryInfoDialog` next to the card title
- **Value:** **SUM(sum_closed_lost_plus_closed_won_downsell_diff_renewal)** for rows where **Deal_stage = 'Closed lost'** and value > 0. That column: Closed lost + Down Sell → property_down_sell_amount; else Closed lost → property_amount_in_home_currency. Same summary query; filtering by stage is done in backend JS.

### Example (RAG Churn – Renewals $ at Risk in 2026 scorecard)

- **Page:** `/customer-success/rag-churn` – scorecard "Renewals $ at Risk in 2026"
- **Backend:** `server/bigquery-churn.ts` – `getChurnDashboard()` (same summary query)
- **Procedure:** `dashboard.churnDashboard`
- **Frontend:** `client/src/pages/customer-success/RAGChurnDashboard.tsx` – constant `RENEWALS_AT_RISK_2026_QUERY` + `QueryInfoDialog` next to the card title
- **Value:** **SUM(sum_renewal_at_risk_adjusted_downsell)** for rows where value > 0. That column: when Deal_stage NOT IN ('Closed lost','Closed won') AND property_renewal_at_risk = TRUE THEN property_amount_in_home_currency ELSE 0. Same summary query; filtering is done in backend JS.

### Example (RAG Churn – Quarterly Churn Metrics table)

- **Page:** `/customer-success/rag-churn` – table "Quarterly Churn Metrics"
- **Backend:** `server/bigquery-churn.ts` – `getChurnDashboard(startDate?, endDate?, pod?, bypassCache)` (date-filtered deal query) + `getChurnTargets(pod?)` (churn targets)
- **Procedure:** `dashboard.churnDashboard`
- **Frontend:** `client/src/pages/customer-success/RAGChurnDashboard.tsx` – constant `QUARTERLY_CHURN_METRICS_QUERY` + `QueryInfoDialog` next to the card title
- **Data sources:** (1) **Deals:** Same main churn query as other churn tables, with the **page date filter** (not full 2026). Backend aggregates by quarter (close date → Q1–Q4): `lostRenewals` from `sum_closed_lost_...` for Closed lost; `renewalsAtRisk` from `sum_renewal_at_risk_...` for at-risk. (2) **Churn targets:** `reporting-299920.gravitee_operations.master_static_churn_targets` via `getChurnTargets()`; `quarter_end_date` maps to Q1–Q4; optional `<geoPodFilter>` when Pod ≠ All.
- **Table logic:** Rows Q1–Q4 + Total. Columns: **churnTarget** from churn targets; **lostRenewals**, **renewalsAtRisk** from deal query by quarter; **churnPercent** = lostRenewals/churnTarget×100; **predictedChurn** = lostRenewals + renewalsAtRisk; **churnPercentPredicted** = predictedChurn/churnTarget×100; **RAG** computed in backend JS (green &lt;80%, amber 80–120%, red &gt;120%).

## Prompt for Adding to Other Dashboards

Use this when adding the same pattern to another table, chart, or KPI:

```
Add a "data source query" disclosure to [DASHBOARD/PAGE] for [ELEMENT].

1. Identify the backend procedure and query that power this element (e.g. dashboard router + bigquery-*.ts).
2. Add a constant in the page (or a shared queries file) with the parameterized query string for display. Use placeholders like <param> and document them.
3. Import QueryInfoDialog from @/components/QueryInfoDialog.
4. In the header of the table/chart/KPI, add a flex wrapper around the title and a QueryInfoDialog with:
   - title: "[Element name] – data source"
   - query: the constant from step 2
   - description: short note on parameters/dataset/backend (optional).
5. Follow the same layout as RAG Build: flex items-center gap-2 with CardTitle + QueryInfoDialog.
```

Replace `[DASHBOARD/PAGE]` (e.g. "RAG - Build", "Support RAG L2 Agent") and `[ELEMENT]` (e.g. "Open instances table", "Burn-up chart") when using the prompt.

## Consistency Checklist

- [ ] Eye icon (QueryInfoDialog) is next to the section title, not floating alone.
- [ ] Dialog title ends with "– data source" (or "– data source query").
- [ ] Query text is the full SQL/query (or representative parameterized version).
- [ ] Description explains parameters and where the query lives (backend procedure / dataset).
- [ ] Copy button works; dialog is scrollable for long queries.

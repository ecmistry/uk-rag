# ONS EMP16 Underemployment – Automating the dataset (no stable CSV URL)

## Problem

The ONS **Underemployment and overemployment (EMP16)** dataset is published as an Excel file (.xls) with a **new filename each quarter** (e.g. `emp16feb2026.xls`, then `emp16may2026.xls`). Unlike ONS time series that have a fixed `.../generator?format=csv&uri=...` URL, this dataset does **not** expose a stable URL you can call to get the latest CSV. The download link changes every release.

## Approach

1. **Stable landing page**  
   The "current" edition page URL is stable:  
   `https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/employmentandemployeetypes/datasets/underemploymentandoveremploymentemp16/current`

2. **Discover latest file**  
   That page lists "Latest version" first (and "Previous versions" below). We fetch the page and parse the first `.xls` link that points to the **current** edition (path contains `/current/` but not `/current/previous/`). That gives us the current quarter’s file URL.

3. **Download and parse**  
   We download the XLS from that URL and parse:
   - **Levels** sheet → underemployment level by quarter (used in population breakdown).
   - A **rate** sheet (e.g. "Rates") → underemployment rate (%) by quarter (used for the Employment underemployment metric).

## Implementation

- **`server/ons_emp16.py`**  
  - `get_latest_emp16_xls_url(session)` – fetches the current edition page and returns the latest XLS URL.  
  - `fetch_emp16_underemployment_level_by_quarter(session)` – downloads that XLS and returns `{(year, quarter): level}` from the Levels sheet.  
  - `fetch_emp16_underemployment_rate_by_quarter(session)` – downloads that XLS and returns a list of `{date, value}` for the underemployment rate (%).

- **`server/employment_data_fetcher.py`**  
  Uses the rate series to produce the **Underemployment** employment metric (quarterly, with RAG). No hardcoded file URL.

- **`server/population_data_fetcher.py`**  
  Uses `fetch_emp16_underemployment_level_by_quarter()` for the population breakdown (underemployed count by quarter). No hardcoded file URL.

## If the ONS page or file layout changes

- If the "current" page URL or HTML structure changes, update the regex in `ons_emp16.get_latest_emp16_xls_url()`.
- If the Excel sheet names or column layout change (e.g. "Levels" or "Rates"), update the parsing in `ons_emp16.py` (and any callers that assume sheet/column positions).

## ONS Beta API

The ONS Beta API (`https://api.beta.ons.gov.uk/v1`) does not list EMP16 in its dataset catalogue (as of review). Using the current-edition page to discover the latest file is the reliable way to automate this dataset.

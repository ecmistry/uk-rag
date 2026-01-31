# Resolution Foundation Employment Data Integration

## ✅ Completed

The Resolution Foundation employment data integration has been fully implemented and is now operational.

## Data Source

**Resolution Foundation** provides alternative UK employment estimates based on HMRC tax data and ONS population data, developed in response to issues with the ONS Labour Force Survey since the Covid-19 pandemic.

- **Website**: https://www.resolutionfoundation.org/our-work/estimates-of-uk-employment/
- **Excel Download**: https://www.resolutionfoundation.org/app/uploads/2025/12/RF-employment-data-web-version.xlsx
- **Data Coverage**: Monthly data from August 2014 to present
- **Update Frequency**: Monthly (Excel file updated regularly)

## Metrics Implemented

1. **Employment Rate (16+)**
   - Metric Key: `employment_rate`
   - Category: Economy
   - Unit: Percentage (%)
   - RAG Thresholds:
     - Green: ≥ 75%
     - Amber: 72-75%
     - Red: < 72%

2. **Employment Rate (16-64)**
   - Metric Key: `employment_rate_16_64`
   - Category: Economy
   - Unit: Percentage (%)
   - RAG Thresholds:
     - Green: ≥ 75%
     - Amber: 72-75%
     - Red: < 72%

## Implementation Details

### Python Script
- **File**: `server/employment_data_fetcher.py`
- **Functionality**:
  - Downloads Excel file directly from Resolution Foundation
  - Parses Excel structure (multi-row headers)
  - Extracts "Alternative estimates" (not ONS LFS figures)
  - Converts decimal rates (0.59) to percentages (59%)
  - Supports both historical and latest-only modes
  - Handles date parsing and formatting

### Excel File Structure
The Resolution Foundation Excel file has a complex structure:
- **Row 0**: Age group labels (Age 16+, Age 16 to 64)
- **Row 1**: Data type labels (Alternative estimates, ONS LFS figures)
- **Row 2**: Column headers (Month, Household population, Employment, Employment rate, etc.)
- **Row 3+**: Actual data

**Column Mapping**:
- Column 3: "Employment rate" - 16+ Alternative estimates
- Column 9: "Employment rate.2" - 16-64 Alternative estimates

### Integration Points

1. **Data Ingestion** (`server/dataIngestion.ts`):
   - Added `fetchEmploymentMetrics()` function
   - Supports historical mode for backfilling

2. **API Router** (`server/routers.ts`):
   - Integrated into Economy category refresh
   - Automatically fetches when Economy metrics are refreshed

3. **Load Script** (`server/loadMetricsData.ts`):
   - Added employment metrics loading
   - Includes historical data backfill

4. **Data Source URLs** (`server/dataIngestion.ts`):
   - Added Resolution Foundation URLs to `getDataSourceUrl()`

## Usage

### Manual Data Load
```bash
npm run load:metrics
```
This will fetch and load employment metrics from Resolution Foundation along with all other metrics.

### Admin Panel Refresh
1. Navigate to dashboard
2. Click "Refresh Data" button
3. Select "Economy" category
4. This will fetch both ONS economy metrics and Resolution Foundation employment metrics

### Historical Data
The script supports historical mode:
```bash
python3 server/employment_data_fetcher.py --historical
```
This fetches all historical data points (272+ entries covering August 2014 to present).

## Data Quality

- **Source Reliability**: High - Based on HMRC administrative tax data
- **Timeliness**: More timely than ONS Labour Force Survey
- **Coverage**: Monthly data from 2014 onwards
- **Accuracy**: Considered more accurate for post-pandemic trends

## Future Updates

The Excel file URL may change when Resolution Foundation updates their data. The script includes:
- Direct URL fallback
- Page scraping fallback to find download links
- Published estimates fallback if downloads fail

To update the URL, modify `EXCEL_DATA_URL` in `server/employment_data_fetcher.py`.

## Verification

Test the integration:
```bash
# Test latest data
python3 server/employment_data_fetcher.py

# Test historical data
python3 server/employment_data_fetcher.py --historical

# Load into database
npm run load:metrics
```

## Status

✅ **Complete** - Resolution Foundation employment data is fully integrated and operational.

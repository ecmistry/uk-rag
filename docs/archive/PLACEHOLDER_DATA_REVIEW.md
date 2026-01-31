# Placeholder Data Review

## Summary

**CRITICAL**: Multiple data fetchers are using placeholder/hardcoded values instead of real data sources.

## Current Status

### ❌ Healthcare Data Fetcher (`server/healthcare_data_fetcher.py`)
**Status**: Using placeholder data for ALL metrics
- **A&E Wait Time**: Hardcoded `4.5 hours`
- **Cancer Wait Time**: Hardcoded `68.0 days`
- **Ambulance Response Time**: Hardcoded `8.5 minutes`

**Real Data Sources Available**:
- NHS England publishes monthly CSV/Excel files for A&E waiting times
- NHS England publishes monthly CSV files for cancer waiting times
- NHS England publishes monthly spreadsheets for ambulance response times

### ❌ Defence Data Fetcher (`server/defence_data_fetcher.py`)
**Status**: Using placeholder data for ALL metrics
- **Defence Spending (% of GDP)**: Hardcoded `2.1%`
- **Equipment Readiness**: Hardcoded `78.0%`
- **Personnel Strength**: Hardcoded `92.0%`

**Real Data Sources Available**:
- MOD publishes annual ODS spreadsheets with spending data
- ONS publishes GDP data (can calculate %)
- Equipment readiness and personnel data may require different sources

### ⚠️ Crime Data Fetcher (`server/crime_data_fetcher.py`)
**Status**: Partially using placeholder data
- **Recorded Crime Rate**: Downloads Excel but returns hardcoded `89.5` (needs proper parsing)
- **Charge Rate**: Hardcoded `7.2%` (needs Police.uk data parsing)

**Real Data Sources Available**:
- ONS publishes quarterly Excel files with crime statistics
- Police.uk publishes outcomes data (charge rates)

### ✅ Education Data Fetcher (`server/education_data_fetcher.py`)
**Status**: Using real API data
- **Attainment 8**: ✅ Uses real DfE API CSV download
- **Teacher Vacancies**: ⚠️ Placeholder function exists but not used
- **NEET**: ⚠️ Placeholder function exists but not used

### ✅ Economy Data Fetcher (`server/economy_data_fetcher.py`)
**Status**: Using real ONS CSV data
- All metrics use real ONS CSV downloads ✅

## Action Required

1. **Healthcare**: Replace all placeholder values with CSV/Excel parsing from NHS England
2. **Defence**: Replace all placeholder values with ODS/CSV parsing from MOD/ONS
3. **Crime**: Fix Excel parsing to extract real values instead of placeholders
4. **Education**: Remove unused placeholder functions

## Data Source URLs

### Healthcare
- A&E: https://www.england.nhs.uk/statistics/statistical-work-areas/ae-waiting-times-and-activity/
- Cancer: https://www.england.nhs.uk/statistics/statistical-work-areas/cancer-waiting-times/
- Ambulance: https://www.england.nhs.uk/statistics/statistical-work-areas/ambulance-quality-indicators/

### Defence
- MOD Spending: https://www.gov.uk/government/statistics/defence-departmental-resources-2024
- ONS GDP: https://www.ons.gov.uk/economy/grossdomesticproductgdp

### Crime
- ONS Crime: https://www.ons.gov.uk/peoplepopulationandcommunity/crimeandjustice/datasets/crimeinenglandandwalesquarterlydatatables
- Police.uk: https://data.police.uk/

#!/usr/bin/env python3
"""
Economy Data Fetcher for UK RAG Dashboard
Data Source & Location: see docs/DATA_SOURCES_UK_RAG.md (canonical).
Uses ONS API: LZVD, IHYP, D7G7, HF6X, NPEL.
"""

import requests
import pandas as pd
from io import StringIO
from datetime import datetime
from typing import Dict, Optional, List
import logging
import json
import os
from os import path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class ONSDataFetcher:
    """Fetches economic data from ONS CSV downloads"""
    
    # ONS Time Series – Data Source & Location per UK RAG spec:
    # Output per Hour: ONS API Series LZVD | Real GDP Growth: IHYP | CPI Inflation: D7G7 | Public Sector Net Debt: HF6X | Business Investment: NPEL
    SERIES_URLS = {
        'real_gdp_growth': {
            'url': 'https://www.ons.gov.uk/generator?format=csv&uri=/economy/grossdomesticproductgdp/timeseries/ihyp/qna',
            'name': 'Real GDP Growth',
            'unit': '%'
        },
        'cpi_inflation': {
            'url': 'https://www.ons.gov.uk/generator?format=csv&uri=/economy/inflationandpriceindices/timeseries/d7g7/mm23',
            'name': 'CPI Inflation',
            'unit': '%'
        },
        'output_per_hour': {
            'url': 'https://www.ons.gov.uk/generator?format=csv&uri=/employmentandlabourmarket/peopleinwork/labourproductivity/timeseries/lzvd/prdy',
            'name': 'Output per Hour',
            'unit': '%'  # ONS LZVD is % change per annum (year-on-year growth)
        },
        'public_sector_net_debt': {
            'url': 'https://www.ons.gov.uk/generator?format=csv&uri=/economy/governmentpublicsectorandtaxes/publicsectorfinance/timeseries/hf6x/pusf',
            'name': 'Public Sector Net Debt',
            'unit': '%'  # HF6X: Net Debt as % of GDP
        },
        'business_investment': {
            'url': 'https://www.ons.gov.uk/generator?format=csv&uri=/economy/grossdomesticproductgdp/timeseries/npel/cxnv',
            'name': 'Business Investment',
            'unit': '%',  # We compute YoY % change from NPEL levels (£m)
            'is_level': True,  # NPEL is level; we output YoY % change
        }
    }
    PLACEHOLDER_METRICS = []  # Phase 4: all Economy metrics from ONS
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'UK-RAG-Dashboard/1.0'
        })
    
    def fetch_csv_series(self, metric_key: str, historical: bool = False) -> Optional[Dict]:
        """
        Fetch a time series from ONS CSV download
        
        Args:
            metric_key: Key identifying the metric
            historical: If True, return all historical data points; if False, return only latest
            
        Returns:
            Dictionary with data points (list if historical=True, single dict if False), or None if failed
        """
        config = self.SERIES_URLS[metric_key]
        url = config['url']
        metric_name = config['name']
        
        try:
            logger.info(f"Fetching {metric_name}")
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            
            # Parse the ONS CSV format
            # First 7-8 rows are metadata, then data starts
            lines = response.text.strip().split('\n')
            
            # Find where data starts (after metadata rows)
            data_start = 0
            for i, line in enumerate(lines):
                # Data rows start with a year/date in quotes
                if line.startswith('"') and len(line.split('","')) == 2:
                    # Check if first field looks like a year or date
                    first_field = line.split('","')[0].strip('"')
                    if first_field.isdigit() or 'Q' in first_field or '-' in first_field:
                        data_start = i
                        break
            
            if data_start == 0:
                logger.error(f"Could not find data start in CSV for {metric_name}")
                return None
            
            # Parse data rows
            data_rows = []
            for line in lines[data_start:]:
                if line.strip():
                    parts = line.strip('"').split('","')
                    if len(parts) == 2:
                        date_str, value_str = parts
                        try:
                            value = float(value_str)
                            data_rows.append({'date': date_str, 'value': value})
                        except ValueError:
                            continue
            
            if not data_rows:
                logger.error(f"No valid data rows found for {metric_name}")
                return None
            
            # Business Investment (NPEL): series is levels (£m); convert to YoY % change
            if config.get('is_level') and metric_key == 'business_investment':
                data_rows = self._compute_yoy_pct_change(data_rows)
                if not data_rows:
                    logger.error(f"Could not compute YoY % for {metric_name}")
                    return None
            
            # If historical mode, return all data points
            if historical:
                historical_results = []
                for row in data_rows:
                    rag = self.calculate_rag_status(metric_key, row['value'])
                    historical_results.append({
                        'metric_name': metric_name,
                        'metric_key': metric_key,
                        'category': 'Economy',
                        'value': row['value'],
                        'time_period': row['date'],
                        'unit': config['unit'],
                        'rag_status': rag,
                        'data_source': 'ONS',
                        'source_url': url,
                        'last_updated': datetime.utcnow().isoformat()
                    })
                logger.info(f"✓ {metric_name}: Fetched {len(historical_results)} historical data points")
                return historical_results  # Return array directly for historical mode

            # Otherwise, return only latest value (for business_investment, data_rows now hold YoY %)
            latest = data_rows[-1]
            val = latest['value']
            rag = self.calculate_rag_status(metric_key, val)
            result = {
                'metric_name': metric_name,
                'metric_key': metric_key,
                'category': 'Economy',
                'value': val,
                'time_period': latest['date'],
                'unit': config['unit'],
                'rag_status': rag,
                'data_source': 'ONS',
                'source_url': url,
                'last_updated': datetime.utcnow().isoformat()
            }
            logger.info(f"✓ {metric_name}: {result['value']}{result.get('unit', '')} ({result['time_period']})")
            return result
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to fetch {metric_name}: {e}")
            return None
        except Exception as e:
            logger.error(f"Failed to parse {metric_name} data: {e}")
            logger.exception(e)
            return None
    
    def _compute_yoy_pct_change(self, data_rows: List[Dict]) -> List[Dict]:
        """Convert level series to YoY % change. Expects date like '2024 Q3' or '2023'. Returns list of {date, value} with value as %."""
        by_period = {}
        for row in data_rows:
            period = str(row['date']).strip()
            try:
                by_period[period] = float(row['value'])
            except (TypeError, ValueError):
                continue
        out = []
        for period in sorted(by_period.keys()):
            prev = None
            if ' Q' in period:
                parts = period.split(' Q')
                if len(parts) == 2 and parts[0].isdigit() and parts[1].isdigit():
                    y, q = int(parts[0]), int(parts[1])
                    prev_period = f"{y - 1} Q{q}"
                    prev = by_period.get(prev_period)
            elif period.isdigit():
                prev = by_period.get(str(int(period) - 1))
            if prev is not None and prev != 0:
                pct = ((by_period[period] - prev) / prev) * 100
                out.append({'date': period, 'value': round(pct, 2)})
        return out

    def _placeholder_metric(self, metric_key: str, name: str, unit: str) -> Dict:
        """Build a single placeholder metric entry."""
        now = datetime.utcnow()
        quarter = (now.month - 1) // 3 + 1
        time_period = f"{now.year} Q{quarter}"
        return {
            'metric_name': name,
            'metric_key': metric_key,
            'category': 'Economy',
            'value': 'placeholder',
            'time_period': time_period,
            'unit': unit,
            'rag_status': 'amber',
            'data_source': 'Placeholder',
            'source_url': '',
            'last_updated': now.isoformat()
        }

    def fetch_all_economy_metrics(self, historical: bool = False) -> Dict[str, Optional[Dict]]:
        """
        Fetch all economy metrics (5 total: Output per Hour, Real GDP Growth,
        CPI Inflation, Public Sector Net Debt, Business Investment).
        Missing data sources return placeholder.
        """
        results = {}
        for key in self.SERIES_URLS.keys():
            results[key] = self.fetch_csv_series(key, historical=historical)
        return results
    
    def calculate_rag_status(self, metric_key: str, value: float) -> str:
        """
        Calculate RAG status based on metric value and thresholds

        Args:
            metric_key: The metric identifier
            value: The metric value

        Returns:
            'red', 'amber', or 'green'
        """
        # RAG Thresholds based on research (Phase 4)
        thresholds = {
            'real_gdp_growth': {
                'green': 2.0,   # >= 2.0% annual growth (strong)
                'amber': 1.0    # 1.0-2.0% growth (moderate)
            },
            'cpi_inflation': {
                'green_min': 1.5,
                'green_max': 2.5,
                'amber_min': 1.0,
                'amber_max': 3.5
            },
            'output_per_hour': {
                'green': 1.0,
                'amber': 0.0
            },
            'public_sector_net_debt': {
                # Net debt % of GDP: lower is better. Green < 90%, Amber 90-100%, Red > 100%
                'green': 90.0,
                'amber': 100.0,
                'lower_is_better': True
            },
            'business_investment': {
                # YoY % change: higher is better. Green >= 2%, Amber >= 0%, Red < 0%
                'green': 2.0,
                'amber': 0.0
            }
        }
        
        if metric_key == 'cpi_inflation':
            t = thresholds[metric_key]
            if t['green_min'] <= value <= t['green_max']:
                return 'green'
            elif t['amber_min'] <= value <= t['amber_max']:
                return 'amber'
            else:
                return 'red'
        t = thresholds.get(metric_key)
        if not t:
            return 'amber'
        if t.get('lower_is_better'):
            if value <= t['green']:
                return 'green'
            elif value <= t['amber']:
                return 'amber'
            else:
                return 'red'
        if value >= t['green']:
            return 'green'
        if value >= t['amber']:
            return 'amber'
        return 'red'


def main():
    """Main execution function"""
    import sys
    
    # Check if historical mode is requested
    historical = '--historical' in sys.argv or '-h' in sys.argv
    
    print("=" * 60)
    print("UK RAG Dashboard - Economy Metrics Fetcher")
    if historical:
        print("MODE: Historical Data (all data points)")
    else:
        print("MODE: Latest Data Only")
    print("=" * 60)
    print()
    
    fetcher = ONSDataFetcher()
    
    # Fetch all metrics
    results = fetcher.fetch_all_economy_metrics(historical=historical)
    
    # Build list of 5 economy metrics: 3 from ONS + 2 placeholders
    rag_results = []
    if historical:
        for key, data in results.items():
            if data and isinstance(data, list):
                rag_results.extend(data)
        # Add one historical-style point per placeholder metric
        for p in ONSDataFetcher.PLACEHOLDER_METRICS:
            rag_results.append(fetcher._placeholder_metric(p['metric_key'], p['name'], p['unit']))
        print(f"\n✓ Fetched {len(rag_results)} total historical data points")
    else:
        print("\n" + "=" * 60)
        print("RAG STATUS SUMMARY")
        print("=" * 60)
        for key, data in results.items():
            if data:
                rag_results.append(data)
                color = {'green': '\033[92m', 'amber': '\033[93m', 'red': '\033[91m'}
                reset = '\033[0m'
                rag = data.get('rag_status', 'amber')
                val = data.get('value', '')
                print(f"{data['metric_name']}: {color[rag]}{rag.upper()}{reset} ({val}{data.get('unit', '')} as of {data['time_period']})")
        for p in ONSDataFetcher.PLACEHOLDER_METRICS:
            entry = fetcher._placeholder_metric(p['metric_key'], p['name'], p['unit'])
            rag_results.append(entry)
            print(f"{entry['metric_name']}: \033[93mAMBER\033[0m (placeholder)")
    
    # Save to JSON file
    output_file = path.join(path.dirname(__file__), 'economy_metrics.json')
    with open(output_file, 'w') as f:
        json.dump(rag_results, f, indent=2)
    
    print(f"\n✓ Results saved to: {output_file}")
    print()
    
    return rag_results


if __name__ == "__main__":
    main()

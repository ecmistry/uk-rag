#!/usr/bin/env python3
"""
Regional Education Data Fetcher for UK RAG Dashboard
Fetches regional Attainment 8 scores for data visualization
"""

import requests
import pandas as pd
import gzip
import io
from datetime import datetime
import json
import sys

def fetch_regional_attainment8():
    """
    Fetch regional Attainment 8 data from DfE API
    
    Returns:
        list: Regional data with region names and Attainment 8 scores
    """
    try:
        print("\n" + "="*60)
        print("Fetching Regional Attainment 8 Data")
        print("="*60)
        
        # DfE Key Stage 4 Performance CSV download (same dataset as main fetcher)
        # Using the same dataset ID that works in education_data_fetcher.py
        url = "https://api.education.gov.uk/statistics/v1/data-sets/b3e19901-5d2b-b676-bb4c-e60937d74725/csv?dataSetVersion=1.0"
        
        print(f"Downloading from: {url}")
        
        response = requests.get(url, timeout=120)
        response.raise_for_status()
        
        print(f"Downloaded {len(response.content)} bytes")
        
        # Try to decompress if gzipped
        try:
            content = gzip.decompress(response.content)
            df = pd.read_csv(io.BytesIO(content))
        except:
            # If not gzipped, read directly
            df = pd.read_csv(io.BytesIO(response.content))
        
        print(f"Total rows: {len(df)}")
        print(f"Columns: {list(df.columns)}")
        
        # Filter for latest time period
        latest_period = df['time_period'].max()
        print(f"\nLatest time period: {latest_period}")
        
        df_latest = df[df['time_period'] == latest_period]
        print(f"Rows for latest period: {len(df_latest)}")
        
        # Filter for regional level data (not national, not local authority)
        # geographic_level should be 'Regional'
        df_regional = df_latest[df_latest['geographic_level'] == 'Regional']
        print(f"Regional rows: {len(df_regional)}")
        
        # Filter for overall data (not broken down by demographics)
        # We want rows where breakdown columns are 'Total' or similar
        df_overall = df_regional[
            (df_regional['sex'] == 'Total') &
            (df_regional['ethnicity_major'] == 'Total')
        ]
        print(f"Overall regional rows: {len(df_overall)}")
        
        # Group by region and take the first (most complete) record for each
        # This avoids duplicates from different demographic breakdowns
        df_unique = df_overall.groupby('region_name').first().reset_index()
        
        # Extract region names and Attainment 8 scores
        regional_data = []
        for _, row in df_unique.iterrows():
            region_name = row['region_name']
            attainment8 = row['attainment8_average']
            
            # Skip if data is missing
            if pd.isna(attainment8) or pd.isna(region_name):
                continue
            
            regional_data.append({
                "region": region_name,
                "attainment8": float(attainment8),
                "time_period": str(latest_period)
            })
        
        # Sort by attainment8 score descending
        regional_data.sort(key=lambda x: x['attainment8'], reverse=True)
        
        print(f"\nExtracted {len(regional_data)} regions:")
        for region in regional_data:
            print(f"  {region['region']}: {region['attainment8']}")
        
        return regional_data
        
    except Exception as e:
        print(f"Error fetching regional attainment data: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return []

def main():
    """Main function to fetch regional education data"""
    print("\n" + "="*60)
    print("UK RAG Dashboard - Regional Education Data Fetcher")
    print("="*60)
    
    regional_data = fetch_regional_attainment8()
    
    if regional_data:
        print("\n" + "="*60)
        print("JSON Output")
        print("="*60)
        print(json.dumps(regional_data, indent=2))
    else:
        print("\nNo regional data retrieved")
        sys.exit(1)

if __name__ == "__main__":
    main()

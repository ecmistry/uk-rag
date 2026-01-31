#!/usr/bin/env python3
"""
Education Data Fetcher for UK RAG Dashboard
Fetches Key Stage 4 Performance, School Workforce, and NEET data from DfE
"""

import requests
import pandas as pd
import gzip
import io
from datetime import datetime
import json

# RAG Thresholds for Education Metrics
RAG_THRESHOLDS = {
    "attainment8": {
        "green": 48.0,  # Above national average
        "amber": 44.0,  # Near national average
        # Red: < 44.0
    },
    "teacher_vacancy_rate": {
        "green": 1.0,   # Low vacancies
        "amber": 2.0,   # Moderate vacancies
        # Red: > 2.0
    },
    "neet_rate": {
        "green": 3.0,   # Low NEET rate
        "amber": 5.0,   # Moderate NEET rate
        # Red: > 5.0
    }
}

def calculate_rag_status(metric_name, value):
    """Calculate RAG status based on thresholds (returns lowercase)"""
    if metric_name not in RAG_THRESHOLDS:
        return "amber"
    
    thresholds = RAG_THRESHOLDS[metric_name]
    
    # For attainment8 (higher is better)
    if metric_name == "attainment8":
        if value >= thresholds["green"]:
            return "green"
        elif value >= thresholds["amber"]:
            return "amber"
        else:
            return "red"
    
    # For vacancy and NEET rates (lower is better)
    else:
        if value < thresholds["green"]:
            return "green"
        elif value < thresholds["amber"]:
            return "amber"
        else:
            return "red"

def fetch_attainment8_data():
    """
    Fetch Key Stage 4 Attainment 8 data from DfE API
    Returns national average Attainment 8 score for latest year
    """
    url = "https://api.education.gov.uk/statistics/v1/data-sets/b3e19901-5d2b-b676-bb4c-e60937d74725/csv?dataSetVersion=1.0"
    
    try:
        print(f"Fetching Attainment 8 data from: {url}")
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        
        # Check if content is gzip compressed
        try:
            # Try to decompress
            decompressed = gzip.decompress(response.content)
            df = pd.read_csv(io.BytesIO(decompressed))
        except gzip.BadGzipFile:
            # Content is not compressed, read directly
            df = pd.read_csv(io.BytesIO(response.content))
        
        print(f"Downloaded {len(df)} rows")
        print(f"Columns: {df.columns.tolist()}")
        
        # Filter for:
        # - National level
        # - Latest time period (2024/25)
        # - All pupils (no specific characteristic filters)
        
        # First, let's see what columns we have
        print(f"\\nSample data (first 5 rows):")
        print(df.head())
        
        # Filter for national level data
        national_data = df[df['geographic_level'] == 'National']
        
        if national_data.empty:
            print("Warning: No national level data found")
            return None
        
        # Get latest time period
        latest_period = national_data['time_period'].max()
        latest_data = national_data[national_data['time_period'] == latest_period]
        
        print(f"\\nLatest time period: {latest_period}")
        print(f"Rows for latest period: {len(latest_data)}")
        
        # Filter for "Total" or all pupils (no specific filters)
        # Look for rows where characteristic columns are "Total" or similar
        if 'school_type' in latest_data.columns:
            all_pupils = latest_data[latest_data['school_type'] == 'Total']
        else:
            all_pupils = latest_data
        
        if all_pupils.empty:
            print("Warning: No 'Total' data found, using first row")
            all_pupils = latest_data.head(1)
        
        # Extract Attainment 8 average
        if 'attainment8_average' in all_pupils.columns:
            attainment8_value = all_pupils['attainment8_average'].iloc[0]
        else:
            print(f"Warning: 'attainment8_average' column not found. Available columns: {all_pupils.columns.tolist()}")
            return None
        
        # Calculate RAG status
        rag_status = calculate_rag_status("attainment8", attainment8_value)
        
        result = {
            "metric_name": "Attainment 8 Score",
            "metric_key": "attainment8",
            "category": "Education",
            "value": float(attainment8_value),
            "rag_status": rag_status,
            "time_period": str(latest_period),
            "data_source": "DfE Key Stage 4 Performance",
            "source_url": "https://explore-education-statistics.service.gov.uk/find-statistics/key-stage-4-performance",
            "last_updated": datetime.now().isoformat()
        }
        
        print(f"\\nAttainment 8 Result:")
        print(f"  Value: {attainment8_value}")
        print(f"  RAG Status: {rag_status}")
        print(f"  Time Period: {latest_period}")
        
        return result
        
    except Exception as e:
        print(f"Error fetching Attainment 8 data: {e}")
        import traceback
        traceback.print_exc()
        return None

def fetch_teacher_vacancy_data():
    """
    Fetch School Workforce teacher vacancy data
    Note: This is a placeholder - actual URL needs to be found
    """
    print("\\nTeacher vacancy data fetcher not yet implemented")
    print("Need to find the correct dataset URL from DfE")
    
    # Placeholder data
    return {
        "metric_name": "Teacher Vacancy Rate",
        "metric_key": "teacher_vacancy_rate",
        "category": "Education",
        "value": 1.5,  # Placeholder
        "rag_status": "amber",
        "time_period": "2024",
        "data_source": "DfE School Workforce Census",
        "source_url": "https://explore-education-statistics.service.gov.uk/find-statistics/school-workforce-in-england",
        "last_updated": datetime.now().isoformat()
    }

def fetch_neet_data():
    """
    Fetch NEET statistics for 16-17 year olds
    Note: This is a placeholder - actual URL needs to be found
    """
    print("\\nNEET data fetcher not yet implemented")
    print("Need to find the correct dataset URL from DfE")
    
    # Placeholder data
    return {
        "metric_name": "NEET Rate (16-17)",
        "metric_key": "neet_rate",
        "category": "Education",
        "value": 4.2,  # Placeholder
        "rag_status": "amber",
        "time_period": "2024",
        "data_source": "DfE NEET Statistics",
        "source_url": "https://explore-education-statistics.service.gov.uk/find-statistics/neet-statistics-annual-brief",
        "last_updated": datetime.now().isoformat()
    }

def fetch_all_education_metrics():
    """Fetch all education metrics"""
    metrics = []
    
    # Fetch Attainment 8
    attainment8 = fetch_attainment8_data()
    if attainment8:
        metrics.append(attainment8)
    
    # Fetch Teacher Vacancies (placeholder)
    teacher_vacancy = fetch_teacher_vacancy_data()
    if teacher_vacancy:
        metrics.append(teacher_vacancy)
    
    # Fetch NEET (placeholder)
    neet = fetch_neet_data()
    if neet:
        metrics.append(neet)
    
    return metrics

if __name__ == "__main__":
    print("=" * 60)
    print("UK RAG Dashboard - Education Data Fetcher")
    print("=" * 60)
    
    metrics = fetch_all_education_metrics()
    
    print("\\n" + "=" * 60)
    print("Summary of Education Metrics")
    print("=" * 60)
    
    for metric in metrics:
        print(f"\\n{metric['metric_name']}:")
        print(f"  Value: {metric['value']}")
        print(f"  RAG Status: {metric['rag_status']}")
        print(f"  Time Period: {metric['time_period']}")
        print(f"  Source: {metric['data_source']}")
    
    # Output as JSON
    print("\\n" + "=" * 60)
    print("JSON Output")
    print("=" * 60)
    print(json.dumps(metrics, indent=2))

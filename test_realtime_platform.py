import unittest
import json
import urllib.parse
import sys
import os

sys.path.append(os.path.abspath('.'))

from app import app, db
from models import University, PlacementRecord, DocumentChunk
from services.realtime_fetcher import scrape_university_details

class TestRealTimePlatform(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True
        self.ctx = app.app_context()
        self.ctx.push()

    def tearDown(self):
        self.ctx.pop()

    def test_01_crawler_execution_and_db_persistence(self):
        print("\n--- Test 1: Executing live crawler sync on a seeded university ---")
        univ = University.query.filter_by(id='parul').first()
        self.assertIsNotNone(univ, "Seeded university 'parul' should exist.")
        
        success, message = scrape_university_details(univ.id)
        self.assertTrue(success, "Sync process should complete successfully.")
        
        db.session.refresh(univ)
        self.assertIsNotNone(univ.last_updated, "last_updated column should be populated after sync.")
        self.assertIsNotNone(univ.crawled_details_json, "crawled_details_json column should be populated after sync.")
        
        details = json.loads(univ.crawled_details_json)
        self.assertIn('total_students', details)
        self.assertIn('total_faculty', details)
        self.assertIn('hostel_fees', details)
        self.assertIn('source_attribution', details)
        self.assertEqual(details['source_attribution'], 'Official University Website')
        
        print(f"   [SUCCESS] Crawl completed. Updated timestamp: {univ.last_updated}")
        clean_fees = str(details['hostel_fees']).replace('₹', 'Rs. ')
        print(f"   [SUCCESS] Total Students: {details['total_students']}, Hostel Fees: {clean_fees}")

    def test_02_network_failure_fallback_grace(self):
        print("\n--- Test 2: Simulating website network/connection offline fallback ---")
        univ = University.query.filter_by(id='parul').first()
        self.assertIsNotNone(univ)
        
        db.session.refresh(univ)
        original_updated = univ.last_updated
        original_json = univ.crawled_details_json
        
        univ.website = "https://this-domain-does-not-exist-at-all-12345.edu"
        db.session.commit()
        
        try:
            success, message = scrape_university_details(univ.id)
            self.assertTrue(success)
            self.assertIn("Website down. Serving last successfully verified data", message)
            
            db.session.refresh(univ)
            self.assertEqual(univ.crawled_details_json, original_json, "Historical data should be preserved.")
            self.assertEqual(univ.last_updated, original_updated, "Last updated timestamp should be preserved.")
            print("   [SUCCESS] Clean fallback caught unreachable host, historical cached data was preserved.")
        finally:
            univ.website = "https://paruluniversity.ac.in"
            db.session.commit()

    def test_03_api_details_response_payload(self):
        print("\n--- Test 3: Querying API endpoints for dynamic crawled metrics ---")
        res = self.app.get('/api/universities?id=parul')
        self.assertEqual(res.status_code, 200)
        
        data = json.loads(res.data)
        self.assertIn('last_updated', data)
        self.assertIn('source_attribution', data)
        self.assertEqual(data['source_attribution'], 'Official University Website')
        
        self.assertIn('hostel', data)
        self.assertIn('fees', data['hostel'])
        self.assertIsNotNone(data['hostel']['fees'])
        
        self.assertIn('stats', data)
        self.assertIn('total_students', data['stats'])
        self.assertIsNotNone(data['stats']['total_students']['value'])
        
        self.assertIn('campus_facilities', data)
        self.assertTrue(isinstance(data['campus_facilities'], list), "campus_facilities should return a list.")
        
        print("   [SUCCESS] /api/universities?id=parul returned correct attributions & stats.")
        print(f"   [SUCCESS] Response details keys: {list(data.keys())[:10]}")

if __name__ == '__main__':
    unittest.main()

import sys
# Reconfigure stdout to print Unicode symbols correctly on Windows
sys.stdout.reconfigure(encoding='utf-8')

import urllib.request
import urllib.parse
import json

def main():
    print("=== STARTING REAL-TIME UNIVERSITY DATA SYNC INTEGRATION TEST ===")
    
    # 1. Trigger POST /api/universities/kbcnmu/sync
    sync_url = "http://127.0.0.1:5000/api/universities/kbcnmu/sync"
    print(f"Triggering sync POST request to: {sync_url}")
    
    try:
        req = urllib.request.Request(sync_url, method='POST')
        with urllib.request.urlopen(req, timeout=12) as response:
            status = response.status
            res_body = json.loads(response.read().decode('utf-8'))
            print(f"Sync response: Status={status}, Response={res_body}")
            
            if status == 200 and res_body.get('success'):
                print("✅ SUCCESS: Live crawler sync endpoint executed successfully!")
            else:
                print(f"❌ ERROR: Live crawler sync failed. Response: {res_body}")
                sys.exit(1)
    except Exception as e:
        print(f"❌ ERROR: Failed to request sync endpoint: {e}")
        sys.exit(1)

    # 2. Verify GET /api/universities?id=kbcnmu has populated announcements
    details_url = "http://127.0.0.1:5000/api/universities?id=kbcnmu"
    print(f"\nRetrieving updated details from: {details_url}")
    
    try:
        with urllib.request.urlopen(details_url, timeout=5) as response:
            res_body = json.loads(response.read().decode('utf-8'))
            announcements = res_body.get('announcements', [])
            print(f"Retrieved {len(announcements)} announcement(s) for KBCNMU:")
            for idx, ann in enumerate(announcements):
                print(f"  {idx+1}. [{ann['type']}] {ann['title']}")
                print(f"      Description: {ann['desc'][:100]}...")
            
            if len(announcements) > 0:
                print("✅ SUCCESS: Dynamic announcements successfully scraped and indexed!")
            else:
                print("❌ ERROR: Announcements list is empty.")
                sys.exit(1)
    except Exception as e:
        print(f"❌ ERROR: Failed to request details endpoint: {e}")
        sys.exit(1)

    print("\n=== ALL REAL-TIME CRAWLER SYNC VERIFICATIONS PASSED ===")

if __name__ == "__main__":
    main()

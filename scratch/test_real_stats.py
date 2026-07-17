import urllib.request
import json
import sys
# Reconfigure stdout to print Unicode symbols correctly on Windows
sys.stdout.reconfigure(encoding='utf-8')

def main():
    print("=== STARTING REAL-WORLD STATS VERIFICATION TEST ===")
    
    test_cases = [
        ("parul", 14102, 1180),
        ("iitb", 28189, 2419),
        ("iitd", 28547, 2498)
    ]
    
    for univ_id, expected_students, expected_papers in test_cases:
        url = f"http://127.0.0.1:5000/api/universities?id={univ_id}"
        print(f"\nRequesting details for: {univ_id} from {url}")
        try:
            with urllib.request.urlopen(url, timeout=5) as response:
                data = json.loads(response.read().decode('utf-8'))
                stats = data.get('stats', {})
                
                students_val = stats.get('total_students', {}).get('value')
                papers_val = stats.get('research_papers', {}).get('value')
                
                print(f"  Result -> Total Students: {students_val} (Expected: {expected_students})")
                print(f"  Result -> Research Papers: {papers_val} (Expected: {expected_papers})")
                
                if int(students_val) == expected_students and int(papers_val) == expected_papers:
                    print(f"  ✅ SUCCESS: Real-world stats correctly returned for {univ_id}!")
                else:
                    print(f"  ❌ ERROR: Stats value mismatch for {univ_id}.")
                    sys.exit(1)
        except Exception as e:
            print(f"  ❌ ERROR: Request failed: {e}")
            sys.exit(1)
            
    print("\n=== ALL REAL-WORLD STATS VERIFICATIONS PASSED ===")

if __name__ == "__main__":
    main()

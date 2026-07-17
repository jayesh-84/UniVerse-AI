import urllib.request
import urllib.parse
import json

BASE_URL = "http://127.0.0.1:5000"

def make_request(path, method="GET", data=None, headers=None):
    url = f"{BASE_URL}{path}"
    headers = headers or {}
    
    req_data = None
    if data is not None:
        req_data = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"
        
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as resp:
            status = resp.status
            body = json.loads(resp.read().decode("utf-8"))
            return status, body
    except urllib.error.HTTPError as e:
        try:
            body = json.loads(e.read().decode("utf-8"))
        except Exception:
            body = e.reason
        return e.code, body
    except Exception as e:
        return 0, str(e)

def main():
    print("=== STARTING INTELLIGENT FEATURES BACKEND TEST SUITE ===")
    
    # 1. Test University Comparison Detail Payload Expansion
    status, res = make_request("/api/universities?id=iitb")
    print(f"1. GET /api/universities?id=iitb: Status={status}")
    if status == 200:
        print(f"   Name: {res.get('university_name')}")
        print(f"   Accreditation: {res.get('accreditation')}")
        print(f"   Ranking: {res.get('ranking')}")
        print(f"   Scholarships: {res.get('scholarships')}")
        print(f"   Research count: {res.get('stats', {}).get('research_papers', {}).get('value')}")
    else:
        print("   FAILED to fetch university info!")
        return

    # 2. Test College Predictor
    status, res = make_request("/api/predict-colleges", "POST", {
        "rank": 4500,
        "category": "General",
        "home_state": "Maharashtra"
    })
    print(f"\n2. POST /api/predict-colleges: Status={status}")
    if status == 200:
        for idx, col in enumerate(res[:3]):
            print(f"   [{idx+1}] College: {col['university_name']}, Cutoff: {col['cutoff']}, Prob: {col['probability']}, Location: {col['location']}")
    else:
        print("   FAILED predictor test!")
        return

    # 3. Test Scholarship Finder
    status, res = make_request("/api/find-scholarships", "POST", {
        "income": 200000,
        "marks": 92,
        "category": "OBC"
    })
    print(f"\n3. POST /api/find-scholarships: Status={status}")
    if status == 200:
        for idx, sch in enumerate(res[:3]):
            print(f"   [{idx+1}] Title: {sch['title']}, Offered by: {sch['university_name']}, Amount: {sch['amount']}, Elig: {sch['eligibility'][:60]}...")
    else:
        print("   FAILED scholarship finder test!")
        return

    # 4. Test AI Recommendations
    status, res = make_request("/api/recommend", "POST", {
        "budget": 250000,
        "location": "Mumbai",
        "branch": "Computer Science",
        "interest": "Placement",
        "rank": 2000
    })
    print(f"\n4. POST /api/recommend: Status={status}")
    if status == 200:
        for idx, rec in enumerate(res[:3]):
            fee_clean = str(rec['fee']).encode('ascii', 'ignore').decode('ascii')
            print(f"   [{idx+1}] Recommended: {rec['university_name']} - {rec['course_name']}, Fee: {fee_clean}, NIRF: {rec['ranking']}, Score: {rec['score']}")
    else:
        print("   FAILED recommendations test!")
        return

    print("\n=== ALL INTELLIGENT FEATURES VERIFIED SUCCESSFULLY ===")

if __name__ == "__main__":
    main()

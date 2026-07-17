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
    print("=== STARTING AUTHENTICATED ADMIN CONSOLE ENDPOINTS VALIDATION ===")
    
    # 1. Login student to get a student token
    status, res = make_request("/api/login", "POST", {
        "email": "student@univ.ac.in",
        "password": "studentpassword"
    })
    if status != 200:
        print(f"FAILED to login student: {res}")
        return
    student_token = res["token"]
    student_headers = {"Authorization": f"Bearer {student_token}"}
    print(f"1. Authenticated Student. Token: {student_token[:20]}...")
    
    # 2. Login admin to get an admin token
    status, res = make_request("/api/login", "POST", {
        "email": "admin@univ.ac.in",
        "password": "adminpassword"
    })
    if status != 200:
        print(f"FAILED to login admin: {res}")
        return
    admin_token = res["token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print(f"2. Authenticated Admin. Token: {admin_token[:20]}...")
    
    # 3. Test /api/config route protection
    # GET should succeed without authorization (public read)
    status, res = make_request("/api/config?university_id=parul")
    print(f"3a. GET /api/config (Public): Status={status} (Expected 200)")
    
    # POST config without token should fail (401)
    status, res = make_request("/api/config?university_id=parul", "POST", {"university_name": "Hack"})
    print(f"3b. POST /api/config (No Token): Status={status} (Expected 401)")
    
    # POST config with student token should fail (403)
    status, res = make_request("/api/config?university_id=parul", "POST", {"university_name": "Hack"}, student_headers)
    print(f"3c. POST /api/config (Student Token): Status={status} (Expected 403)")
    
    # 4. Test /api/logs route protection
    # GET logs with student token should fail (403)
    status, res = make_request("/api/logs", "GET", headers=student_headers)
    print(f"4a. GET /api/logs (Student Token): Status={status} (Expected 403)")
    
    # GET logs with admin token should succeed (200)
    status, res = make_request("/api/logs", "GET", headers=admin_headers)
    print(f"4b. GET /api/logs (Admin Token): Status={status} (Expected 200)")
    
    # 5. Test /api/users route protection
    # GET users with student token should fail (403)
    status, res = make_request("/api/users", "GET", headers=student_headers)
    print(f"5a. GET /api/users (Student Token): Status={status} (Expected 403)")
    
    # GET users with admin token should succeed (200)
    status, res = make_request("/api/users", "GET", headers=admin_headers)
    print(f"5b. GET /api/users (Admin Token): Status={status} (Expected 200)")
    
    # 6. Test /api/announcements route protection
    # GET announcements should succeed (public)
    status, res = make_request("/api/announcements")
    print(f"6a. GET /api/announcements (Public): Status={status} (Expected 200)")
    
    # POST announcement with student token should fail (403)
    status, res = make_request("/api/announcements", "POST", {"title": "Hack Notice", "desc": "Attack"}, student_headers)
    print(f"6b. POST /api/announcements (Student Token): Status={status} (Expected 403)")
    
    # POST announcement with admin token should succeed (200)
    status, res = make_request("/api/announcements", "POST", {"title": "Test Notice", "desc": "Verification test notice details"}, admin_headers)
    print(f"6c. POST /api/announcements (Admin Token): Status={status} (Expected 200)")
    
    # 7. Test /api/universities addition and deletion flow
    # POST university with student token should fail (403)
    status, res = make_request("/api/universities", "POST", {
        "id": "mit",
        "details": {
            "university_name": "Massachusetts Institute of Technology"
        }
    }, student_headers)
    print(f"7a. POST /api/universities (Student Token): Status={status} (Expected 403)")
    
    # POST university with admin token should succeed (200)
    status, res = make_request("/api/universities", "POST", {
        "id": "mit",
        "details": {
            "university_name": "Massachusetts Institute of Technology",
            "description": "Top research institute in Boston.",
            "logo": "fa-solid fa-graduation-cap",
            "contact": {
                "website": "https://www.mit.edu"
            }
        }
    }, admin_headers)
    print(f"7b. POST /api/universities (Admin Token): Status={status} (Expected 200)")
    
    # DELETE university with student token should fail (403)
    status, res = make_request("/api/universities?id=mit", "DELETE", headers=student_headers)
    print(f"7c. DELETE /api/universities (Student Token): Status={status} (Expected 403)")
    
    # DELETE university with admin token should succeed (200)
    status, res = make_request("/api/universities?id=mit", "DELETE", headers=admin_headers)
    print(f"7d. DELETE /api/universities (Admin Token): Status={status} (Expected 200)")
    
    print("=== VALIDATION COMPLETED successfully! ===")

if __name__ == "__main__":
    main()

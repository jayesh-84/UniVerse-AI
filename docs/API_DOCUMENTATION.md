# REST API Documentation

This document describes the core API endpoints of the **UniVerse AI Student Helpdesk Portal**.

## Authentication & Sessions

All private endpoints require Bearer JWT authentication. Include the header `Authorization: Bearer <token>` in your requests.

---

### 1. Register User
* **Endpoint**: `POST /api/register`
* **Rate Limit**: 10 requests / minute
* **Request Body**:
```json
{
  "fullname": "John Doe",
  "email": "johndoe@example.com",
  "password": "secure_password",
  "role": "Student",
  "preferred_university": "parul"
}
```
* **Response (Success - 201)**:
```json
{
  "success": true,
  "message": "Registration successful! Verification email sent."
}
```

---

### 2. Login
* **Endpoint**: `POST /api/login`
* **Rate Limit**: 15 requests / minute
* **Request Body**:
```json
{
  "email": "johndoe@example.com",
  "password": "secure_password",
  "remember": true
}
```
* **Response (Success - 200)**:
```json
{
  "success": true,
  "message": "Welcome back, John Doe!",
  "token": "JWT_ACCESS_TOKEN",
  "user": {
    "id": 1,
    "fullname": "John Doe",
    "email": "johndoe@example.com",
    "role": "Student",
    "status": "Active"
  }
}
```

---

### 3. Token Refresh
* **Endpoint**: `POST /api/refresh`
* **Request Body**: None (Reads `refresh_token` from HTTPOnly cookie)
* **Response (Success - 200)**:
```json
{
  "success": true,
  "token": "NEW_JWT_ACCESS_TOKEN"
}
```

---

## Intelligent Features (Public APIs)

---

### 1. Predict College Admission
* **Endpoint**: `POST /api/predict-colleges`
* **Request Body**:
```json
{
  "rank": 2500,
  "category": "OBC",
  "home_state": "Maharashtra"
}
```
* **Response (Success - 200)**:
```json
[
  {
    "university_id": "iitb",
    "university_name": "IIT Bombay",
    "ranking": "3",
    "cutoff": 7000,
    "probability": "High Match",
    "location": "Mumbai, Maharashtra"
  }
]
```

---

### 2. Find Eligible Scholarships
* **Endpoint**: `POST /api/find-scholarships`
* **Request Body**:
```json
{
  "income": 150000,
  "marks": 92,
  "category": "General"
}
```
* **Response (Success - 200)**:
```json
[
  {
    "id": 1,
    "title": "Merit-cum-Means Scholarship",
    "university_id": "parul",
    "amount": "Rs. 50,000",
    "eligibility": "Income < 6,000,000 and Marks > 80"
  }
]
```

---

## CRUD API v2 Endpoints

The system exposes full CRUD endpoints generated dynamically for administrative models under `/api/v2/`.

### Paginated Requests
All `/api/v2/<model>` endpoints support optional query parameters for pagination:
* `page` (int) - The page number (e.g., `1`)
* `limit` (int) - The number of records per page (e.g., `10`)

Pagination metadata is returned in the response headers:
* `X-Total-Count`: Total number of records matching filters.
* `X-Limit`: Items returned per page.
* `X-Page`: Current page returned.
* `X-Total-Pages`: Total pages available.

Example models:
* `GET /api/v2/announcements`
* `GET /api/v2/notifications`
* `GET /api/v2/scholarships`

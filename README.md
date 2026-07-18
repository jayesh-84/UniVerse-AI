<p align="center">
  <img src="screenshots/banner.jpg" width="85%">
</p>

# 🎓 UniVerse AI Student Helpdesk Portal

<p align="center">

![Python](https://img.shields.io/badge/Python-3.12-blue?style=for-the-badge&logo=python)
![Flask](https://img.shields.io/badge/Flask-Web_Framework-black?style=for-the-badge&logo=flask)
![Gemini AI](https://img.shields.io/badge/Gemini-AI-orange?style=for-the-badge&logo=google)
![SQLite](https://img.shields.io/badge/SQLite-Database-blue?style=for-the-badge&logo=sqlite)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

</p>

## 📑 Table of Contents

- ✨ Features
- 🛡 Security
- 🖼 Screenshots
- 🛠 Tech Stack
- 📁 Project Structure
- ⚙ Installation
- 🚀 Usage
- 📌 Future Enhancements
- 👨‍💻 Developer

## 🚀 Features

- 🤖 AI Chatbot (Gemini API)
- 🏛️ University Information
- ⚖️ University Comparison
- 🎯 AI Career Roadmap
- 🎓 Scholarship Finder
- 📄 AI Resume Builder
- 🎤 AI Mock Interview
- ✅ Admission Checklist
- 📌 Application Tracker
- 🔖 Bookmark Universities
- 🔔 Notification Center
- 👤 Student Dashboard
- 🔐 JWT Authentication
- 📊 Real-time University Data Integration

## 🛡 Production Security & Optimization

* **JWT Session Authentication**: Fully secured JWT cookie authentication using `bcrypt` password hashing, dynamic `secure` flags (HTTPS enforcement in production), and HttpOnly session cookies.
* **SQL Injection & XSS Protection**: All database queries are structured through SQLAlchemy ORM parameters. All HTML templates enforce Jinja2 sanitization.
* **Rate Limiting**: Sliding-window IP rate limit protection (`@rate_limit`) on authenticating endpoints (`/api/login`, `/api/register`) to prevent brute-force attacks.
* **centralized Error Handler**: Centralized server exception logging with auto-rollback (`db.session.rollback()`) to prevent SQLite database locks and keep raw database trace logs hidden from clients.
* **Database Query Optimization**: Complete indexing (`index=True`) on foreign key columns and frequently queried filters to accelerate response times.
* **REST API Pagination**: Pagination enabled on core APIs, communicating metadata via standard HTTP Headers (`X-Total-Count`, `X-Limit`, etc.) to keep full backward-compatibility with flat array client JSON structures.
* **Browser Caching & Asset Compression**: GZIP compression hook combined with HTTP `Cache-Control` header caching policies for `/static/*` files.

<h2 align="center">📸 Screenshots</h2>

<p align="center">
  <img src="screenshots/home.png" width="48%">
  <img src="screenshots/dashboard.png" width="48%">
</p>

<p align="center">
  <img src="screenshots/university.png" width="48%">
  <img src="screenshots/scholarship-finder.png" width="48%">
</p>

<p align="center">
  <img src="screenshots/ai-chatbot.png" width="48%">
  <img src="screenshots/ai-comparison.png" width="48%">
</p>

<p align="center">
  <img src="screenshots/ai-career-roadmap.png" width="48%">
  <img src="screenshots/ai-resume-builder.png" width="48%">
</p>

<p align="center">
  <img src="screenshots/ai-mock-interview.png" width="48%">
  <img src="screenshots/application-tracker.png" width="48%">
</p>

<p align="center">
  <img src="screenshots/notifications.png" width="48%">
  <img src="screenshots/profile.png" width="48%">
</p>

## 🛠 Tech Stack

| Category | Technology |
|----------|------------|
| Backend | Flask |
| Frontend | HTML, CSS, JavaScript |
| AI | Gemini AI |
| Database | SQLite |
| Authentication | JWT |
| Styling | Bootstrap |
| APIs | Google Gemini API |

## Project Structure

```text
├── app.py                      # Main Flask application and server routes
├── models.py                   # SQLAlchemy database schemas with indexations
├── utils.py                    # Token authentications, decorators, and JWT helper utilities
├── controllers/
│   └── crud_factory.py         # Dynamic REST API CRUD controller factory with pagination
├── services/
│   └── realtime_fetcher.py     # Live crawler university facts parser and crawler engine
├── docs/
│   ├── API_DOCUMENTATION.md    # API endpoints payload and headers documentation
│   └── DEPLOYMENT_GUIDE.md     # Production Gunicorn, systemd, and Nginx deployment instructions
├── static/                     # Custom stylesheet and JS bundle files
├── templates/                  # Jinja2 HTML layout pages (index.html, portal.html)
└── requirements.txt            # System dependencies
```

## ⚙ Installation

### 1. Clone Repository

```bash
git clone https://github.com/jayesh-84/UniVerse-AI.git
```

### 2. Install Requirements

```bash
pip install -r requirements.txt
```

### 3. Run

```bash
python app.py
```

## 🚀 Usage

1. Open the application.
2. Select your university.
3. Explore AI recommendations.
4. Compare universities.
5. Find scholarships.
6. Build your resume.
7. Practice mock interviews.

## 🚀 Future Enhancements

- [ ] OCR Document Verification
- [ ] Voice Assistant
- [ ] Multi-language Support
- [ ] Mobile App
- [ ] AI Chat History
- [ ] Student Community Forum

# 👨‍💻 Developer

**Jayesh Patil**

🎓 B.Tech Computer Science (Artificial Intelligence)

🏫 Parul University, Vadodara, Gujarat

🔗 GitHub: https://github.com/jayesh-84

💼 LinkedIn: https://www.linkedin.com/in/jayesh-patil-719426327/

📧 Email: jp9082617@gmail.com

💡 Passionate about AI, Full Stack Development, and UI/UX.

---

<hr>

<p align="center">
Made with ❤️ by <b>Jayesh Patil</b>
</p>

<p align="center">
⭐ If you found this project useful, please give it a Star!
</p>
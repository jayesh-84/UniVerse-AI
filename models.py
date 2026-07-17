from flask_sqlalchemy import SQLAlchemy
import json

db = SQLAlchemy()

# 1. User Model
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    fullname = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    enrollment_id = db.Column(db.String(50), unique=True, nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    qualification = db.Column(db.String(100), nullable=True)
    country = db.Column(db.String(100), nullable=True)
    state = db.Column(db.String(100), nullable=True)
    city = db.Column(db.String(100), nullable=True)
    student_status = db.Column(db.String(100), nullable=True)
    preferred_course = db.Column(db.String(120), nullable=True)
    preferred_university = db.Column(db.String(100), nullable=True)
    role = db.Column(db.String(20), default='Student') # Student, Faculty, Admin
    verified = db.Column(db.Boolean, default=False)
    otp_code = db.Column(db.String(10), nullable=True)
    reset_otp = db.Column(db.String(10), nullable=True)
    password_hash = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(20), default='Active') # Active, Suspended

    def to_dict(self):
        return {
            'id': self.id,
            'fullname': self.fullname,
            'email': self.email,
            'enrollment_id': self.enrollment_id,
            'phone': self.phone or '',
            'qualification': self.qualification or '',
            'country': self.country or '',
            'state': self.state or '',
            'city': self.city or '',
            'student_status': self.student_status or '',
            'preferred_course': self.preferred_course or '',
            'preferred_university': self.preferred_university or '',
            'role': self.role,
            'verified': self.verified,
            'status': self.status
        }

class UserSession(db.Model):
    __tablename__ = 'user_sessions'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(120), index=True, nullable=False) # user email
    refresh_token = db.Column(db.String(255), unique=True, nullable=False)
    expires_at = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.String(50), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'refresh_token': self.refresh_token,
            'expires_at': self.expires_at,
            'created_at': self.created_at
        }

# 2. University Model
class University(db.Model):
    __tablename__ = 'universities'
    id = db.Column(db.String(100), primary_key=True) # e.g. 'parul', 'kbcnmu'
    university_name = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=True)
    email = db.Column(db.String(120), nullable=True)
    phone = db.Column(db.String(50), nullable=True)
    address = db.Column(db.String(255), nullable=True)
    office_hours = db.Column(db.String(150), nullable=True)
    website = db.Column(db.String(200), nullable=True)
    ranking = db.Column(db.String(100), nullable=True)
    accreditation = db.Column(db.String(100), nullable=True)
    logo = db.Column(db.String(100), nullable=True)
    brochure_url = db.Column(db.String(255), nullable=True)
    virtual_tour_url = db.Column(db.String(255), nullable=True)
    last_updated = db.Column(db.String(50), nullable=True)
    crawled_details_json = db.Column(db.Text, nullable=True) # Stored JSON containing extra crawled fields

    def to_dict(self):
        import json
        extra = {}
        if self.crawled_details_json:
            try:
                extra = json.loads(self.crawled_details_json)
            except Exception:
                pass
        return {
            'id': self.id,
            'university_name': self.university_name,
            'description': self.description or '',
            'email': self.email or '',
            'phone': self.phone or '',
            'address': self.address or '',
            'office_hours': self.office_hours or '',
            'website': self.website or '',
            'ranking': self.ranking or '',
            'accreditation': self.accreditation or '',
            'logo': self.logo or '',
            'brochure_url': self.brochure_url or '',
            'virtual_tour_url': self.virtual_tour_url or '',
            'last_updated': self.last_updated or '',
            'extra_details': extra
        }

# 3. Department Model
class Department(db.Model):
    __tablename__ = 'departments'
    id = db.Column(db.Integer, primary_key=True)
    university_id = db.Column(db.String(100), db.ForeignKey('universities.id'), index=True, nullable=False)
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'university_id': self.university_id,
            'name': self.name,
            'description': self.description or ''
        }

# 4. Course Model
class Course(db.Model):
    __tablename__ = 'courses'
    id = db.Column(db.Integer, primary_key=True)
    university_id = db.Column(db.String(100), db.ForeignKey('universities.id'), index=True, nullable=False)
    name = db.Column(db.String(120), nullable=False)
    duration = db.Column(db.String(50), nullable=True)
    fee = db.Column(db.String(100), nullable=True)
    syllabus_json = db.Column(db.Text, nullable=True) # Store semesters JSON block as text

    def to_dict(self):
        syll = {}
        if self.syllabus_json:
            try:
                syll = json.loads(self.syllabus_json)
            except Exception:
                pass
        return {
            'id': self.id,
            'university_id': self.university_id,
            'name': self.name,
            'duration': self.duration or '',
            'fee': self.fee or '',
            'syllabus': syll
        }

# 5. Faculty Model
class Faculty(db.Model):
    __tablename__ = 'faculty'
    id = db.Column(db.Integer, primary_key=True)
    university_id = db.Column(db.String(100), db.ForeignKey('universities.id'), index=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    designation = db.Column(db.String(100), nullable=True)
    department = db.Column(db.String(100), nullable=True)
    email = db.Column(db.String(120), nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'university_id': self.university_id,
            'name': self.name,
            'designation': self.designation or '',
            'department': self.department or '',
            'email': self.email or ''
        }

# 6. Announcement Model
class Announcement(db.Model):
    __tablename__ = 'announcements'
    id = db.Column(db.Integer, primary_key=True)
    university_id = db.Column(db.String(100), db.ForeignKey('universities.id'), index=True, nullable=False)
    title = db.Column(db.String(200), nullable=False)
    type = db.Column(db.String(50), default='General')
    desc = db.Column(db.Text, nullable=True)
    image = db.Column(db.String(255), nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'university_id': self.university_id,
            'title': self.title,
            'type': self.type,
            'desc': self.desc or '',
            'image': self.image or ''
        }

# 7. Gallery Item Model
class GalleryItem(db.Model):
    __tablename__ = 'gallery'
    id = db.Column(db.Integer, primary_key=True)
    university_id = db.Column(db.String(100), db.ForeignKey('universities.id'), index=True, nullable=False)
    image_url = db.Column(db.String(255), nullable=False)
    caption = db.Column(db.String(200), nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'university_id': self.university_id,
            'image_url': self.image_url,
            'caption': self.caption or ''
        }

# 8. Placement Record Model
class PlacementRecord(db.Model):
    __tablename__ = 'placements'
    id = db.Column(db.Integer, primary_key=True)
    university_id = db.Column(db.String(100), db.ForeignKey('universities.id'), unique=True, nullable=False)
    highest_package = db.Column(db.String(100), nullable=True)
    average_package = db.Column(db.String(100), nullable=True)
    placement_rate = db.Column(db.String(50), nullable=True)
    top_recruiters_json = db.Column(db.Text, nullable=True) # JSON list array as text

    def to_dict(self):
        recs = []
        if self.top_recruiters_json:
            try:
                recs = json.loads(self.top_recruiters_json)
            except Exception:
                pass
        return {
            'id': self.id,
            'university_id': self.university_id,
            'highest_package': self.highest_package or '',
            'average_package': self.average_package or '',
            'placement_rate': self.placement_rate or '',
            'top_recruiters': recs
        }

# 9. Scholarship Model
class Scholarship(db.Model):
    __tablename__ = 'scholarships'
    id = db.Column(db.Integer, primary_key=True)
    university_id = db.Column(db.String(100), db.ForeignKey('universities.id'), index=True, nullable=False)
    title = db.Column(db.String(150), nullable=False)
    eligibility = db.Column(db.Text, nullable=True)
    amount = db.Column(db.String(100), nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'university_id': self.university_id,
            'title': self.title,
            'eligibility': self.eligibility or '',
            'amount': self.amount or ''
        }

# 10. FAQ Item Model
class FAQItem(db.Model):
    __tablename__ = 'faqs'
    id = db.Column(db.Integer, primary_key=True)
    university_id = db.Column(db.String(100), db.ForeignKey('universities.id'), index=True, nullable=False)
    question = db.Column(db.Text, nullable=False)
    answer = db.Column(db.Text, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'university_id': self.university_id,
            'question': self.question,
            'answer': self.answer
        }

# 10b. Hostel Model
class Hostel(db.Model):
    __tablename__ = 'hostels'
    id = db.Column(db.Integer, primary_key=True)
    university_id = db.Column(db.String(100), db.ForeignKey('universities.id'), unique=True, nullable=False)
    names = db.Column(db.String(255), nullable=True)
    fees = db.Column(db.String(255), nullable=True)
    warden_contact = db.Column(db.String(100), nullable=True)
    facilities_json = db.Column(db.Text, nullable=True)
    details = db.Column(db.Text, nullable=True)

    def to_dict(self):
        facs = []
        if self.facilities_json:
            try:
                facs = json.loads(self.facilities_json)
            except Exception:
                pass
        return {
            'id': self.id,
            'university_id': self.university_id,
            'names': self.names or '',
            'fees': self.fees or '',
            'warden_contact': self.warden_contact or '',
            'facilities': facs,
            'details': self.details or ''
        }

# 10c. Event Model
class Event(db.Model):
    __tablename__ = 'events'
    id = db.Column(db.Integer, primary_key=True)
    university_id = db.Column(db.String(100), db.ForeignKey('universities.id'), index=True, nullable=False)
    title = db.Column(db.String(255), nullable=False)
    date = db.Column(db.String(100), nullable=True)
    desc = db.Column(db.Text, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'university_id': self.university_id,
            'title': self.title,
            'date': self.date or '',
            'desc': self.desc or ''
        }

# 11a. Chat Session Model
class ChatSession(db.Model):
    __tablename__ = 'chat_sessions'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(120), index=True, nullable=False)
    university_id = db.Column(db.String(100), index=True, nullable=True)
    title = db.Column(db.String(150), default="New Chat")
    timestamp = db.Column(db.String(50), nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'university_id': self.university_id or '',
            'title': self.title,
            'timestamp': self.timestamp or ''
        }

# 11b. Chat History Item Model
class ChatHistoryItem(db.Model):
    __tablename__ = 'chat_history'
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('chat_sessions.id', ondelete='CASCADE'), index=True, nullable=True)
    user_id = db.Column(db.String(120), index=True, nullable=False) # Maps to user email
    university_id = db.Column(db.String(100), index=True, nullable=True)
    sender = db.Column(db.String(20), default='user') # 'user' or 'bot'
    message = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.String(50), nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'session_id': self.session_id,
            'user_id': self.user_id,
            'university_id': self.university_id or '',
            'sender': self.sender,
            'message': self.message,
            'timestamp': self.timestamp or ''
        }

# 12. Bookmark Model
class Bookmark(db.Model):
    __tablename__ = 'bookmarks'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(120), index=True, nullable=False) # Maps to user email
    university_id = db.Column(db.String(100), index=True, nullable=True)
    item_type = db.Column(db.String(50), nullable=True, default='university') # 'university', 'course', 'scholarship', 'announcement', 'faculty', 'gallery'
    item_id = db.Column(db.String(100), nullable=True) # The ID or key of the item
    title = db.Column(db.String(255), nullable=True)
    subtitle = db.Column(db.String(255), nullable=True)
    timestamp = db.Column(db.String(50), nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'university_id': self.university_id or '',
            'item_type': self.item_type,
            'item_id': self.item_id,
            'title': self.title or '',
            'subtitle': self.subtitle or '',
            'timestamp': self.timestamp or ''
        }

# 13. Notification Item Model
class NotificationItem(db.Model):
    __tablename__ = 'notifications'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(120), index=True, nullable=False) # Maps to user email
    title = db.Column(db.String(150), nullable=False)
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    timestamp = db.Column(db.String(50), nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'message': self.message,
            'is_read': self.is_read,
            'timestamp': self.timestamp or ''
        }

# 14. System Setting Model
class SystemSetting(db.Model):
    __tablename__ = 'settings'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(120), nullable=True) # Optional link to specific user
    key = db.Column(db.String(100), unique=True, nullable=False)
    value = db.Column(db.Text, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id or '',
            'key': self.key,
            'value': self.value or ''
        }

# 15. RAG Document Chunk Model
class DocumentChunk(db.Model):
    __tablename__ = 'document_chunks'
    id = db.Column(db.Integer, primary_key=True)
    university_id = db.Column(db.String(100), index=True, nullable=False)
    category = db.Column(db.String(50), nullable=False) # e.g. 'admissions', 'courses', 'hostel', etc.
    content = db.Column(db.Text, nullable=False)
    embedding_json = db.Column(db.Text, nullable=True) # JSON list of floats

    def to_dict(self):
        return {
            'id': self.id,
            'university_id': self.university_id,
            'category': self.category,
            'content': self.content
        }

# 16. Favorite Course Model
class FavoriteCourse(db.Model):
    __tablename__ = 'favorite_courses'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(120), index=True, nullable=False)
    course_id = db.Column(db.Integer, nullable=False)
    timestamp = db.Column(db.String(50), nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'course_id': self.course_id,
            'timestamp': self.timestamp or ''
        }

# 17. Application Model
class Application(db.Model):
    __tablename__ = 'applications'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(120), index=True, nullable=False)
    university_id = db.Column(db.String(100), index=True, nullable=False)
    course_name = db.Column(db.String(120), nullable=False)
    status = db.Column(db.String(50), default='Applied') # Applied, Under Review, Offered, Rejected, Accepted
    applied_date = db.Column(db.String(50), nullable=True)
    notes = db.Column(db.Text, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'university_id': self.university_id,
            'course_name': self.course_name,
            'status': self.status,
            'applied_date': self.applied_date or '',
            'notes': self.notes or ''
        }

# 18. Recent Search Model
class RecentSearch(db.Model):
    __tablename__ = 'recent_searches'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(120), index=True, nullable=False)
    query = db.Column(db.String(255), nullable=False)
    timestamp = db.Column(db.String(50), nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'query': self.query,
            'timestamp': self.timestamp or ''
        }

# 18b. Recently Viewed Item Model
class RecentlyViewedItem(db.Model):
    __tablename__ = 'recently_viewed'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(120), index=True, nullable=False) # Maps to user email
    item_type = db.Column(db.String(50), nullable=False) # 'university', 'course', 'scholarship', 'announcement', 'faculty', 'gallery'
    item_id = db.Column(db.String(100), nullable=False) # ID of item
    title = db.Column(db.String(255), nullable=True)
    subtitle = db.Column(db.String(255), nullable=True)
    university_id = db.Column(db.String(100), index=True, nullable=True)
    timestamp = db.Column(db.String(50), nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'item_type': self.item_type,
            'item_id': self.item_id,
            'title': self.title or '',
            'subtitle': self.subtitle or '',
            'university_id': self.university_id or '',
            'timestamp': self.timestamp or ''
        }

# 19. User Preference Model
class UserPreference(db.Model):
    __tablename__ = 'user_preferences'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(120), unique=True, nullable=False)
    dark_mode = db.Column(db.Boolean, default=False)
    language = db.Column(db.String(20), default='en')
    notify_email = db.Column(db.Boolean, default=True)
    notify_sms = db.Column(db.Boolean, default=False)
    notify_general = db.Column(db.Boolean, default=True)

    def to_dict(self):
        return {
            'user_id': self.user_id,
            'dark_mode': self.dark_mode,
            'language': self.language,
            'notify_email': self.notify_email,
            'notify_sms': self.notify_sms,
            'notify_general': self.notify_general
        }

# 20. Community Thread Model
class CommunityThread(db.Model):
    __tablename__ = 'community_threads'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(120), index=True, nullable=False)
    user_name = db.Column(db.String(120), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    content = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50), default='General')
    timestamp = db.Column(db.String(50), nullable=False)
    likes = db.Column(db.Integer, default=0)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user_name': self.user_name,
            'title': self.title,
            'content': self.content,
            'category': self.category,
            'timestamp': self.timestamp,
            'likes': self.likes
        }

# 21. Community Post Model
class CommunityPost(db.Model):
    __tablename__ = 'community_posts'
    id = db.Column(db.Integer, primary_key=True)
    thread_id = db.Column(db.Integer, index=True, nullable=False)
    user_id = db.Column(db.String(120), index=True, nullable=False)
    user_name = db.Column(db.String(120), nullable=False)
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.String(50), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'thread_id': self.thread_id,
            'user_id': self.user_id,
            'user_name': self.user_name,
            'content': self.content,
            'timestamp': self.timestamp
        }

# 22. Mock Interview Session Model
class MockInterviewSession(db.Model):
    __tablename__ = 'mock_interview_sessions'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(120), index=True, nullable=False)
    track = db.Column(db.String(50), nullable=False)
    history = db.Column(db.Text, default='[]')  # JSON string
    score = db.Column(db.Integer, default=0)
    feedback = db.Column(db.Text, default='')
    timestamp = db.Column(db.String(50), nullable=False)

    def to_dict(self):
        import json
        try:
            hist_list = json.loads(self.history)
        except Exception:
            hist_list = []
        return {
            'id': self.id,
            'user_id': self.user_id,
            'track': self.track,
            'history': hist_list,
            'score': self.score,
            'feedback': self.feedback,
            'timestamp': self.timestamp
        }

# 23. Resume Profile Model
class ResumeProfile(db.Model):
    __tablename__ = 'resume_profiles'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(120), unique=True, nullable=False)
    fullname = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(50), nullable=False)
    summary = db.Column(db.Text, default='')
    skills = db.Column(db.Text, default='[]')      # JSON string
    education = db.Column(db.Text, default='[]')   # JSON string
    experience = db.Column(db.Text, default='[]')  # JSON string
    projects = db.Column(db.Text, default='[]')    # JSON string
    timestamp = db.Column(db.String(50), nullable=False)

    def to_dict(self):
        import json
        try:
            sk = json.loads(self.skills)
        except Exception:
            sk = []
        try:
            ed = json.loads(self.education)
        except Exception:
            ed = []
        try:
            ex = json.loads(self.experience)
        except Exception:
            ex = []
        try:
            pr = json.loads(self.projects)
        except Exception:
            pr = []
        return {
            'id': self.id,
            'user_id': self.user_id,
            'fullname': self.fullname,
            'email': self.email,
            'phone': self.phone,
            'summary': self.summary,
            'skills': sk,
            'education': ed,
            'experience': ex,
            'projects': pr,
            'timestamp': self.timestamp
        }

# 24. Admission Checklist Model
class AdmissionChecklist(db.Model):
    __tablename__ = 'admission_checklists'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(120), index=True, nullable=False)
    university_id = db.Column(db.String(100), index=True, nullable=False)
    completed_steps = db.Column(db.Text, default='[]')  # JSON list of completed step keys
    timestamp = db.Column(db.String(50), nullable=False)

    def to_dict(self):
        import json
        try:
            steps = json.loads(self.completed_steps)
        except Exception:
            steps = []
        return {
            'id': self.id,
            'user_id': self.user_id,
            'university_id': self.university_id,
            'completed_steps': steps,
            'timestamp': self.timestamp
        }

import json
import os

def generate_database():
    # Load existing Parul University data
    parul_data = {}
    if os.path.exists('university_info.json'):
        try:
            with open('university_info.json', 'r', encoding='utf-8') as f:
                parul_data = json.load(f)
        except Exception as e:
            print("Error loading university_info.json:", e)

    # Let's ensure Parul University has placement and other standard fields
    if "placements" not in parul_data:
        parul_data["placements"] = {
            "highest_package": "₹37.5 Lakhs",
            "average_package": "₹4.8 Lakhs",
            "placement_rate": "85.2%",
            "top_recruiters": ["TCS", "Wipro", "Infosys", "Cognizant", "L&T", "Adani"]
        }
    if "hostel" not in parul_data:
        parul_data["hostel"] = {
            "details": "AC and Non-AC hostel blocks with laundry services, study halls, and common dining halls.",
            "fees": "₹75,000 - ₹1,40,000 per year",
            "facilities": ["Wi-Fi", "Common Mess", "Gym", "Power Backup", "Sports Ground"]
        }
    if "campus_facilities" not in parul_data:
        parul_data["campus_facilities"] = ["Digital Library", "High-Tech Computer Labs", "Multipurpose Auditorium", "Cricket and Football Grounds", "On-campus Cafeterias", "Medical Center"]
    if "announcements" not in parul_data:
        parul_data["announcements"] = [
            {"title": "Admissions Open 2026", "type": "Admission", "desc": "Undergraduate and Postgraduate applications are now open for the Academic Year 2026-27."},
            {"title": "MS Dhoni Campus Campaign", "type": "Events", "desc": "Parul University welcomes MS Dhoni for the grand youth leadership campaign."}
        ]
    if "events" not in parul_data:
        parul_data["events"] = [
            {"title": "Dhoom Cultural Fest", "date": "March 15, 2026", "desc": "Annual cultural extravaganza hosting celebrities and national level student competitions."},
            {"title": "TechExpo 2026", "date": "April 08, 2026", "desc": "Exhibition of top technical projects and innovations by engineering students."}
        ]
    if "news" not in parul_data:
        parul_data["news"] = [
            {"title": "PU Awarded NAAC A++ Grade", "date": "May 24, 2026", "desc": "Parul University achieved the highest NAAC A++ accreditation with absolute performance scores."},
            {"title": "Highest Package Touches ₹37.5 LPA", "date": "June 12, 2026", "desc": "CSE students secure top-tier domestic placements with high packages."}
        ]
    if "faculty" not in parul_data:
        parul_data["faculty"] = [
            {"name": "Dr. Devanshu Patel", "designation": "President", "department": "Administration", "email": "president@paruluniversity.ac.in"},
            {"name": "Dr. Amit Ganatra", "designation": "Dean", "department": "Engineering & Technology", "email": "amit.ganatra@paruluniversity.ac.in"},
            {"name": "Dr. M. N. Patel", "designation": "Vice Chancellor", "department": "Administration", "email": "vc@paruluniversity.ac.in"}
        ]
    if "faqs" not in parul_data:
        parul_data["faqs"] = [
            {"question": "How can I check my semester results?", "answer": "You can check your semester results on the PU Student Portal under the 'Exams and Results' section."},
            {"question": "What is the attendance requirement?", "answer": "Students must maintain a minimum of 75% attendance in each course to be eligible to sit for the term-end examinations."}
        ]

    # Initialize Universe Database
    universe = {
        "parul": parul_data
    }

    # Rest of the 19 universities metadata builder configuration
    univ_templates = {
        "iitb": {
            "name": "IIT Bombay",
            "location": "Powai, Mumbai, Maharashtra",
            "ranking": "NIRF #1 in Engineering",
            "accreditation": "Institute of Eminence",
            "website": "https://www.iitb.ac.in",
            "logo": "fa-solid fa-graduation-cap text-danger",
            "highest_package": "₹1.6 Crore",
            "average_package": "₹25.8 Lakhs",
            "placement_rate": "98.9%",
            "top_recruiters": ["Google", "Microsoft", "Rubrik", "Qualcomm", "Optiver", "TSMC"],
            "hostel_fees": "₹28,000 - ₹50,000 per year",
            "tech_fee": "₹2,20,000",
            "mgmt_fee": "₹4,50,000"
        },
        "iitd": {
            "name": "IIT Delhi",
            "location": "Hauz Khas, New Delhi, Delhi",
            "ranking": "NIRF #2 in Engineering",
            "accreditation": "Institute of Eminence",
            "website": "https://home.iitd.ac.in",
            "logo": "fa-solid fa-graduation-cap text-primary",
            "highest_package": "₹1.4 Crore",
            "average_package": "₹23.5 Lakhs",
            "placement_rate": "97.4%",
            "top_recruiters": ["Google", "Microsoft", "Apple", "Goldman Sachs", "Intel"],
            "hostel_fees": "₹32,000 - ₹60,000 per year",
            "tech_fee": "₹2,25,000",
            "mgmt_fee": "₹4,80,000"
        },
        "iitm": {
            "name": "IIT Madras",
            "location": "Adyar, Chennai, Tamil Nadu",
            "ranking": "NIRF #1 Overall",
            "accreditation": "Institute of Eminence",
            "website": "https://www.iitm.ac.in",
            "logo": "fa-solid fa-graduation-cap text-success",
            "highest_package": "₹1.8 Crore",
            "average_package": "₹24.5 Lakhs",
            "placement_rate": "98.2%",
            "top_recruiters": ["Samsung", "Honeywell", "TI", "Sony", "McKinsey", "NVIDIA"],
            "hostel_fees": "₹30,000 - ₹55,000 per year",
            "tech_fee": "₹2,10,000",
            "mgmt_fee": "₹4,20,000"
        },
        "iitk": {
            "name": "IIT Kanpur",
            "location": "Kalyanpur, Kanpur, Uttar Pradesh",
            "ranking": "NIRF #4 in Engineering",
            "accreditation": "Institute of Eminence",
            "website": "https://www.iitk.ac.in",
            "logo": "fa-solid fa-graduation-cap text-info",
            "highest_package": "₹1.3 Crore",
            "average_package": "₹22.1 Lakhs",
            "placement_rate": "96.5%",
            "top_recruiters": ["Microsoft", "AWS", "JPMorgan", "Quadeye", "Jaguar"],
            "hostel_fees": "₹26,000 - ₹48,000 per year",
            "tech_fee": "₹2,15,000",
            "mgmt_fee": "₹4,10,000"
        },
        "iitkgp": {
            "name": "IIT Kharagpur",
            "location": "Kharagpur, West Bengal",
            "ranking": "NIRF #5 in Engineering",
            "accreditation": "Institute of Eminence",
            "website": "https://www.iitkgp.ac.in",
            "logo": "fa-solid fa-graduation-cap text-warning",
            "highest_package": "₹1.5 Crore",
            "average_package": "₹21.0 Lakhs",
            "placement_rate": "95.8%",
            "top_recruiters": ["Intel", "Oracle", "Cisco", "PwC", "Deloitte"],
            "hostel_fees": "₹25,000 - ₹45,000 per year",
            "tech_fee": "₹2,12,000",
            "mgmt_fee": "₹4,00,000"
        },
        "nitt": {
            "name": "NIT Trichy",
            "location": "Tiruchirappalli, Tamil Nadu",
            "ranking": "NIRF #9 in Engineering",
            "accreditation": "National Importance",
            "website": "https://www.nitt.edu",
            "logo": "fa-solid fa-building-columns text-primary",
            "highest_package": "₹52.8 Lakhs",
            "average_package": "₹15.2 Lakhs",
            "placement_rate": "94.2%",
            "top_recruiters": ["TCS", "Qualcomm", "Texas Instruments", "Cognizant", "Infosys"],
            "hostel_fees": "₹45,000 - ₹80,000 per year",
            "tech_fee": "₹1,45,000",
            "mgmt_fee": "₹2,80,000"
        },
        "nits": {
            "name": "NIT Surathkal",
            "location": "Srinivasnagar, Mangalore, Karnataka",
            "ranking": "NIRF #12 in Engineering",
            "accreditation": "National Importance",
            "website": "https://www.nitk.ac.in",
            "logo": "fa-solid fa-building-columns text-info",
            "highest_package": "₹54.0 Lakhs",
            "average_package": "₹16.0 Lakhs",
            "placement_rate": "95.0%",
            "top_recruiters": ["Uber", "Microsoft", "Goldman Sachs", "DE Shaw", "Amazon"],
            "hostel_fees": "₹48,000 - ₹85,000 per year",
            "tech_fee": "₹1,48,000",
            "mgmt_fee": "₹2,95,000"
        },
        "bits": {
            "name": "BITS Pilani",
            "location": "Pilani, Rajasthan",
            "ranking": "NIRF #25 Overall",
            "accreditation": "Institute of Eminence",
            "website": "https://www.bits-pilani.ac.in",
            "logo": "fa-solid fa-school-flag text-danger",
            "highest_package": "₹60.7 Lakhs",
            "average_package": "₹18.5 Lakhs",
            "placement_rate": "96.8%",
            "top_recruiters": ["Salesforce", "Cisco", "Credit Suisse", "Paypal", "Qualcomm"],
            "hostel_fees": "₹60,000 - ₹1,10,000 per year",
            "tech_fee": "₹4,85,000",
            "mgmt_fee": "₹5,50,000"
        },
        "vit": {
            "name": "VIT Vellore",
            "location": "Vellore, Tamil Nadu",
            "ranking": "NIRF #11 in Engineering",
            "accreditation": "NAAC A++",
            "website": "https://vit.ac.in",
            "logo": "fa-solid fa-building-columns text-primary",
            "highest_package": "₹44.0 Lakhs",
            "average_package": "₹8.2 Lakhs",
            "placement_rate": "92.5%",
            "top_recruiters": ["Wipro", "TCS", "Accenture", "Infosys", "Intel", "Amazon"],
            "hostel_fees": "₹90,000 - ₹2,10,000 per year",
            "tech_fee": "₹1,95,000",
            "mgmt_fee": "₹2,75,000"
        },
        "srm": {
            "name": "SRM University",
            "location": "Kattankulathur, Chennai, Tamil Nadu",
            "ranking": "NIRF #28 Overall",
            "accreditation": "NAAC A++",
            "website": "https://www.srmist.edu.in",
            "logo": "fa-solid fa-building-columns text-success",
            "highest_package": "₹41.6 Lakhs",
            "average_package": "₹7.5 Lakhs",
            "placement_rate": "90.4%",
            "top_recruiters": ["TCS", "Cognizant", "Capgemini", "Amazon", "Optum"],
            "hostel_fees": "₹85,000 - ₹1,80,000 per year",
            "tech_fee": "₹2,50,000",
            "mgmt_fee": "₹3,50,000"
        },
        "manipal": {
            "name": "Manipal University",
            "location": "Manipal, Udupi, Karnataka",
            "ranking": "NIRF #7 Overall",
            "accreditation": "NAAC A++",
            "website": "https://manipal.edu",
            "logo": "fa-solid fa-graduation-cap text-warning",
            "highest_package": "₹43.9 Lakhs",
            "average_package": "₹8.8 Lakhs",
            "placement_rate": "91.2%",
            "top_recruiters": ["Microsoft", "Oracle", "GSK", "Philips", "Bosch"],
            "hostel_fees": "₹95,000 - ₹2,30,000 per year",
            "tech_fee": "₹3,20,000",
            "mgmt_fee": "₹4,10,000"
        },
        "amity": {
            "name": "Amity University",
            "location": "Noida, Uttar Pradesh",
            "ranking": "NIRF #35 Overall",
            "accreditation": "NAAC A+",
            "website": "https://www.amity.edu",
            "logo": "fa-solid fa-school text-warning",
            "highest_package": "₹30.0 Lakhs",
            "average_package": "₹5.5 Lakhs",
            "placement_rate": "87.5%",
            "top_recruiters": ["Wipro", "TCS", "IBM", "HCL", "Accenture"],
            "hostel_fees": "₹80,000 - ₹1,60,000 per year",
            "tech_fee": "₹2,20,000",
            "mgmt_fee": "₹3,40,000"
        },
        "lpu": {
            "name": "LPU",
            "location": "Phagwara, Punjab",
            "ranking": "NIRF #38 Overall",
            "accreditation": "NAAC A++",
            "website": "https://www.lpu.in",
            "logo": "fa-solid fa-graduation-cap text-danger",
            "highest_package": "₹64.0 Lakhs",
            "average_package": "₹6.2 Lakhs",
            "placement_rate": "89.5%",
            "top_recruiters": ["Cognizant", "TCS", "Amazon", "Capgemini", "Google India"],
            "hostel_fees": "₹70,000 - ₹1,50,000 per year",
            "tech_fee": "₹1,80,000",
            "mgmt_fee": "₹2,40,000"
        },
        "chandigarh": {
            "name": "Chandigarh University",
            "location": "Gharuan, Mohali, Punjab",
            "ranking": "NIRF #45 Overall",
            "accreditation": "NAAC A+",
            "website": "https://www.cuchd.in",
            "logo": "fa-solid fa-school text-primary",
            "highest_package": "₹54.7 Lakhs",
            "average_package": "₹5.9 Lakhs",
            "placement_rate": "88.2%",
            "top_recruiters": ["TCS", "Accenture", "Microsoft", "Capgemini", "Amazon"],
            "hostel_fees": "₹75,000 - ₹1,45,000 per year",
            "tech_fee": "₹1,60,000",
            "mgmt_fee": "₹2,20,000"
        },
        "snu": {
            "name": "Shiv Nadar University",
            "location": "Greater Noida, Uttar Pradesh",
            "ranking": "NIRF #60 Overall",
            "accreditation": "NAAC A+",
            "website": "https://snu.edu.in",
            "logo": "fa-solid fa-building-columns text-info",
            "highest_package": "₹33.5 Lakhs",
            "average_package": "₹9.2 Lakhs",
            "placement_rate": "90.0%",
            "top_recruiters": ["Adobe", "Dell", "McKinsey", "Cognizant", "L&T"],
            "hostel_fees": "₹1,10,000 - ₹2,00,000 per year",
            "tech_fee": "₹3,50,000",
            "mgmt_fee": "₹4,50,000"
        },
        "upes": {
            "name": "UPES",
            "location": "Dehradun, Uttarakhand",
            "ranking": "NIRF #54 Overall",
            "accreditation": "NAAC A",
            "website": "https://www.upes.ac.in",
            "logo": "fa-solid fa-building-columns text-danger",
            "highest_package": "₹50.0 Lakhs",
            "average_package": "₹7.0 Lakhs",
            "placement_rate": "91.5%",
            "top_recruiters": ["ExxonMobil", "Reliance", "Infosys", "Adani Group", "Schlumberger"],
            "hostel_fees": "₹1,20,000 - ₹2,10,000 per year",
            "tech_fee": "₹2,80,000",
            "mgmt_fee": "₹3,90,000"
        },
        "christ": {
            "name": "Christ University",
            "location": "Bengaluru, Karnataka",
            "ranking": "NIRF #65 Overall",
            "accreditation": "NAAC A+",
            "website": "https://christuniversity.in",
            "logo": "fa-solid fa-graduation-cap text-success",
            "highest_package": "₹21.4 Lakhs",
            "average_package": "₹6.8 Lakhs",
            "placement_rate": "88.9%",
            "top_recruiters": ["Goldman Sachs", "EY", "KPMG", "PwC", "Amazon", "Deloitte"],
            "hostel_fees": "₹65,000 - ₹1,20,000 per year",
            "tech_fee": "₹1,85,000",
            "mgmt_fee": "₹3,20,000"
        },
        "symbiosis": {
            "name": "Symbiosis",
            "location": "Senapati Bapat Road, Pune, Maharashtra",
            "ranking": "NIRF #32 Overall",
            "accreditation": "NAAC A++",
            "website": "https://www.siu.edu.in",
            "logo": "fa-solid fa-school text-info",
            "highest_package": "₹35.0 Lakhs",
            "average_package": "₹11.2 Lakhs",
            "placement_rate": "93.4%",
            "top_recruiters": ["Deloitte", "Aditya Birla", "ICICI Bank", "HDFC", "Google"],
            "hostel_fees": "₹1,15,000 - ₹2,20,000 per year",
            "tech_fee": "₹2,60,000",
            "mgmt_fee": "₹7,50,000"
        },
        "jain": {
            "name": "Jain University",
            "location": "Bengaluru, Karnataka",
            "ranking": "NIRF #75 Overall",
            "accreditation": "NAAC A++",
            "website": "https://www.jainuniversity.ac.in",
            "logo": "fa-solid fa-school-flag text-warning",
            "highest_package": "₹30.0 Lakhs",
            "average_package": "₹5.8 Lakhs",
            "placement_rate": "86.5%",
            "top_recruiters": ["Dell", "HP", "Standard Chartered", "Tech Mahindra"],
            "hostel_fees": "₹80,000 - ₹1,65,000 per year",
            "tech_fee": "₹1,75,000",
            "mgmt_fee": "₹2,90,000"
        }
    }

    # Generate details for other 19 universities
    for key, val in univ_templates.items():
        if key == "parul": continue # Already set
        
        # Populate based on template
        u_data = {
            "university_name": val["name"],
            "contact": {
                "email": f"admissions@{key}.ac.in",
                "phone": "+91-9999911111",
                "address": val["location"],
                "office_hours": "Monday to Friday, 9:00 AM - 5:00 PM",
                "website": val["website"]
            },
            "admissions": {
                "undergraduate": {
                    "eligibility": "Pass in Class 10+2 (Higher Secondary) with a minimum of 60% aggregate marks. Entrance scorecard required (JEE Main/SAT/University Test).",
                    "deadline": "July 15, 2026",
                    "requirements": [
                        "Online application form submission",
                        "Class 10 and 12 marksheets",
                        "Entrance exam score certificate",
                        "Valid Government ID Card",
                        "Provisional Migration Certificate"
                    ],
                    "process": "1. Apply online at portal. 2. Enter academic scores. 3. Allocation list based on merit/scores. 4. Fee submission to confirm seats."
                },
                "postgraduate": {
                    "eligibility": "Graduation degree with at least 55% aggregate marks from a recognized board. Entrance tests applicable (GATE/CAT).",
                    "deadline": "July 30, 2026",
                    "requirements": [
                        "Online postgrad registration form",
                        "Official graduation transcripts",
                        "GATE/CAT scorecards",
                        "Recommendation letters"
                    ],
                    "process": "1. Register on portal. 2. Upload transcripts and entrance cards. 3. Personal interview or counseling. 4. Seat locking."
                },
                "scholarships": {
                    "merit_based": "Up to 100% tuition waiver for national top-rankers and high university entrance exam achievers.",
                    "need_based": "Financial aids and interest subsidies on student loans.",
                    "deadline": "June 15, 2026"
                }
            },
            "fees": {
                "courses": [
                    {
                        "course_name": "B.Tech Computer Science & Engineering",
                        "level": "Undergraduate",
                        "duration": "4 Years",
                        "tuition_fee_per_year": val["tech_fee"]
                    },
                    {
                        "course_name": "B.Tech Mechanical Engineering",
                        "level": "Undergraduate",
                        "duration": "4 Years",
                        "tuition_fee_per_year": val["tech_fee"]
                    },
                    {
                        "course_name": "B.Tech Electronics & Comm Engineering",
                        "level": "Undergraduate",
                        "duration": "4 Years",
                        "tuition_fee_per_year": val["tech_fee"]
                    },
                    {
                        "course_name": "MBA (Master of Business Administration)",
                        "level": "Postgraduate",
                        "duration": "2 Years",
                        "tuition_fee_per_year": val["mgmt_fee"]
                    }
                ],
                "payment_methods": "Net Banking, Credit/Debit Card, UPI, and Bank Demand Draft.",
                "installment_plan": "Fees can be split into two semesters per year.",
                "refund_policy": "Full refund within 15 days of admission, with 10% administrative deduction thereafter."
            },
            "syllabus": {
                "B.Tech Computer Science & Engineering": {
                    "Semester 1": ["Engineering Physics", "Mathematics I", "Programming Basics in C", "Communication Skills"],
                    "Semester 2": ["Engineering Chemistry", "Mathematics II", "Data Structures", "Digital Logic"]
                },
                "MBA (Master of Business Administration)": {
                    "Semester 1": ["Organizational Behavior", "Managerial Economics", "Financial Accounting", "Marketing Management"],
                    "Semester 2": ["Human Resource Management", "Corporate Finance", "Operations Research", "Strategic Management"]
                }
            },
            "placements": {
                "highest_package": val["highest_package"],
                "average_package": val["average_package"],
                "placement_rate": val["placement_rate"],
                "top_recruiters": val["top_recruiters"]
            },
            "hostel": {
                "details": "AC/Non-AC premium hosteling options with 24/7 security, high-speed Wi-Fi, and modular laundry hubs.",
                "fees": val["hostel_fees"],
                "facilities": ["24/7 High-speed Internet", "In-house Gym & Sports Room", "Hygienic Vegetarian/Non-Vegetarian Mess", "Laundry Service"]
            },
            "campus_facilities": ["Advanced Research Labs", "Central Digital Library", "Sports Complex", "University Healthcare Clinic", "Wi-Fi Coverage", "Food Courts"],
            "announcements": [
                {"title": "Academic Term Commencing", "type": "Academic", "desc": "The academic session 2026-27 begins from August 1st. Attendance is mandatory from Day 1."},
                {"title": "Orientation Program Schedule", "type": "Events", "desc": "Orientation ceremony scheduled for newly registered batch on July 28th."}
            ],
            "events": [
                {"title": "Cultural Conclave 2026", "date": "April 15, 2026", "desc": "Inter-university talent show and concert night."},
                {"title": "Smart India Hackathon Center", "date": "May 20, 2026", "desc": "National hackathon venue hosting over 50 campus code teams."}
            ],
            "news": [
                {"title": "New Innovation Incubator Center Opened", "date": "January 10, 2026", "desc": "Funded facility dedicated to student startup incubations and legal IP filings."},
                {"title": "Research Excellence Award Winning Faculty", "date": "February 22, 2026", "desc": "Key faculty gets rewarded for pioneering works in quantum computing chips."}
            ],
            "faculty": [
                {"name": "Dr. Ramesh Nair", "designation": "Director", "department": "Computer Science", "email": "director.cs@univ.ac.in"},
                {"name": "Dr. Sunita Sen", "designation": "Dean", "department": "Management Studies", "email": "dean.mgmt@univ.ac.in"},
                {"name": "Dr. Vikas Kumar", "designation": "Head of Research", "department": "Scientific Studies", "email": "research@univ.ac.in"}
            ],
            "faqs": [
                {"question": "What is the scholarship registration deadline?", "answer": "All scholarship forms must be submitted along with relevant board records before June 15th."},
                {"question": "Are there dynamic student club programs?", "answer": "Yes, we support technical clubs, cultural chapters, and social welfare societies active all year."}
            ]
        }
        universe[key] = u_data

    # Save to universe_data.json
    try:
        with open('universe_data.json', 'w', encoding='utf-8') as f:
            json.dump(universe, f, indent=2, ensure_ascii=False)
        print("Successfully generated universe_data.json with 20 universities!")
    except Exception as e:
        print("Error writing universe_data.json:", e)

if __name__ == '__main__':
    generate_database()

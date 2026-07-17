// JWT Token Retrieval and Verification
const urlParams = new URLSearchParams(window.location.search);
let adminToken = urlParams.get('token') || localStorage.getItem('universe_jwt_token') || getCookie('remember_token');

if (adminToken) {
    localStorage.setItem('universe_jwt_token', adminToken);
} else {
    window.location.href = '/';
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

// Global authenticated fetch helper
async function adminFetch(url, options = {}) {
    if (!options.headers) options.headers = {};
    if (adminToken) {
        options.headers['Authorization'] = `Bearer ${adminToken}`;
    }
    const method = (options.method || 'GET').toUpperCase();
    if (['POST', 'PUT', 'DELETE'].includes(method)) {
        const getCookieLocal = (name) => {
            const value = "; " + document.cookie;
            const parts = value.split("; " + name + "=");
            if (parts.length === 2) return parts.pop().split(";").shift();
            return "";
        };
        const csrfToken = getCookieLocal('csrf_token');
        if (csrfToken) {
            options.headers['X-CSRF-Token'] = csrfToken;
        }
    }
    let res = await fetch(url, options);
    if (res.status === 401) {
        if (!url.includes('/api/refresh') && !url.includes('/api/login') && !url.includes('/api/register')) {
            try {
                const refreshResp = await fetch('/api/refresh', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                if (refreshResp.ok) {
                    const refreshResult = await refreshResp.json();
                    if (refreshResult.success && refreshResult.token) {
                        adminToken = refreshResult.token;
                        localStorage.setItem('universe_jwt_token', adminToken);
                        options.headers['Authorization'] = `Bearer ${adminToken}`;
                        res = await fetch(url, options);
                        return res;
                    }
                }
            } catch (err) {
                console.error('Admin token refresh failed:', err);
            }
        }
        localStorage.removeItem('universe_jwt_token');
        window.location.href = '/';
    } else if (res.status === 403) {
        try {
            const clone = res.clone();
            const dataJson = await clone.json();
            if (dataJson.message === 'CSRF verification failed.') {
                return res;
            }
        } catch(e) {}
        localStorage.removeItem('universe_jwt_token');
        window.location.href = '/';
    }
    return res;
}

window.adminLogout = async function() {
    try {
        await fetch('/api/logout', { method: 'POST' });
    } catch(e) {}
    localStorage.removeItem('universe_jwt_token');
    sessionStorage.removeItem('universe_jwt_token');
    window.location.href = '/';
};

// Admin console state variables
let universityConfig = {};
let hasApiKey = false;
let currentTab = 'overview';
let currentAdminUnivId = 'parul';
let allUniversities = [];

// Pagination states
let feePage = 1;
const feeLimit = 5;
let filteredFees = [];

let logsPage = 1;
const logsLimit = 5;
let filteredLogs = [];

let usersPage = 1;
const usersLimit = 5;
let filteredUsers = [];

// Persistent lists loaded from server
let logsList = [];
let usersList = [];
let announcementsList = [];

// Charts references
let queryChartInstance = null;
let categoryChartInstance = null;

// Verify authorization before DOM init
async function verifyAdminAuth() {
    try {
        const res = await adminFetch('/api/key');
        if (!res.ok) {
            localStorage.removeItem('universe_jwt_token');
            window.location.href = '/';
        }
    } catch (e) {
        window.location.href = '/';
    }
}
verifyAdminAuth();

// --- Initialize Dashboard ---
document.addEventListener('DOMContentLoaded', () => {
    initTabNavigation();
    initAdminUnivSelector();
    initThemeManager();
    initActionButtons();
    initSearchFilters();
});

// --- Fetch Universities for Admin Dropdown Selector ---
async function initAdminUnivSelector() {
    const listEl = document.getElementById('admin-univ-selector-list');
    const labelEl = document.getElementById('admin-current-univ-label');
    
    try {
        const response = await adminFetch('/api/universities');
        allUniversities = await response.json();
        
        if (listEl) {
            listEl.innerHTML = '';
            allUniversities.forEach(univ => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <a class="dropdown-item d-flex align-items-center gap-2 fw-semibold" href="#" onclick="switchAdminUniversity('${univ.id}')">
                        <i class="${univ.logo} text-danger" style="width:16px;"></i>
                        <span>${univ.name}</span>
                    </a>
                `;
                listEl.appendChild(li);
            });
        }
        
        // Load initial Parul University details
        switchAdminUniversity('parul');
    } catch (err) {
        console.error("Error loading admin universities selector:", err);
    }
}

window.switchAdminUniversity = function(id) {
    currentAdminUnivId = id;
    const matched = allUniversities.find(u => u.id === id);
    const labelEl = document.getElementById('admin-current-univ-label');
    
    if (labelEl && matched) {
        labelEl.innerHTML = `<i class="fa-solid fa-building-columns text-danger me-1"></i> Manage: ${matched.name}`;
    }

    // Refresh configurations, logs, announcements and users for that university!
    fetchConfigData();
    fetchLogsFromServer();
    fetchUsersFromServer();
    fetchAnnouncementsFromServer();
};

// --- Tab Swapping Navigation ---
function initTabNavigation() {
    const sidebarItems = document.querySelectorAll('.nav-btn[data-tab]');
    sidebarItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tab = item.getAttribute('data-tab');
            switchTab(tab);
        });
    });
}

function switchTab(tabId) {
    currentTab = tabId;
    
    // Toggle active sidebar link
    document.querySelectorAll('.nav-btn').forEach(item => {
        if (item.getAttribute('data-tab') === tabId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Toggle active body panel
    document.querySelectorAll('.panel-section').forEach(panel => {
        if (panel.id === `panel-${tabId}`) {
            panel.classList.add('active');
        } else {
            panel.classList.remove('active');
        }
    });

    // Update panel header title
    const activeTitle = document.getElementById('active-panel-title');
    if (activeTitle) {
        const readableTitles = {
            'overview': 'Overview Analytics',
            'university-details': 'General Details & Deadlines',
            'tuition-fees': 'Course Fees Registry',
            'gemini-settings': 'Gemini AI API Key Configuration',
            'faq-registry': 'Curriculum Syllabus & FAQs',
            'chat-logs': 'Interaction Chat Logs',
            'user-management': 'Registered Students Directory',
            'announcements': 'Dynamic Announcements Manager'
        };
        activeTitle.textContent = readableTitles[tabId] || 'Console Panel';
    }

    // Re-render chart if switching to Overview
    if (tabId === 'overview') {
        setTimeout(renderOverviewCharts, 100);
    }
}

// --- Dynamic Theme Manager ---
function initThemeManager() {
    const themeBtn = document.getElementById('admin-theme-toggle');
    if (!themeBtn) return;

    // Apply cached theme
    const savedTheme = localStorage.getItem('theme') || 'light-mode';
    document.body.className = savedTheme;
    updateThemeIcon(savedTheme);

    themeBtn.addEventListener('click', () => {
        if (document.body.classList.contains('light-mode')) {
            document.body.classList.remove('light-mode');
            document.body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark-mode');
            updateThemeIcon('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
            document.body.classList.add('light-mode');
            localStorage.setItem('theme', 'light-mode');
            updateThemeIcon('light-mode');
        }
        
        // Refresh charts color themes if overview tab active
        if (currentTab === 'overview') {
            renderOverviewCharts();
        }
    });
}

function updateThemeIcon(theme) {
    const themeBtn = document.getElementById('admin-theme-toggle');
    if (!themeBtn) return;
    const icon = themeBtn.querySelector('i');
    if (theme === 'dark-mode') {
        icon.className = 'fa-solid fa-sun';
    } else {
        icon.className = 'fa-solid fa-moon';
    }
}

// --- Render Chart.js widgets ---
function renderOverviewCharts() {
    const lineCtx = document.getElementById('queryVolumeChart');
    const doughnutCtx = document.getElementById('categoryDistributionChart');

    if (!lineCtx || !doughnutCtx || !window.Chart) return;

    if (queryChartInstance) queryChartInstance.destroy();
    if (categoryChartInstance) categoryChartInstance.destroy();

    const isDark = document.body.classList.contains('dark-mode');
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(13, 27, 42, 0.08)';
    const labelColor = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(13, 27, 42, 0.6)';

    // Compute metrics
    let categoriesCount = { "Admissions": 0, "Tuition Fees": 0, "Exams/Policies": 0, "Syllabus": 0, "General": 0 };
    
    if (window.__query_distribution) {
        categoriesCount = window.__query_distribution;
    } else {
        logsList.forEach(log => {
            const q = log.query.toLowerCase();
            if (q.includes("admit") || q.includes("admission") || q.includes("apply") || q.includes("deadline")) {
                categoriesCount["Admissions"]++;
            } else if (q.includes("fee") || q.includes("cost") || q.includes("tuition") || q.includes("payment")) {
                categoriesCount["Tuition Fees"]++;
            } else if (q.includes("exam") || q.includes("test") || q.includes("schedule") || q.includes("midterm")) {
                categoriesCount["Exams/Policies"]++;
            } else if (q.includes("syllabus") || q.includes("curriculum") || q.includes("subject")) {
                categoriesCount["Syllabus"]++;
            } else {
                categoriesCount["General"]++;
            }
        });
    }

    // 1. Line Chart setup
    queryChartInstance = new Chart(lineCtx, {
        type: 'line',
        data: {
            labels: ['Jun 26', 'Jun 27', 'Jun 28', 'Jun 29', 'Jun 30', 'Jul 01'],
            datasets: [{
                label: 'Student Queries',
                data: [12, 24, 18, 40, 52, Math.max(logsList.length, 5)],
                borderColor: '#E4002B',
                backgroundColor: 'rgba(228, 0, 43, 0.06)',
                borderWidth: 2,
                fill: true,
                tension: 0.35,
                pointRadius: 4,
                pointBackgroundColor: '#E4002B'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { color: gridColor }, ticks: { color: labelColor, font: { family: 'Inter', size: 10 } } },
                y: { grid: { color: gridColor }, ticks: { color: labelColor, font: { family: 'Inter', size: 10 } } }
            }
        }
    });

    // 2. Doughnut Chart setup
    const catData = [
        categoriesCount["Admissions"] || 0,
        categoriesCount["Tuition Fees"] || 0,
        categoriesCount["Exams/Policies"] || 0,
        categoriesCount["Syllabus"] || 0,
        categoriesCount["General"] || 0
    ];
    const finalCatData = catData.reduce((a,b)=>a+b, 0) > 0 ? catData : [3, 2, 1, 1, 1];

    categoryChartInstance = new Chart(doughnutCtx, {
        type: 'doughnut',
        data: {
            labels: ['Admissions', 'Tuition Fees', 'Exams/Policies', 'Syllabus', 'General'],
            datasets: [{
                data: finalCatData,
                backgroundColor: ['#E4002B', '#0D1B2A', '#0284C7', '#10B981', '#F59E0B'],
                borderWidth: isDark ? 2 : 0,
                borderColor: isDark ? '#1F2937' : '#FFFFFF'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: labelColor, boxWidth: 12, font: { family: 'Inter', size: 10 } }
                }
            },
            cutout: '70%'
        }
    });
}

// --- Action Forms Binds ---
function initActionButtons() {
    // Save general Details
    const saveUnivBtn = document.getElementById('save-university-btn');
    if (saveUnivBtn) {
        saveUnivBtn.addEventListener('click', saveUniversityDetails);
    }

    // Save fees info
    const saveFeesBtn = document.getElementById('save-fees-btn');
    if (saveFeesBtn) {
        saveFeesBtn.addEventListener('click', saveFeesRegistryData);
    }

    // Add Course Program Row
    const btnAddCourse = document.getElementById('btn-add-course');
    if (btnAddCourse) {
        btnAddCourse.addEventListener('click', () => {
            const emptyCourse = { course_name: '', level: 'Undergraduate', duration: '3 Years', tuition_fee_per_year: '' };
            if (!universityConfig.fees) universityConfig.fees = { courses: [] };
            universityConfig.fees.courses.unshift(emptyCourse);
            resetFeeTableData();
        });
    }

    // Save Syllabus Registry
    const saveSyllabusBtn = document.getElementById('save-syllabus-btn');
    if (saveSyllabusBtn) {
        saveSyllabusBtn.addEventListener('click', saveSyllabusRegistryData);
    }

    // Add New Program Syllabus
    const btnAddSyllabus = document.getElementById('btn-add-syllabus');
    if (btnAddSyllabus) {
        btnAddSyllabus.addEventListener('click', () => {
            const courseName = prompt("Enter the exact name of the new course program:");
            if (courseName && courseName.trim()) {
                const cleanName = courseName.trim();
                if (!universityConfig.syllabus) universityConfig.syllabus = {};
                universityConfig.syllabus[cleanName] = {
                    "Semester 1": ["Introduction Class"],
                    "Semester 2": ["Core Module"]
                };
                renderSyllabiAccordion();
                showToast(`Program '${cleanName}' created. Define subjects below!`, 'success');
            }
        });
    }

    // Gemini API Token save trigger
    const saveApiKeyBtn = document.getElementById('btn-save-api-key');
    if (saveApiKeyBtn) {
        saveApiKeyBtn.addEventListener('click', saveGeminiKey);
    }

    // Clear Logs
    const btnClearLogs = document.getElementById('btn-clear-mock-logs');
    if (btnClearLogs) {
        btnClearLogs.addEventListener('click', () => {
            if (confirm("Clear all logs on the server?")) {
                clearLogsOnServer();
            }
        });
    }

    // Add Student User
    const btnAddMockUser = document.getElementById('btn-add-mock-user');
    if (btnAddMockUser) {
        btnAddMockUser.addEventListener('click', async () => {
            const name = prompt("Enter student's Full Name:");
            const email = prompt("Enter student's Email Address:");
            if (name && email) {
                try {
                    const response = await adminFetch('/api/register', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ fullname: name, email: email, password: 'password123', preferred_university: currentAdminUnivId })
                    });
                    const result = await response.json();
                    if (response.ok && result.success) {
                        fetchUsersFromServer();
                        showToast(`Student created! ID: ${result.enrollment_id}`, 'success');
                    } else {
                        showToast(result.message || 'Failed to create student.', 'error');
                    }
                } catch (e) {
                    showToast('Connection lost.', 'error');
                }
            }
        });
    }

    // Add Announcement banner
    const btnNewAnnouncement = document.getElementById('btn-new-announcement');
    if (btnNewAnnouncement) {
        btnNewAnnouncement.addEventListener('click', async () => {
            const title = prompt("Enter Announcement Title:");
            const desc = prompt("Enter short description:");
            const type = prompt("Enter Type (e.g. Campaign, Academic, General):", "General Alert");
            
            if (title && desc) {
                try {
                    const response = await adminFetch('/api/announcements', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ title, desc, type, image: "" })
                    });
                    const result = await response.json();
                    if (response.ok && result.success) {
                        fetchAnnouncementsFromServer();
                        showToast('Announcement alert published!', 'success');
                    }
                } catch (e) {
                    showToast('Failed to post announcement.', 'error');
                }
            }
        });
    }
}

// --- Fetch configurations from disk ---
async function fetchConfigData() {
    try {
        const response = await adminFetch(`/api/config?university_id=${currentAdminUnivId}`);
        const data = await response.json();
        universityConfig = data;
        populateUniversityForms();
        resetFeeTableData();
        renderSyllabiAccordion();
    } catch (e) {
        console.error('Error fetching university JSON configuration:', e);
        showToast('Failed to load university JSON.', 'error');
    }
}

async function checkApiKeyStatus() {
    const pill = document.getElementById('api-status-indicator');
    const diagIndicator = document.getElementById('diag-indicator');
    const diagTitle = document.getElementById('diag-title');
    const diagDesc = document.getElementById('diag-desc');
    const keyInput = document.getElementById('gemini-api-key');

    try {
        const response = await adminFetch('/api/key');
        const data = await response.json();
        hasApiKey = data.has_key;

        if (hasApiKey) {
            if (pill) {
                pill.className = 'api-status-pill active';
                pill.querySelector('span').textContent = 'Gemini AI Mode';
                pill.querySelector('i').className = 'fa-solid fa-circle';
            }
            if (diagIndicator) {
                diagIndicator.className = 'diagnostics-indicator bg-emerald-light text-emerald';
                diagIndicator.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
            }
            if (diagTitle) diagTitle.textContent = 'API Link Active';
            if (diagDesc) diagDesc.textContent = `Generative routing enabled (Masked Key: ${data.masked_key}).`;
            if (keyInput) keyInput.value = '••••••••••••••••••••';
        } else {
            if (pill) {
                pill.className = 'api-status-pill';
                pill.querySelector('span').textContent = 'Offline NLP';
                pill.querySelector('i').className = 'fa-solid fa-circle';
            }
            if (diagIndicator) {
                diagIndicator.className = 'diagnostics-indicator bg-amber-light text-amber';
                diagIndicator.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i>';
            }
            if (diagTitle) diagTitle.textContent = 'Offline (Failover)';
            if (diagDesc) diagDesc.textContent = 'Offline local keyword NLP matcher will handle messages.';
            if (keyInput) keyInput.value = '';
        }
    } catch (error) {
        console.error('Error inspecting key status:', error);
    }
}

// --- Populate University Forms ---
function populateUniversityForms() {
    const data = universityConfig;
    if (!data) return;

    document.getElementById('univ-name').value = data.university_name || '';

    const c = data.contact || {};
    document.getElementById('univ-email').value = c.email || '';
    document.getElementById('univ-phone').value = c.phone || '';
    document.getElementById('univ-address').value = c.address || '';
    document.getElementById('univ-hours').value = c.office_hours || '';
    document.getElementById('univ-website').value = c.website || '';

    const adm = data.admissions || {};
    document.getElementById('ug-deadline').value = adm.undergraduate?.deadline || '';
    document.getElementById('ug-eligible').value = adm.undergraduate?.eligibility || '';
    document.getElementById('ug-process').value = adm.undergraduate?.process || '';

    document.getElementById('pg-deadline').value = adm.postgraduate?.deadline || '';
    document.getElementById('pg-eligible').value = adm.postgraduate?.eligibility || '';
    document.getElementById('pg-process').value = adm.postgraduate?.process || '';

    const ex = data.exams || {};
    document.getElementById('exam-mid').value = ex.schedule?.mid_term || '';
    document.getElementById('exam-final').value = ex.schedule?.final_exam || '';
    document.getElementById('exam-result').value = ex.schedule?.results_release || '';

    document.getElementById('policy-attendance').value = ex.policies?.attendance_requirement || '';
    document.getElementById('policy-grading').value = ex.policies?.grading_system || '';
    document.getElementById('policy-makeup').value = ex.policies?.makeup_exams || '';

    const fees = data.fees || {};
    document.getElementById('fees-methods').value = fees.payment_methods || '';
    document.getElementById('fees-refund').value = fees.refund_policy || '';
    document.getElementById('fees-installments').value = fees.installment_plan || '';

    // Render faculty, scholarships, and gallery grids
    renderFacultyTable();
    renderScholarshipsTable();
    renderGalleryGrid();

    // Map placements data
    const pl = data.placements || {};
    document.getElementById('pl-highest').value = pl.highest_package || '';
    document.getElementById('pl-average').value = pl.average_package || '';
    document.getElementById('pl-rate').value = pl.placement_rate || '';
    
    let recruiters = '';
    if (pl.top_recruiters) {
        recruiters = Array.isArray(pl.top_recruiters) ? pl.top_recruiters.join(', ') : pl.top_recruiters;
    }
    document.getElementById('pl-recruiters').value = recruiters;
}

// --- Dynamic Fees Datatable Actions ---
function searchFees() {
    const input = document.getElementById('fee-search-input').value.toLowerCase();
    const courses = universityConfig.fees?.courses || [];
    
    filteredFees = courses.filter(c => {
        return (c.course_name || '').toLowerCase().includes(input) || 
               (c.level || '').toLowerCase().includes(input) || 
               (c.duration || '').toLowerCase().includes(input);
    });

    feePage = 1;
    renderFeesTable();
}

function resetFeeTableData() {
    const courses = universityConfig.fees?.courses || [];
    filteredFees = [...courses];
    feePage = 1;
    renderFeesTable();
}

function renderFeesTable() {
    const tbody = document.getElementById('fees-table-rows');
    const info = document.getElementById('fee-table-info');
    const prev = document.getElementById('btn-fee-prev');
    const next = document.getElementById('btn-fee-next');

    if (!tbody) return;
    tbody.innerHTML = '';

    const start = (feePage - 1) * feeLimit;
    const end = Math.min(start + feeLimit, filteredFees.length);
    const visibleData = filteredFees.slice(start, end);

    if (visibleData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">No matching courses found in database.</td></tr>`;
        info.textContent = `Showing 0 to 0 of 0 courses`;
        prev.disabled = true;
        next.disabled = true;
        return;
    }

    visibleData.forEach((course, index) => {
        const absoluteIndex = start + index;
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>
                <input type="text" class="form-control form-control-sm" value="${course.course_name}" 
                    onchange="updateFeeField(${absoluteIndex}, 'course_name', this.value)" placeholder="e.g. B.Tech Computer Science">
            </td>
            <td>
                <select class="form-select form-select-sm" onchange="updateFeeField(${absoluteIndex}, 'level', this.value)">
                    <option value="Undergraduate" ${course.level === 'Undergraduate' ? 'selected' : ''}>Undergraduate</option>
                    <option value="Postgraduate" ${course.level === 'Postgraduate' ? 'selected' : ''}>Postgraduate</option>
                    <option value="Doctoral" ${course.level === 'Doctoral' ? 'selected' : ''}>Doctoral</option>
                    <option value="Diploma" ${course.level === 'Diploma' ? 'selected' : ''}>Diploma</option>
                </select>
            </td>
            <td>
                <input type="text" class="form-control form-control-sm" value="${course.duration}" 
                    onchange="updateFeeField(${absoluteIndex}, 'duration', this.value)" placeholder="e.g. 4 Years">
            </td>
            <td>
                <input type="text" class="form-control form-control-sm" value="${course.tuition_fee_per_year}" 
                    onchange="updateFeeField(${absoluteIndex}, 'tuition_fee_per_year', this.value)" placeholder="e.g. ₹1,50,000">
            </td>
            <td class="text-center">
                <button type="button" class="btn btn-link text-danger text-decoration-none" onclick="deleteFeeCourse(${absoluteIndex})">
                    <i class="fa-regular fa-trash-can"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });

    info.textContent = `Showing ${start + 1} to ${end} of ${filteredFees.length} courses`;
    prev.disabled = (feePage === 1);
    next.disabled = (end >= filteredFees.length);
}

function updateFeeField(index, field, value) {
    filteredFees[index][field] = value.trim();
    const targetCourse = filteredFees[index];
    const coreIndex = universityConfig.fees.courses.findIndex(c => c === targetCourse);
    if (coreIndex !== -1) {
        universityConfig.fees.courses[coreIndex][field] = value.trim();
    }
}

function deleteFeeCourse(index) {
    const targetCourse = filteredFees[index];
    const coreIndex = universityConfig.fees.courses.findIndex(c => c === targetCourse);
    if (coreIndex !== -1) {
        universityConfig.fees.courses.splice(coreIndex, 1);
    }
    filteredFees.splice(index, 1);
    renderFeesTable();
    showToast('Course removed from staging fees table.', 'success');
}

// Pagination buttons
const btnFeePrev = document.getElementById('btn-fee-prev');
const btnFeeNext = document.getElementById('btn-fee-next');
if (btnFeePrev) {
    btnFeePrev.addEventListener('click', () => {
        if (feePage > 1) {
            feePage--;
            renderFeesTable();
        }
    });
}
if (btnFeeNext) {
    btnFeeNext.addEventListener('click', () => {
        if ((feePage * feeLimit) < filteredFees.length) {
            feePage++;
            renderFeesTable();
        }
    });
}

// --- Curriculum Accordion rendering ---
function renderSyllabiAccordion() {
    const accordion = document.getElementById('syllabusAccordion');
    if (!accordion) return;
    accordion.innerHTML = '';

    const filterVal = document.getElementById('faq-search-input')?.value.toLowerCase() || '';
    const syllabusData = universityConfig.syllabus || {};
    const filteredKeys = Object.keys(syllabusData).filter(course => course.toLowerCase().includes(filterVal));

    if (filteredKeys.length === 0) {
        accordion.innerHTML = `<p class="text-center text-muted py-4">No curriculums found matching query.</p>`;
        return;
    }

    filteredKeys.forEach((course, index) => {
        const item = document.createElement('div');
        item.className = 'accordion-item border-light bg-transparent';
        
        let semesterPanels = '';
        const sems = syllabusData[course] || {};
        
        Object.keys(sems).forEach(semester => {
            const list = sems[semester] || [];
            let listMarkup = '';
            list.forEach((sub, subIdx) => {
                listMarkup += `
                    <li class="list-group-item d-flex justify-content-between align-items-center bg-transparent border-light py-1.5" style="font-size:12px;">
                        <span>${sub}</span>
                        <button type="button" class="btn btn-link text-danger p-0" onclick="removeSubjectFromSyllabus('${course}', '${semester}', ${subIdx})">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </li>
                `;
            });

            semesterPanels += `
                <div class="mb-3">
                    <span class="text-secondary fw-semibold" style="font-size: 11px;">${semester}</span>
                    <ul class="list-group list-group-flush border-bottom border-light mb-2">
                        ${listMarkup || '<li class="list-group-item bg-transparent text-muted py-1 small">No subjects defined</li>'}
                    </ul>
                    <div class="input-group input-group-sm">
                        <input type="text" class="form-control bg-transparent text-white border-secondary" id="add-sub-input-${index}-${semester.replace(/\s+/g, '')}" placeholder="Add subject...">
                        <button class="btn btn-danger" type="button" onclick="addSubjectToSyllabus('${course}', '${semester}', ${index})"><i class="fa-solid fa-plus"></i></button>
                    </div>
                </div>
            `;
        });

        item.innerHTML = `
            <h2 class="accordion-header" id="heading-${index}">
                <button class="accordion-button collapsed bg-transparent text-white border-bottom border-light fw-bold" style="font-size: 13.5px;" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${index}" aria-expanded="false" aria-controls="collapse-${index}">
                    <i class="fa-solid fa-book-open me-2 text-danger-custom"></i>${course}
                </button>
            </h2>
            <div id="collapse-${index}" class="accordion-collapse collapse" aria-labelledby="heading-${index}" data-bs-parent="#syllabusAccordion">
                <div class="accordion-body border-light">
                    ${semesterPanels}
                    <div class="d-flex justify-content-between align-items-center mt-3 pt-3 border-top border-light">
                        <button class="btn btn-sm btn-outline-secondary" onclick="addSemesterToSyllabus('${course}')">
                            <i class="fa-solid fa-folder-plus me-1"></i>Add Semester
                        </button>
                        <button class="btn btn-sm btn-link text-danger text-decoration-none" onclick="deleteSyllabusProgram('${course}')">
                            <i class="fa-regular fa-trash-can me-1"></i>Delete Syllabus
                        </button>
                    </div>
                </div>
            </div>
        `;
        accordion.appendChild(item);
    });
}

function addSubjectToSyllabus(course, semester, index) {
    const inputId = `add-sub-input-${index}-${semester.replace(/\s+/g, '')}`;
    const input = document.getElementById(inputId);
    const text = input.value.trim();
    
    if (text) {
        if (!universityConfig.syllabus[course][semester]) {
            universityConfig.syllabus[course][semester] = [];
        }
        universityConfig.syllabus[course][semester].push(text);
        input.value = '';
        renderSyllabiAccordion();
        showToast('Subject added to current view.', 'success');
    }
}

function removeSubjectFromSyllabus(course, semester, idx) {
    universityConfig.syllabus[course][semester].splice(idx, 1);
    renderSyllabiAccordion();
    showToast('Subject deleted.', 'success');
}

function addSemesterToSyllabus(course) {
    const semName = prompt("Enter semester index name (e.g. Semester 4):");
    if (semName && semName.trim()) {
        const cleanName = semName.trim();
        if (!universityConfig.syllabus[course][cleanName]) {
            universityConfig.syllabus[course][cleanName] = [];
            renderSyllabiAccordion();
            showToast(`Added ${cleanName} to registry list.`, 'success');
        }
    }
}

function deleteSyllabusProgram(course) {
    if (confirm(`Are you sure you want to delete the entire curriculum syllabus for ${course}?`)) {
        delete universityConfig.syllabus[course];
        renderSyllabiAccordion();
        showToast('Curriculum deleted successfully.', 'success');
    }
}

// --- Logs panel rendering (Hooked to Server API) ---

async function fetchLogsFromServer() {
    try {
        const response = await adminFetch('/api/logs');
        const data = await response.json();
        logsList = data;
        resetLogsTableData();
        
        setTimeout(renderOverviewCharts, 200);
        
        const apiCountEl = document.getElementById('stat-total-api');
        const geminiCountEl = document.getElementById('stat-gemini-calls');
        if (apiCountEl) apiCountEl.textContent = logsList.length;
        if (geminiCountEl) {
            const geminiCount = logsList.filter(l => l.engine.includes("Gemini")).length;
            geminiCountEl.textContent = geminiCount;
        }
    } catch (e) {
        console.error('Error fetching logs:', e);
    }
}

async function clearLogsOnServer() {
    try {
        const response = await adminFetch('/api/logs', { method: 'DELETE' });
        const result = await response.json();
        if (response.ok && result.success) {
            logsList = [];
            resetLogsTableData();
            setTimeout(renderOverviewCharts, 100);
            showToast('Logs cleared successfully!', 'success');
        }
    } catch (e) {
        console.error('Error clearing logs:', e);
    }
}

function resetLogsTableData() {
    filteredLogs = [...logsList];
    logsPage = 1;
    renderLogsTable();
}

function searchLogs() {
    const input = document.getElementById('logs-search-input').value.toLowerCase();
    filteredLogs = logsList.filter(l => {
        return l.query.toLowerCase().includes(input) || 
               l.engine.toLowerCase().includes(input) || 
               l.status.toLowerCase().includes(input);
    });
    logsPage = 1;
    renderLogsTable();
}

function renderLogsTable() {
    const tbody = document.getElementById('logs-table-rows');
    const info = document.getElementById('logs-table-info');
    const prev = document.getElementById('btn-logs-prev');
    const next = document.getElementById('btn-logs-next');

    if (!tbody) return;
    tbody.innerHTML = '';

    const start = (logsPage - 1) * logsLimit;
    const end = Math.min(start + logsLimit, filteredLogs.length);
    const visibleData = filteredLogs.slice(start, end);

    if (visibleData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">No records found.</td></tr>`;
        info.textContent = `Showing 0 to 0 of 0 entries`;
        prev.disabled = true;
        next.disabled = true;
        return;
    }

    visibleData.forEach(log => {
        const row = document.createElement('tr');
        const badgeClass = log.status === 'Success' ? 'badge-outline-success' : 'badge-outline-warning';
        
        row.innerHTML = `
            <td class="text-muted" style="font-size: 11px;">${log.timestamp}</td>
            <td class="fw-semibold">${log.query}</td>
            <td><span class="text-secondary small">${log.engine}</span></td>
            <td><span class="${badgeClass}">${log.status}</span></td>
            <td class="text-end text-muted font-monospace">${log.latency}</td>
        `;
        tbody.appendChild(row);
    });

    info.textContent = `Showing ${start + 1} to ${end} of ${filteredLogs.length} entries`;
    prev.disabled = (logsPage === 1);
    next.disabled = (end >= filteredLogs.length);
}

const btnLogsPrev = document.getElementById('btn-logs-prev');
const btnLogsNext = document.getElementById('btn-logs-next');
if (btnLogsPrev) {
    btnLogsPrev.addEventListener('click', () => {
        if (logsPage > 1) {
            logsPage--;
            renderLogsTable();
        }
    });
}
if (btnLogsNext) {
    btnLogsNext.addEventListener('click', () => {
        if ((logsPage * logsLimit) < filteredLogs.length) {
            logsPage++;
            renderLogsTable();
        }
    });
}

// --- User Management panel rendering ---

async function fetchUsersFromServer() {
    try {
        const response = await adminFetch('/api/users');
        const data = await response.json();
        usersList = data;
        resetUsersTableData();
        
        const userCountEl = document.getElementById('stat-active-students');
        if (userCountEl) userCountEl.textContent = usersList.length;
    } catch (e) {
        console.error('Error fetching users:', e);
    }
}

async function deleteUserFromServer(index) {
    const targetUser = filteredUsers[index];
    const coreIndex = usersList.findIndex(u => u === targetUser);
    if (coreIndex === -1) return;

    try {
        const response = await adminFetch('/api/users', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ index: coreIndex })
        });
        const result = await response.json();
        if (response.ok && result.success) {
            fetchUsersFromServer();
            showToast('Student deleted from server record.', 'success');
        }
    } catch (e) {
        console.error('Error deleting user:', e);
    }
}

function resetUsersTableData() {
    filteredUsers = usersList.filter(u => u.preferred_university === currentAdminUnivId);
    usersPage = 1;
    renderUsersTable();
}

function searchUsers() {
    const input = document.getElementById('users-search-input').value.toLowerCase();
    const currentUnivUsers = usersList.filter(u => u.preferred_university === currentAdminUnivId);
    
    filteredUsers = currentUnivUsers.filter(u => {
        const name = u.fullname || u.name || '';
        const id = u.enrollment_id || u.id || '';
        return name.toLowerCase().includes(input) || 
               u.email.toLowerCase().includes(input) || 
               id.includes(input);
    });

    usersPage = 1;
    renderUsersTable();
}

function renderUsersTable() {
    const tbody = document.getElementById('users-table-rows');
    const info = document.getElementById('users-table-info');
    const prev = document.getElementById('btn-users-prev');
    const next = document.getElementById('btn-users-next');

    if (!tbody) return;
    tbody.innerHTML = '';

    const start = (usersPage - 1) * usersLimit;
    const end = Math.min(start + usersLimit, filteredUsers.length);
    const visibleData = filteredUsers.slice(start, end);

    if (visibleData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">No student records found.</td></tr>`;
        info.textContent = `Showing 0 to 0 of 0 students`;
        prev.disabled = true;
        next.disabled = true;
        return;
    }

    visibleData.forEach((user, index) => {
        const absoluteIndex = start + index;
        const row = document.createElement('tr');
        const badgeClass = user.status === 'Active' ? 'badge-outline-success' : 'badge-outline-warning';
        const name = user.fullname || user.name || 'N/A';
        const enrollId = user.enrollment_id || user.id || 'N/A';
        
        row.innerHTML = `
            <td class="fw-bold">${name}</td>
            <td><span class="text-muted font-monospace">${user.email}</span></td>
            <td><span class="text-secondary small font-monospace">${enrollId}</span></td>
            <td><span class="${badgeClass}">${user.status}</span></td>
            <td class="text-end">
                <button type="button" class="btn btn-link text-danger text-decoration-none btn-sm" onclick="deleteUserFromServer(${absoluteIndex})">
                    <i class="fa-regular fa-trash-can"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });

    info.textContent = `Showing ${start + 1} to ${end} of ${filteredUsers.length} students`;
    prev.disabled = (usersPage === 1);
    next.disabled = (end >= filteredUsers.length);
}

const btnUsersPrev = document.getElementById('btn-users-prev');
const btnUsersNext = document.getElementById('btn-users-next');
if (btnUsersPrev) {
    btnUsersPrev.addEventListener('click', () => {
        if (usersPage > 1) {
            usersPage--;
            renderUsersTable();
        }
    });
}
if (btnUsersNext) {
    btnUsersNext.addEventListener('click', () => {
        if ((usersPage * usersLimit) < filteredUsers.length) {
            usersPage++;
            renderUsersTable();
        }
    });
}

// --- Announcements panel rendering ---

async function fetchAnnouncementsFromServer() {
    try {
        const response = await adminFetch('/api/announcements');
        const data = await response.json();
        announcementsList = data;
        renderAnnouncements();
    } catch (e) {
        console.error('Error fetching announcements:', e);
    }
}

async function deleteAnnouncementFromServer(index) {
    try {
        const response = await adminFetch('/api/announcements', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ index: index })
        });
        const result = await response.json();
        if (response.ok && result.success) {
            fetchAnnouncementsFromServer();
            showToast('Announcement alert dismissed.', 'success');
        }
    } catch (e) {
        console.error('Error deleting announcement:', e);
    }
}

function renderAnnouncements() {
    const grid = document.getElementById('announcements-cards-grid');
    if (!grid) return;
    grid.innerHTML = '';

    if (announcementsList.length === 0) {
        grid.innerHTML = `<div class="col-12 text-center text-muted py-4">No announcements published.</div>`;
        return;
    }

    announcementsList.forEach((ann, index) => {
        const card = document.createElement('div');
        card.className = 'col-md-6';
        
        const imgStyle = ann.image ? `background-image: url('${ann.image}');` : "background-color: var(--secondary);";
        const imgContent = ann.image ? '' : '<div class="d-flex h-100 align-items-center justify-content-center text-white-50"><i class="fa-solid fa-bullhorn fa-2x"></i></div>';

        card.innerHTML = `
            <div class="announcement-card h-100">
                <span class="badge-announcement">${ann.type}</span>
                <div class="d-flex gap-3 text-start">
                    <div class="announcement-image-box" style="width: 80px; height: 80px; border-radius:8px; background-size:cover; background-position:center; flex-shrink:0; ${imgStyle}">
                        ${imgContent}
                    </div>
                    <div class="announcement-details flex-grow-1">
                        <h5 class="fw-bold mb-1" style="font-size: 14px; padding-right:60px;">${ann.title}</h5>
                        <p class="text-muted small mb-0">${ann.desc}</p>
                    </div>
                </div>
                <div class="text-end mt-3 border-top border-light pt-2">
                    <button class="btn btn-link text-danger text-decoration-none btn-sm" style="padding:0; font-size:11px;" onclick="deleteAnnouncementFromServer(${index})">
                        <i class="fa-regular fa-trash-can me-1"></i>Delete Alert
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// --- Bind Search Inputs ---
function initSearchFilters() {
    const feeSearch = document.getElementById('fee-search-input');
    if (feeSearch) feeSearch.addEventListener('input', searchFees);

    const faqSearch = document.getElementById('faq-search-input');
    if (faqSearch) faqSearch.addEventListener('input', renderSyllabiAccordion);

    const logsSearch = document.getElementById('logs-search-input');
    if (logsSearch) logsSearch.addEventListener('input', searchLogs);

    const usersSearch = document.getElementById('users-search-input');
    if (usersSearch) usersSearch.addEventListener('input', searchUsers);
}

// --- Toast message helpers ---
function showToast(message, type = 'success') {
    const adminToast = document.getElementById('admin-toast');
    const adminToastMessage = document.getElementById('admin-toast-message');
    const adminToastIcon = document.getElementById('admin-toast-icon');

    if (!adminToast) return;

    adminToastMessage.textContent = message;
    
    if (type === 'success') {
        adminToastIcon.className = 'fa-solid fa-circle-check text-success';
        adminToast.style.borderLeft = '4px solid var(--emerald)';
    } else {
        adminToastIcon.className = 'fa-solid fa-triangle-exclamation text-danger';
        adminToast.style.borderLeft = '4px solid var(--primary)';
    }

    adminToast.classList.remove('hidden');
    
    setTimeout(() => {
        adminToast.classList.add('hidden');
    }, 3000);
}

// --- Save Functions ---

async function saveUniversityDetails() {
    if (!universityConfig.contact) universityConfig.contact = {};
    if (!universityConfig.admissions) universityConfig.admissions = {};
    if (!universityConfig.admissions.undergraduate) universityConfig.admissions.undergraduate = {};
    if (!universityConfig.admissions.postgraduate) universityConfig.admissions.postgraduate = {};
    if (!universityConfig.exams) universityConfig.exams = {};
    if (!universityConfig.exams.schedule) universityConfig.exams.schedule = {};
    if (!universityConfig.exams.policies) universityConfig.exams.policies = {};

    universityConfig.university_name = document.getElementById('univ-name').value.trim();
    
    // Contact
    universityConfig.contact.email = document.getElementById('univ-email').value.trim();
    universityConfig.contact.phone = document.getElementById('univ-phone').value.trim();
    universityConfig.contact.address = document.getElementById('univ-address').value.trim();
    universityConfig.contact.office_hours = document.getElementById('univ-hours').value.trim();
    universityConfig.contact.website = document.getElementById('univ-website').value.trim();

    // Admissions UG
    universityConfig.admissions.undergraduate.deadline = document.getElementById('ug-deadline').value.trim();
    universityConfig.admissions.undergraduate.eligibility = document.getElementById('ug-eligible').value.trim();
    universityConfig.admissions.undergraduate.process = document.getElementById('ug-process').value.trim();

    // Admissions PG
    universityConfig.admissions.postgraduate.deadline = document.getElementById('pg-deadline').value.trim();
    universityConfig.admissions.postgraduate.eligibility = document.getElementById('pg-eligible').value.trim();
    universityConfig.admissions.postgraduate.process = document.getElementById('pg-process').value.trim();

    // Exams Range
    universityConfig.exams.schedule.mid_term = document.getElementById('exam-mid').value.trim();
    universityConfig.exams.schedule.final_exam = document.getElementById('exam-final').value.trim();
    universityConfig.exams.schedule.results_release = document.getElementById('exam-result').value.trim();

    // Policies
    universityConfig.exams.policies.attendance_requirement = document.getElementById('policy-attendance').value.trim();
    universityConfig.exams.policies.grading_system = document.getElementById('policy-grading').value.trim();
    universityConfig.exams.policies.makeup_exams = document.getElementById('policy-makeup').value.trim();

    // Placements
    if (!universityConfig.placements) universityConfig.placements = {};
    universityConfig.placements.highest_package = document.getElementById('pl-highest').value.trim();
    universityConfig.placements.average_package = document.getElementById('pl-average').value.trim();
    universityConfig.placements.placement_rate = document.getElementById('pl-rate').value.trim();
    
    const recruitersInput = document.getElementById('pl-recruiters').value.trim();
    universityConfig.placements.top_recruiters = recruitersInput ? recruitersInput.split(',').map(r => r.trim()).filter(r => r) : [];

    // Post to Server
    await postUpdatedConfigToServer();
}

async function saveFeesRegistryData() {
    if (!universityConfig.fees) universityConfig.fees = {};
    
    universityConfig.fees.payment_methods = document.getElementById('fees-methods').value.trim();
    universityConfig.fees.refund_policy = document.getElementById('fees-refund').value.trim();
    universityConfig.fees.installment_plan = document.getElementById('fees-installments').value.trim();

    await postUpdatedConfigToServer();
}

async function saveSyllabusRegistryData() {
    await postUpdatedConfigToServer();
}

async function postUpdatedConfigToServer() {
    try {
        const response = await adminFetch(`/api/config?university_id=${currentAdminUnivId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(universityConfig)
        });
        const result = await response.json();
        
        if (response.ok && result.success) {
            showToast('Console configuration sync succeeded!', 'success');
            fetchConfigData();
        } else {
            showToast(result.message || 'Configuration sync failed.', 'error');
        }
    } catch (e) {
        showToast('Connection parameters lost.', 'error');
        console.error('Error posting updated configurations:', e);
    }
}

async function saveGeminiKey() {
    const key = document.getElementById('gemini-api-key').value.trim();
    if (key === '••••••••••••••••••••') {
        showToast('Developer API key is already verified.', 'success');
        return;
    }

    try {
        const response = await adminFetch('/api/key', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ api_key: key })
        });
        const result = await response.json();
        
        if (response.ok && result.success) {
            showToast('Gemini connection key updated!', 'success');
            checkApiKeyStatus();
        } else {
            showToast(result.message || 'Key configuration check failed.', 'error');
        }
    } catch (error) {
        showToast('Failed to contact auth key engine.', 'error');
        console.error('Error updating key:', error);
    }
}

// --- Faculty directory rendering & local updates ---
function renderFacultyTable() {
    const tbody = document.getElementById('admin-faculty-table-rows');
    if (!tbody) return;
    tbody.innerHTML = '';
    const faculty = universityConfig.faculty || [];
    faculty.forEach((f, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><input type="text" class="form-control form-control-sm border-0 bg-transparent" value="${f.name || ''}" onchange="updateFacultyField(${index}, 'name', this.value)"></td>
            <td><input type="text" class="form-control form-control-sm border-0 bg-transparent" value="${f.designation || ''}" onchange="updateFacultyField(${index}, 'designation', this.value)"></td>
            <td><input type="text" class="form-control form-control-sm border-0 bg-transparent" value="${f.department || ''}" onchange="updateFacultyField(${index}, 'department', this.value)"></td>
            <td><input type="email" class="form-control form-control-sm border-0 bg-transparent" value="${f.email || ''}" onchange="updateFacultyField(${index}, 'email', this.value)"></td>
            <td>
                <button type="button" class="btn btn-outline-danger btn-xs" onclick="deleteFacultyMember(${index})"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.updateFacultyField = function(index, field, value) {
    if (!universityConfig.faculty) universityConfig.faculty = [];
    if (universityConfig.faculty[index]) {
        universityConfig.faculty[index][field] = value.trim();
    }
};

window.deleteFacultyMember = function(index) {
    if (universityConfig.faculty) {
        universityConfig.faculty.splice(index, 1);
        renderFacultyTable();
    }
};

// --- Scholarships registry rendering & local updates ---
function renderScholarshipsTable() {
    const tbody = document.getElementById('admin-schol-table-rows');
    if (!tbody) return;
    tbody.innerHTML = '';
    const scholarships = universityConfig.scholarships || [];
    scholarships.forEach((s, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><input type="text" class="form-control form-control-sm border-0 bg-transparent" value="${s.title || ''}" onchange="updateScholField(${index}, 'title', this.value)"></td>
            <td><input type="text" class="form-control form-control-sm border-0 bg-transparent" value="${s.eligibility || ''}" onchange="updateScholField(${index}, 'eligibility', this.value)"></td>
            <td><input type="text" class="form-control form-control-sm border-0 bg-transparent" value="${s.amount || ''}" onchange="updateScholField(${index}, 'amount', this.value)"></td>
            <td>
                <button type="button" class="btn btn-outline-danger btn-xs" onclick="deleteScholarship(${index})"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.updateScholField = function(index, field, value) {
    if (!universityConfig.scholarships) universityConfig.scholarships = [];
    if (universityConfig.scholarships[index]) {
        universityConfig.scholarships[index][field] = value.trim();
    }
};

window.deleteScholarship = function(index) {
    if (universityConfig.scholarships) {
        universityConfig.scholarships.splice(index, 1);
        renderScholarshipsTable();
    }
};

// --- Gallery grid rendering & local updates ---
function renderGalleryGrid() {
    const grid = document.getElementById('admin-gallery-preview-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const gallery = universityConfig.gallery || [];
    gallery.forEach((imgUrl, index) => {
        const col = document.createElement('div');
        col.className = 'col-md-3 position-relative p-1';
        col.style.height = '100px';
        col.innerHTML = `
            <img src="${imgUrl}" class="w-100 h-100 object-fit-cover rounded border" onerror="this.src='https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=200'">
            <button type="button" class="btn btn-danger btn-xs position-absolute top-0 end-0 m-1 rounded-circle d-flex align-items-center justify-content-center" style="width:20px; height:20px; padding:0; line-height:20px;" onclick="deleteGalleryImage(${index})">&times;</button>
        `;
        grid.appendChild(col);
    });
}

window.deleteGalleryImage = function(index) {
    if (universityConfig.gallery) {
        universityConfig.gallery.splice(index, 1);
        renderGalleryGrid();
    }
};

// --- University CRUD Listeners Setup ---
function initUniversityCrudButtons() {
    // Add Faculty Local Row
    const btnAddFacMember = document.getElementById('btn-add-fac-member');
    if (btnAddFacMember) {
        btnAddFacMember.addEventListener('click', () => {
            const name = document.getElementById('new-fac-name').value.trim();
            const desig = document.getElementById('new-fac-desig').value.trim();
            const dept = document.getElementById('new-fac-dept').value.trim();
            const email = document.getElementById('new-fac-email').value.trim();
            
            if (!name) {
                showToast('Faculty member name is required.', 'error');
                return;
            }
            if (!universityConfig.faculty) universityConfig.faculty = [];
            universityConfig.faculty.push({ name, designation: desig, department: dept, email });
            renderFacultyTable();
            
            document.getElementById('new-fac-name').value = '';
            document.getElementById('new-fac-desig').value = '';
            document.getElementById('new-fac-dept').value = '';
            document.getElementById('new-fac-email').value = '';
        });
    }

    // Add Scholarship Local Row
    const btnAddScholMember = document.getElementById('btn-add-schol-member');
    if (btnAddScholMember) {
        btnAddScholMember.addEventListener('click', () => {
            const title = document.getElementById('new-schol-title').value.trim();
            const eligibility = document.getElementById('new-schol-elig').value.trim();
            const amount = document.getElementById('new-schol-amount').value.trim();
            
            if (!title) {
                showToast('Scholarship title is required.', 'error');
                return;
            }
            if (!universityConfig.scholarships) universityConfig.scholarships = [];
            universityConfig.scholarships.push({ title, eligibility, amount });
            renderScholarshipsTable();
            
            document.getElementById('new-schol-title').value = '';
            document.getElementById('new-schol-elig').value = '';
            document.getElementById('new-schol-amount').value = '';
        });
    }

    // Add Gallery Image URL
    const btnAddGalleryImg = document.getElementById('btn-add-gallery-img');
    if (btnAddGalleryImg) {
        btnAddGalleryImg.addEventListener('click', () => {
            const url = document.getElementById('new-gallery-url').value.trim();
            if (!url) {
                showToast('Image URL cannot be empty.', 'error');
                return;
            }
            if (!universityConfig.gallery) universityConfig.gallery = [];
            universityConfig.gallery.push(url);
            renderGalleryGrid();
            
            document.getElementById('new-gallery-url').value = '';
        });
    }

    // Delete Active University
    const btnDeleteActiveUniv = document.getElementById('btn-delete-active-univ');
    if (btnDeleteActiveUniv) {
        btnDeleteActiveUniv.addEventListener('click', async () => {
            if (confirm(`Are you absolutely sure you want to delete ${currentAdminUnivId.toUpperCase()} university? This will erase all courses, logs, and chunks!`)) {
                try {
                    const response = await adminFetch(`/api/universities?id=${currentAdminUnivId}`, {
                        method: 'DELETE'
                    });
                    const result = await response.json();
                    if (response.ok && result.success) {
                        showToast('University deleted successfully.', 'success');
                        await initAdminUnivSelector();
                    } else {
                        showToast(result.message || 'Deletion failed.', 'error');
                    }
                } catch (e) {
                    showToast('Connection failed.', 'error');
                }
            }
        });
    }

    // Add University Form Submission
    const addUnivForm = document.getElementById('add-university-form');
    if (addUnivForm) {
        addUnivForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('modal-univ-id').value.trim().toLowerCase();
            const name = document.getElementById('modal-univ-name').value.trim();
            const website = document.getElementById('modal-univ-website').value.trim();
            const logo = document.getElementById('modal-univ-logo').value.trim();
            
            const details = {
                university_name: name,
                description: `Explore syllabus guidelines, placements, and campus life at ${name}.`,
                logo: logo,
                ranking: "N/A",
                accreditation: "N/A",
                contact: {
                    website: website,
                    email: `admissions@${id}.edu.in`,
                    phone: "+91 99999 88888",
                    address: "University Main Campus, India",
                    office_hours: "9:00 AM - 5:00 PM"
                },
                admissions: {
                    undergraduate: { deadline: "July 31", eligibility: "Passed 10+2 with minimum 50%", process: "Direct Merit Admission" },
                    postgraduate: { deadline: "August 15", eligibility: "Graduate degree with 55%", process: "Entrance Merit" }
                },
                fees: {
                    courses: [
                        { course_name: "B.Tech Computer Science Engineering", level: "Undergraduate", duration: "4 Years", tuition_fee_per_year: "95,000" },
                        { course_name: "MBA General Management", level: "Postgraduate", duration: "2 Years", tuition_fee_per_year: "1,20,000" }
                    ]
                },
                faculty: [
                    { name: "Dr. A. K. Sharma", designation: "Dean & Head", department: "CSE", email: "dean.cse@university.edu" }
                ],
                gallery: [],
                placements: { highest_package: "28.5 LPA", average_package: "4.8 LPA", placement_rate: "88%", top_recruiters: ["TCS", "Infosys", "Capgemini"] },
                faqs: [
                    { question: "What is the attendance policy?", answer: "75% attendance is required to appear in final exams." }
                ]
            };
            
            try {
                const response = await adminFetch('/api/universities', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id, details })
                });
                const result = await response.json();
                if (response.ok && result.success) {
                    showToast(`University ${name} registered successfully!`, 'success');
                    
                    // Close Bootstrap modal
                    const modalEl = document.getElementById('addUnivModal');
                    const modal = bootstrap.Modal.getInstance(modalEl);
                    if (modal) modal.hide();
                    
                    await initAdminUnivSelector();
                    switchAdminUniversity(id);
                } else {
                    showToast(result.message || 'Registration failed.', 'error');
                }
            } catch (err) {
                showToast('Network error during registration.', 'error');
            }
        });
    }
    // Add new announcement form listener with image upload support
    const addAnnouncementForm = document.getElementById('add-announcement-form');
    if (addAnnouncementForm) {
        addAnnouncementForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById('modal-ann-title').value.trim();
            const desc = document.getElementById('modal-ann-desc').value.trim();
            const type = document.getElementById('modal-ann-type').value.trim();
            let image = document.getElementById('modal-ann-image-url').value.trim();
            
            const fileInput = document.getElementById('modal-ann-file');
            if (fileInput.files.length > 0) {
                const formData = new FormData();
                formData.append('file', fileInput.files[0]);
                try {
                    showToast('Uploading announcement image...', 'success');
                    const uploadResp = await adminFetch('/api/admin/upload', {
                        method: 'POST',
                        body: formData
                    });
                    const uploadResult = await uploadResp.json();
                    if (uploadResp.ok && uploadResult.url) {
                        image = uploadResult.url;
                    } else {
                        showToast(uploadResult.message || 'File upload failed.', 'error');
                        return;
                    }
                } catch (err) {
                    showToast('File upload failed due to connection error.', 'error');
                    return;
                }
            }
            
            try {
                const response = await adminFetch('/api/announcements', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, desc, type, image })
                });
                const result = await response.json();
                if (response.ok && result.success) {
                    // Close Bootstrap Modal
                    const modalEl = document.getElementById('addAnnouncementModal');
                    const modal = bootstrap.Modal.getInstance(modalEl);
                    if (modal) modal.hide();
                    
                    addAnnouncementForm.reset();
                    fetchAnnouncementsFromServer();
                    showToast('Announcement alert published!', 'success');
                } else {
                    showToast(result.message || 'Failed to post announcement.', 'error');
                }
            } catch (e) {
                showToast('Failed to post announcement.', 'error');
            }
        });
    }

    // Gallery upload change listener
    const newGalleryFile = document.getElementById('new-gallery-file');
    if (newGalleryFile) {
        newGalleryFile.addEventListener('change', async () => {
            if (newGalleryFile.files.length === 0) return;
            const formData = new FormData();
            formData.append('file', newGalleryFile.files[0]);
            try {
                showToast('Uploading campus image...', 'success');
                const response = await adminFetch('/api/admin/upload', {
                    method: 'POST',
                    body: formData
                });
                const result = await response.json();
                if (response.ok && result.url) {
                    if (!universityConfig.gallery) universityConfig.gallery = [];
                    universityConfig.gallery.push(result.url);
                    renderGalleryGrid();
                    newGalleryFile.value = '';
                    showToast('Image uploaded and staged!', 'success');
                } else {
                    showToast(result.message || 'Failed to upload image.', 'error');
                }
            } catch (e) {
                showToast('Connection error during upload.', 'error');
            }
        });
    }
}

// Fetch dynamic analytics from database
async function fetchAnalyticsData() {
    try {
        const response = await adminFetch('/api/admin/analytics');
        if (response.ok) {
            const data = await response.json();
            
            // Populate stats cards
            const totalApiEl = document.getElementById('stat-total-api');
            const geminiCallsEl = document.getElementById('stat-gemini-calls');
            const activeStudentsEl = document.getElementById('stat-active-students');
            
            if (totalApiEl) totalApiEl.textContent = data.total_queries || 0;
            if (geminiCallsEl) {
                // Combine relevant RAG categories or use total queries
                geminiCallsEl.textContent = data.total_queries || 0;
            }
            if (activeStudentsEl) activeStudentsEl.textContent = data.total_students || 0;
            
            // Cache query distribution to render charts
            window.__query_distribution = data.query_distribution;
            renderOverviewCharts();
        }
    } catch (e) {
        console.error('Error fetching analytics metrics:', e);
    }
}

// Intercept switch university to reload analytics
const originalSwitchAdminUniversity = window.switchAdminUniversity;
window.switchAdminUniversity = function(id) {
    if (originalSwitchAdminUniversity) {
        originalSwitchAdminUniversity(id);
    }
    fetchAnalyticsData();
};

// Call listener setup on script load
document.addEventListener('DOMContentLoaded', () => {
    initUniversityCrudButtons();
    setTimeout(fetchAnalyticsData, 500);
});

// State Variables
let universityConfig = {};
let hasApiKey = false;
let userLanguage = 'en';

// Chat History State
let currentConversationId = null;
let conversations = {};

// DOM Elements
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const typingIndicator = document.getElementById('typing-indicator');
const chatSkeleton = document.getElementById('chat-skeleton');
const suggestionsContainer = document.getElementById('suggestions');

// Engine Status Badge indicators
const engineIndicator = document.getElementById('engine-indicator');
const engineText = document.getElementById('engine-text');
const apiBadgeIndicator = document.getElementById('api-badge-indicator');

// Theme Toggles
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const exportChatBtn = document.getElementById('export-chat-btn');

// History Sidebar selectors
const historyItemsList = document.getElementById('history-items');
const btnClearHistory = document.getElementById('btn-clear-history');
const searchHistoryInput = document.getElementById('search-history-input');
const newChatBtn = document.getElementById('new-chat-btn');

// Toast Elements
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');
const toastIcon = document.getElementById('toast-icon');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Fetch state from endpoints
    fetchConfig();
    checkApiKeyStatus();

    // Load Chat History from LocalStorage
    initChatHistory();

    // Setup Theme from LocalStorage
    const savedTheme = localStorage.getItem('theme') || 'light-mode';
    document.body.className = savedTheme;
    updateThemeToggleUI(savedTheme);

    // Setup marked options for safe parsing
    if (window.marked) {
        marked.setOptions({
            breaks: true,
            sanitize: false // Allow HTML in markdown safely
        });
    }

    // Toggle Portal Modal View listeners
    initPortalModalListeners();

    // Trigger statistics counter animations
    initStatisticsObserver();

    // Init Voice Recognition features
    initVoiceRecognition();

    // Bind Premium features triggers
    initPremiumInteractions();

    // Auto-scroll chat to bottom
    scrollToBottom();
});

// --- Theme Toggling ---
if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
        if (document.body.classList.contains('light-mode')) {
            document.body.classList.remove('light-mode');
            document.body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark-mode');
            updateThemeToggleUI('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
            document.body.classList.add('light-mode');
            localStorage.setItem('theme', 'light-mode');
            updateThemeToggleUI('light-mode');
        }
    });
}

function updateThemeToggleUI(theme) {
    if (!themeToggleBtn) return;
    const icon = themeToggleBtn.querySelector('i');
    if (theme === 'dark-mode') {
        icon.className = 'fa-solid fa-sun';
    } else {
        icon.className = 'fa-solid fa-moon';
    }
}

// --- Toast Messages ---
function showToast(message, type = 'success') {
    toastMessage.textContent = message;
    
    if (type === 'success') {
        toastIcon.className = 'fa-solid fa-circle-check text-success';
        toast.style.borderLeft = '4px solid var(--success)';
    } else {
        toastIcon.className = 'fa-solid fa-triangle-exclamation text-danger';
        toast.style.borderLeft = '4px solid var(--danger)';
    }

    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// --- Chat Input Handling ---
if (chatInput) {
    chatInput.addEventListener('input', () => {
        chatInput.style.height = 'auto';
        chatInput.style.height = (chatInput.scrollHeight) + 'px';
    });

    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submitChatMessage();
        }
    });
}

if (sendBtn) {
    sendBtn.addEventListener('click', submitChatMessage);
}

// Set suggestions chip actions
if (suggestionsContainer) {
    suggestionsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('suggestion-chip')) {
            let promptText = e.target.textContent.replace(/[📥🔍📅📚]/g, '').trim();
            if (promptText === 'View Courses') {
                promptText = 'Show me the course fee structures per year';
            } else if (promptText === 'Syllabus') {
                promptText = 'Show me all course syllabi';
            }
            chatInput.value = promptText;
            chatInput.focus();
            submitChatMessage();
        }
    });
}

// Welcome dashboard card actions
if (chatMessages) {
    chatMessages.addEventListener('click', (e) => {
        const card = e.target.closest('.welcome-card-item');
        if (card) {
            const promptText = card.getAttribute('data-query');
            if (promptText) {
                chatInput.value = promptText;
                chatInput.focus();
                submitChatMessage();
            }
        }
    });
}

function scrollToBottom() {
    if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// --- API Service Calls ---

async function fetchConfig() {
    try {
        const response = await fetch('/api/config');
        const data = await response.json();
        universityConfig = data;
        
        // Update Title references
        const elName = document.getElementById('sidebar-univ-name');
        if (elName) elName.textContent = data.university_name || 'Parul University';
        
    } catch (error) {
        console.error('Error fetching university configuration:', error);
        showToast('Error loading configuration data.', 'error');
    }
}

async function checkApiKeyStatus() {
    try {
        const response = await fetch('/api/key');
        const data = await response.json();
        hasApiKey = data.has_key;
        
        if (hasApiKey) {
            if (engineIndicator) engineIndicator.classList.add('ai-active');
            if (engineText) engineText.textContent = 'Gemini AI Engine';
            
            if (apiBadgeIndicator) {
                apiBadgeIndicator.className = 'api-badge ai-badge-active';
                apiBadgeIndicator.querySelector('span').textContent = 'Gemini AI Mode';
                apiBadgeIndicator.querySelector('i').className = 'fa-solid fa-wand-magic-sparkles';
            }
        } else {
            if (engineIndicator) engineIndicator.classList.remove('ai-active');
            if (engineText) engineText.textContent = 'Local NLP Engine';
            
            if (apiBadgeIndicator) {
                apiBadgeIndicator.className = 'api-badge';
                apiBadgeIndicator.querySelector('span').textContent = 'Offline NLP';
                apiBadgeIndicator.querySelector('i').className = 'fa-solid fa-circle-check';
            }
        }
    } catch (error) {
        console.error('Error reading key status:', error);
    }
}

async function submitChatMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    // Hide welcome dashboard if active
    const welcomeDashboard = document.getElementById('welcome-dashboard');
    if (welcomeDashboard && !welcomeDashboard.classList.contains('hidden')) {
        welcomeDashboard.classList.add('hidden');
    }

    // Clear input & reset height
    chatInput.value = '';
    chatInput.style.height = '36px';

    // Append User Message bubble
    appendMessage(text, 'user');
    scrollToBottom();

    // Show loading skeleton instead of standard tiny indicator for Vercel feel
    if (chatSkeleton) chatSkeleton.classList.remove('hidden');
    scrollToBottom();

    // Multilingual helper: prepend translation instructions if language is not English
    let queryText = text;
    if (userLanguage === 'hi') {
        queryText += " (Please respond in Hindi)";
    } else if (userLanguage === 'gu') {
        queryText += " (Please respond in Gujarati)";
    }

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: queryText })
        });
        
        const data = await response.json();
        
        // Hide loading skeleton
        if (chatSkeleton) chatSkeleton.classList.add('hidden');
        
        if (response.ok) {
            appendMessage(data.response, 'bot', data.source);
            // Save to current thread history
            saveMessageToHistory(text, 'user');
            saveMessageToHistory(data.response, 'bot', data.source);
        } else {
            appendMessage(`Error: ${data.response || 'Something went wrong.'}`, 'bot');
        }
        scrollToBottom();
    } catch (error) {
        if (chatSkeleton) chatSkeleton.classList.add('hidden');
        appendMessage('Oops, I had trouble reaching the server. Please check your connection and try again!', 'bot');
        scrollToBottom();
        console.error('Error submitting message:', error);
    }
}

function appendMessage(text, sender, source = '') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;

    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar';
    avatarDiv.innerHTML = sender === 'user' ? '<i class="fa-regular fa-user"></i>' : '<i class="fa-solid fa-robot"></i>';
    
    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'message-bubble';
    
    const textDiv = document.createElement('div');
    textDiv.className = 'message-text';
    
    if (sender === 'bot' && window.marked) {
        textDiv.innerHTML = window.marked.parse(text);
    } else {
        const p = document.createElement('p');
        p.textContent = text;
        textDiv.appendChild(p);
    }

    bubbleDiv.appendChild(textDiv);

    // Add source badge for bot responses
    if (sender === 'bot' && source) {
        const sourcePill = document.createElement('span');
        sourcePill.className = 'bot-source-pill';
        sourcePill.innerHTML = `<i class="fa-solid fa-microchip"></i> ${source}`;
        bubbleDiv.appendChild(sourcePill);
    }

    // Bubble actions footer (Improved with Speak, Copy, and Thumbs rating triggers)
    if (sender === 'bot') {
        const actionRow = document.createElement('div');
        actionRow.className = 'd-flex gap-3 mt-2.5 opacity-75 text-muted align-items-center flex-wrap';
        actionRow.style.fontSize = '10px';
        
        // Clean speech text
        const speechStr = text.replace(/['"`]/g, '').replace(/[*#]/g, '');

        actionRow.innerHTML = `
            <span style="cursor: pointer;" onclick="navigator.clipboard.writeText(\`${text.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`); showToast('Copied to clipboard!', 'success');" title="Copy Response">
                <i class="fa-regular fa-copy me-1"></i>Copy
            </span>
            <span class="tts-speak-btn" onclick="speakBotResponse(this, \`${speechStr}\`)" title="Listen response">
                <i class="fa-solid fa-volume-high me-1"></i>Listen
            </span>
            <div class="d-flex gap-2 ms-auto">
                <span class="feedback-rate-btn" onclick="rateBotResponse(this, 'up')" title="Good response"><i class="fa-regular fa-thumbs-up"></i></span>
                <span class="feedback-rate-btn" onclick="rateBotResponse(this, 'down')" title="Bad response"><i class="fa-regular fa-thumbs-down"></i></span>
            </div>
        `;
        bubbleDiv.appendChild(actionRow);
    }

    const timeSpan = document.createElement('span');
    timeSpan.className = 'message-time';
    timeSpan.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    bubbleDiv.appendChild(timeSpan);

    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(bubbleDiv);
    
    if (chatMessages) {
        chatMessages.appendChild(messageDiv);
    }
}

// --- Portal Gateway Form Mocking ---
function initPortalModalListeners() {
    const loginModalBtn = document.getElementById('login-modal-btn');
    const loginModal = document.getElementById('login-modal');
    const tabLogin = document.getElementById('modal-tab-login');
    const tabRegister = document.getElementById('modal-tab-register');
    const panelLogin = document.getElementById('modal-panel-login');
    const panelRegister = document.getElementById('modal-panel-register');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const userProfileBadge = document.getElementById('user-profile-badge');
    const userLoginId = document.getElementById('user-login-id');

    // Open Modal button handler
    if (loginModalBtn && loginModal) {
        loginModalBtn.addEventListener('click', () => {
            loginModal.classList.remove('hidden');
        });
    }

    // Toggle Modal Tabs
    if (tabLogin && tabRegister) {
        tabLogin.addEventListener('click', () => {
            tabLogin.classList.add('active');
            tabRegister.classList.remove('active');
            panelLogin.classList.add('active');
            panelRegister.classList.remove('active');
        });

        tabRegister.addEventListener('click', () => {
            tabRegister.classList.add('active');
            tabLogin.classList.remove('active');
            panelRegister.classList.add('active');
            panelLogin.classList.remove('active');
        });
    }

    // Toggle Password Visibility
    const toggleLoginPass = document.getElementById('toggle-login-password');
    const loginPassInput = document.getElementById('login-password');
    if (toggleLoginPass && loginPassInput) {
        toggleLoginPass.addEventListener('click', () => {
            const isPass = loginPassInput.getAttribute('type') === 'password';
            loginPassInput.setAttribute('type', isPass ? 'text' : 'password');
            toggleLoginPass.className = isPass ? 'fa-solid fa-eye-slash toggle-password-btn' : 'fa-regular fa-eye toggle-password-btn';
        });
    }

    const toggleRegPass = document.getElementById('toggle-reg-password');
    const regPassInput = document.getElementById('reg-password');
    if (toggleRegPass && regPassInput) {
        toggleRegPass.addEventListener('click', () => {
            const isPass = regPassInput.getAttribute('type') === 'password';
            regPassInput.setAttribute('type', isPass ? 'text' : 'password');
            toggleRegPass.className = isPass ? 'fa-solid fa-eye-slash toggle-password-btn' : 'fa-regular fa-eye toggle-password-btn';
        });
    }

    // Password strength check
    const pwdStrengthBar = document.getElementById('pwd-strength-bar');
    const pwdStrengthText = document.getElementById('pwd-strength-text');
    if (regPassInput && pwdStrengthBar && pwdStrengthText) {
        regPassInput.addEventListener('input', () => {
            const val = regPassInput.value;
            pwdStrengthBar.className = 'pwd-strength-bar';
            
            if (val.length === 0) {
                pwdStrengthText.textContent = 'Weak';
                pwdStrengthText.style.color = 'var(--text-muted)';
                pwdStrengthBar.style.width = '0%';
            } else if (val.length < 5) {
                pwdStrengthText.textContent = 'Weak';
                pwdStrengthText.style.color = 'var(--danger)';
                pwdStrengthBar.classList.add('weak');
            } else if (val.length < 8 || !/[A-Z]/.test(val) || !/[0-9]/.test(val)) {
                pwdStrengthText.textContent = 'Medium';
                pwdStrengthText.style.color = 'var(--warning)';
                pwdStrengthBar.classList.add('medium');
            } else {
                pwdStrengthText.textContent = 'Strong';
                pwdStrengthText.style.color = 'var(--success)';
                pwdStrengthBar.classList.add('strong');
            }
        });
    }

    // Submit actions (Hooked to backend REST API)
    if (loginForm && loginModal) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const emailVal = document.getElementById('login-email').value.trim();
            
            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: emailVal })
                });
                const result = await response.json();
                
                if (response.ok && result.success) {
                    loginModal.classList.add('hidden');
                    
                    // Show logged in badge
                    if (loginModalBtn && userProfileBadge && userLoginId) {
                        loginModalBtn.classList.add('hidden');
                        userProfileBadge.classList.remove('hidden');
                        userLoginId.textContent = result.user.email;
                    }
                    showToast(result.message, 'success');
                } else {
                    showToast(result.message || 'Authentication failed.', 'error');
                }
            } catch (err) {
                console.error(err);
                showToast('Failed to connect to authentication server.', 'error');
            }
        });
    }

    if (registerForm && loginModal) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fullnameVal = document.getElementById('reg-fullname').value.trim();
            const emailVal = document.getElementById('reg-email').value.trim();
            const passwordVal = document.getElementById('reg-password').value;
            
            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        fullname: fullnameVal,
                        email: emailVal,
                        password: passwordVal
                    })
                });
                const result = await response.json();
                
                if (response.ok && result.success) {
                    loginModal.classList.add('hidden');
                    
                    // Show logged in badge
                    if (loginModalBtn && userProfileBadge && userLoginId) {
                        loginModalBtn.classList.add('hidden');
                        userProfileBadge.classList.remove('hidden');
                        userLoginId.textContent = emailVal;
                    }
                    showToast(`${result.message} Enrollment ID: ${result.enrollment_id}`, 'success');
                } else {
                    showToast(result.message || 'Registration failed.', 'error');
                }
            } catch (err) {
                console.error(err);
                showToast('Failed to connect to authentication server.', 'error');
            }
        });
    }
}

// --- Animated statistics trigger ---
function initStatisticsObserver() {
    const statsSection = document.getElementById('statistics');
    if (!statsSection) return;

    let animated = false;
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !animated) {
                animateStats();
                animated = true;
            }
        });
    }, { threshold: 0.3 });

    observer.observe(statsSection);
}

function animateStats() {
    const elements = document.querySelectorAll('.stat-number');
    elements.forEach(el => {
        const target = parseInt(el.getAttribute('data-target'));
        let current = 0;
        const duration = 1500; // 1.5 seconds animation
        const steps = 60;
        const stepTime = duration / steps;
        const increment = target / steps;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                clearInterval(timer);
                el.textContent = target.toLocaleString() + "+";
            } else {
                el.textContent = Math.floor(current).toLocaleString() + "+";
            }
        }, stepTime);
    });
}

// --- PREMIUM FEATURES LOGIC ---

// 1. Text-To-Speech (Speech Synthesis)
let currentSpeechSynthesis = null;

window.speakBotResponse = function(btnEl, text) {
    if (window.speechSynthesis) {
        // Toggle synthesis if active
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            if (btnEl.classList.contains('active')) {
                btnEl.classList.remove('active');
                btnEl.innerHTML = '<i class="fa-solid fa-volume-high me-1"></i>Listen';
                return;
            }
        }

        // Reset other speaker icons
        document.querySelectorAll('.tts-speak-btn').forEach(btn => {
            btn.classList.remove('active');
            btn.innerHTML = '<i class="fa-solid fa-volume-high me-1"></i>Listen';
        });

        btnEl.classList.add('active');
        btnEl.innerHTML = '<i class="fa-solid fa-stop me-1"></i>Stop';

        const utterance = new SpeechSynthesisUtterance(text);
        
        // Select appropriate locale
        if (userLanguage === 'hi') utterance.lang = 'hi-IN';
        else if (userLanguage === 'gu') utterance.lang = 'gu-IN';
        else utterance.lang = 'en-IN';

        utterance.onend = () => {
            btnEl.classList.remove('active');
            btnEl.innerHTML = '<i class="fa-solid fa-volume-high me-1"></i>Listen';
        };

        utterance.onerror = () => {
            btnEl.classList.remove('active');
            btnEl.innerHTML = '<i class="fa-solid fa-volume-high me-1"></i>Listen';
        };

        window.speechSynthesis.speak(utterance);
    } else {
        showToast('Text-to-Speech not supported in your browser.', 'error');
    }
};

// 2. Speech-To-Text (Speech Recognition)
function initVoiceRecognition() {
    const voiceBtn = document.getElementById('voice-input-btn');
    if (!voiceBtn) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        voiceBtn.style.display = 'none'; // Hide if not supported
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onstart = () => {
        voiceBtn.classList.add('recording-active');
        showToast('Listening... Speak into your mic.', 'success');
    };

    recognition.onerror = (e) => {
        voiceBtn.classList.remove('recording-active');
        console.error('Voice input error:', e.error);
        showToast('Microphone error. Please try again.', 'error');
    };

    recognition.onend = () => {
        voiceBtn.classList.remove('recording-active');
    };

    recognition.onresult = (event) => {
        const resultText = event.results[0][0].transcript;
        if (chatInput) {
            chatInput.value = resultText;
            chatInput.style.height = 'auto';
            chatInput.style.height = (chatInput.scrollHeight) + 'px';
            chatInput.focus();
        }
    };

    voiceBtn.addEventListener('click', () => {
        if (voiceBtn.classList.contains('recording-active')) {
            recognition.stop();
        } else {
            if (userLanguage === 'hi') recognition.lang = 'hi-IN';
            else if (userLanguage === 'gu') recognition.lang = 'gu-IN';
            else recognition.lang = 'en-IN';
            
            recognition.start();
        }
    });
}

// 3. User feedback ratings thumbs toggle
window.rateBotResponse = function(el, type) {
    const parent = el.parentElement;
    parent.querySelectorAll('.feedback-rate-btn').forEach(btn => btn.classList.remove('active'));
    el.classList.add('active');
    showToast(`Thank you for your feedback!`, 'success');
};

// 4. Premium interface features: Language dropdown, PDF export, Chat History
function initPremiumInteractions() {
    // A. Multi-language dropdown binds
    const langDropdownBtn = document.getElementById('languageDropdown');
    const langOptions = document.querySelectorAll('.lang-option');
    if (langDropdownBtn && langOptions) {
        langOptions.forEach(opt => {
            opt.addEventListener('click', (e) => {
                e.preventDefault();
                const lang = opt.getAttribute('data-lang');
                userLanguage = lang;
                langDropdownBtn.innerHTML = `<i class="fa-solid fa-language me-1"></i> ${opt.textContent}`;
                showToast(`Language switched to ${opt.textContent}!`, 'success');
            });
        });
    }

    // B. Chat Log Export as Text/PDF compatible format
    if (exportChatBtn) {
        exportChatBtn.addEventListener('click', () => {
            const bubbles = document.querySelectorAll('.chat-messages .message');
            if (bubbles.length === 0) {
                showToast('No chat history to export.', 'warning');
                return;
            }

            let logText = "========================================\n";
            logText += "PARUL UNIVERSITY - AI STUDENT HELPDESK\n";
            logText += `Date Logged: ${new Date().toLocaleDateString()}\n`;
            logText += "========================================\n\n";

            bubbles.forEach(bubble => {
                const isUser = bubble.classList.contains('user-message');
                const sender = isUser ? "STUDENT" : "AI CONSOLE";
                const time = bubble.querySelector('.message-time')?.textContent || '';
                const txt = bubble.querySelector('.message-text')?.innerText || '';
                logText += `[${time}] ${sender}:\n${txt}\n\n`;
            });

            // Download file
            const blob = new Blob([logText], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `pu-student-chat-${Date.now()}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('Chat history exported successfully!', 'success');
        });
    }

    // C. Search Past conversations sidebar filter
    if (searchHistoryInput) {
        searchHistoryInput.addEventListener('input', () => {
            const val = searchHistoryInput.value.toLowerCase();
            const items = document.querySelectorAll('#history-items .history-item');
            items.forEach(item => {
                const text = item.querySelector('span').textContent.toLowerCase();
                if (text.includes(val)) {
                    item.classList.remove('hidden');
                } else {
                    item.classList.add('hidden');
                }
            });
        });
    }

    // D. Clear history click
    if (btnClearHistory) {
        btnClearHistory.addEventListener('click', () => {
            if (confirm("Delete all locally stored past chats?")) {
                localStorage.removeItem('pu_chat_conversations');
                conversations = {};
                currentConversationId = null;
                renderHistorySidebar();
                startNewChatSession();
                showToast('Local history cleared.', 'success');
            }
        });
    }

    // E. New Chat button bind
    if (newChatBtn) {
        newChatBtn.addEventListener('click', () => {
            startNewChatSession();
        });
    }
}

// 5. Persistent Chat history in LocalStorage
function initChatHistory() {
    try {
        const stored = localStorage.getItem('pu_chat_conversations');
        if (stored) {
            conversations = JSON.parse(stored);
        }
    } catch (e) {
        console.error('Error reading past chats:', e);
    }

    renderHistorySidebar();
    
    // Auto-create initial blank session
    startNewChatSession();
}

function startNewChatSession() {
    currentConversationId = 'conv_' + Date.now();
    conversations[currentConversationId] = {
        title: "New Conversation",
        timestamp: new Date().toLocaleString(),
        messages: []
    };
    
    // Clear viewport and restore welcome dashboard
    const welcomeDashboard = document.getElementById('welcome-dashboard');
    if (welcomeDashboard) {
        welcomeDashboard.classList.remove('hidden');
    }
    
    // Delete old message nodes
    const msgNodes = document.querySelectorAll('.chat-messages .message');
    msgNodes.forEach(node => node.remove());

    renderHistorySidebar();
}

function saveMessageToHistory(text, sender, source = '') {
    if (!currentConversationId || !conversations[currentConversationId]) {
        currentConversationId = 'conv_' + Date.now();
        conversations[currentConversationId] = {
            title: text.slice(0, 30) + (text.length > 30 ? '...' : ''),
            timestamp: new Date().toLocaleString(),
            messages: []
        };
    }

    // Update conversation title if default "New Conversation"
    if (conversations[currentConversationId].title === "New Conversation") {
        conversations[currentConversationId].title = text.slice(0, 30) + (text.length > 30 ? '...' : '');
    }

    conversations[currentConversationId].messages.push({ text, sender, source, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
    
    // Save to localStorage
    localStorage.setItem('pu_chat_conversations', JSON.stringify(conversations));
    renderHistorySidebar();
}

function renderHistorySidebar() {
    if (!historyItemsList) return;
    historyItemsList.innerHTML = '';

    const sortedKeys = Object.keys(conversations).sort((a, b) => b - a);

    if (sortedKeys.length === 0) {
        historyItemsList.innerHTML = `<div class="text-white-50 text-center py-3" style="font-size: 11px;">No active conversations</div>`;
        return;
    }

    sortedKeys.forEach(key => {
        const conv = conversations[key];
        const item = document.createElement('div');
        item.className = `history-item ${key === currentConversationId ? 'active' : ''}`;
        item.innerHTML = `
            <i class="fa-regular fa-message"></i>
            <span>${conv.title}</span>
        `;
        
        item.addEventListener('click', () => {
            loadConversationSession(key);
        });

        historyItemsList.appendChild(item);
    });
}

function loadConversationSession(key) {
    if (!conversations[key]) return;
    
    currentConversationId = key;
    const conv = conversations[key];

    // Hide welcome dashboard if there are messages
    const welcomeDashboard = document.getElementById('welcome-dashboard');
    if (welcomeDashboard) {
        if (conv.messages.length > 0) {
            welcomeDashboard.classList.add('hidden');
        } else {
            welcomeDashboard.classList.remove('hidden');
        }
    }

    // Clear old message elements
    const oldMessages = document.querySelectorAll('.chat-messages .message');
    oldMessages.forEach(m => m.remove());

    // Restore messages
    conv.messages.forEach(m => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${m.sender}-message`;

        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        avatarDiv.innerHTML = m.sender === 'user' ? '<i class="fa-regular fa-user"></i>' : '<i class="fa-solid fa-robot"></i>';
        
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'message-bubble';
        
        const textDiv = document.createElement('div');
        textDiv.className = 'message-text';
        
        if (m.sender === 'bot' && window.marked) {
            textDiv.innerHTML = window.marked.parse(m.text);
        } else {
            const p = document.createElement('p');
            p.textContent = m.text;
            textDiv.appendChild(p);
        }

        bubbleDiv.appendChild(textDiv);

        if (m.sender === 'bot' && m.source) {
            const sourcePill = document.createElement('span');
            sourcePill.className = 'bot-source-pill';
            sourcePill.innerHTML = `<i class="fa-solid fa-microchip"></i> ${m.source}`;
            bubbleDiv.appendChild(sourcePill);
        }

        if (m.sender === 'bot') {
            const actionRow = document.createElement('div');
            actionRow.className = 'd-flex gap-3 mt-2.5 opacity-75 text-muted align-items-center flex-wrap';
            actionRow.style.fontSize = '10px';
            
            const speechStr = m.text.replace(/['"`]/g, '').replace(/[*#]/g, '');

            actionRow.innerHTML = `
                <span style="cursor: pointer;" onclick="navigator.clipboard.writeText(\`${m.text.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`); showToast('Copied to clipboard!', 'success');" title="Copy Response">
                    <i class="fa-regular fa-copy me-1"></i>Copy
                </span>
                <span class="tts-speak-btn" onclick="speakBotResponse(this, \`${speechStr}\`)" title="Listen response">
                    <i class="fa-solid fa-volume-high me-1"></i>Listen
                </span>
                <div class="d-flex gap-2 ms-auto">
                    <span class="feedback-rate-btn" onclick="rateBotResponse(this, 'up')" title="Good response"><i class="fa-regular fa-thumbs-up"></i></span>
                    <span class="feedback-rate-btn" onclick="rateBotResponse(this, 'down')" title="Bad response"><i class="fa-regular fa-thumbs-down"></i></span>
                </div>
            `;
            bubbleDiv.appendChild(actionRow);
        }

        const timeSpan = document.createElement('span');
        timeSpan.className = 'message-time';
        timeSpan.textContent = m.time || '';
        bubbleDiv.appendChild(timeSpan);

        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(bubbleDiv);
        if (chatMessages) chatMessages.appendChild(messageDiv);
    });

    renderHistorySidebar();
    scrollToBottom();
}

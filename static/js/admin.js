// Admin Dashboard JavaScript
let currentLocation = 'BLR';
let adminLoggedIn = false;

// Check if already logged in
checkAdminStatus();

async function checkAdminStatus() {
    try {
        const response = await fetch('/api/admin/check');
        const data = await response.json();
        
        if (data.logged_in) {
            adminLoggedIn = true;
            showDashboard();
            loadParticipants();
            loadQuizStatus();
        }
    } catch (error) {
        console.error('Error checking admin status:', error);
    }
}

// Login Form
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('login-error');
    
    try {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            adminLoggedIn = true;
            showDashboard();
            loadParticipants();
            loadQuizStatus();
        } else {
            errorDiv.textContent = 'Invalid credentials';
        }
    } catch (error) {
        errorDiv.textContent = 'Login failed';
        console.error(error);
    }
});

// Logout
document.getElementById('logout-btn').addEventListener('click', async () => {
    try {
        await fetch('/api/admin/logout', { method: 'POST' });
        adminLoggedIn = false;
        showScreen('login-screen');
    } catch (error) {
        console.error('Logout error:', error);
    }
});

// Screen Management
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function showDashboard() {
    showScreen('dashboard-screen');
}

// Tab Management
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;
        
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(tabName + '-tab').classList.add('active');
        
        // Load data for the tab
        if (tabName === 'participants') {
            loadParticipants();
        } else if (tabName === 'questions') {
            loadQuestions();
        } else if (tabName === 'quiz-control') {
            loadQuizStatus();
        }
    });
});

// Load Participants
async function loadParticipants() {
    const tbody = document.getElementById('participants-tbody');
    const location = document.getElementById('location-filter').value;
    currentLocation = location;
    
    try {
        const response = await fetch(`/api/admin/participants/${location}`);
        const participants = await response.json();
        
        if (participants.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="no-data">No participants yet</td></tr>';
            return;
        }
        
        // Sort by score (desc) then by submitted_at (asc)
        participants.sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            if (a.submitted_at && b.submitted_at) {
                return new Date(a.submitted_at) - new Date(b.submitted_at);
            }
            return 0;
        });
        
        tbody.innerHTML = participants.map((p, index) => {
            const submittedAt = p.submitted_at ? new Date(p.submitted_at).toLocaleString() : 'In Progress';
            const rank = p.submitted_at ? index + 1 : '-';
            
            return `
                <tr>
                    <td>${rank}</td>
                    <td>${p.sso}</td>
                    <td>${p.name}</td>
                    <td>${p.email}</td>
                    <td><strong>${p.score}</strong></td>
                    <td class="hide-mobile">${submittedAt}</td>
                    <td>
                        <button class="btn-delete" onclick="deleteParticipant('${p.sso}')" title="Delete">
                            🗑️
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="7" class="error">Error loading participants</td></tr>';
        console.error(error);
    }
}

// Delete Participant
async function deleteParticipant(sso) {
    if (!confirm(`Are you sure you want to delete participant ${sso}? This action cannot be undone.`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/participants/${currentLocation}/${sso}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Participant deleted successfully');
            loadParticipants();
        } else {
            alert('Error deleting participant: ' + data.message);
        }
    } catch (error) {
        alert('Error deleting participant');
        console.error(error);
    }
}

// Location Filter Change
document.getElementById('location-filter').addEventListener('change', loadParticipants);

// Refresh Participants Button
document.getElementById('refresh-participants-btn').addEventListener('click', () => {
    loadParticipants();
});

document.getElementById('questions-location-filter').addEventListener('change', loadQuestions);

// Refresh Quiz Status Button
document.getElementById('refresh-quiz-status-btn').addEventListener('click', () => {
    loadQuizStatus();
});

// Auto-refresh participants every 5 seconds when on participants tab
setInterval(() => {
    if (adminLoggedIn && document.getElementById('participants-tab').classList.contains('active')) {
        loadParticipants();
    }
}, 5000);

// Load Questions
async function loadQuestions() {
    const location = document.getElementById('questions-location-filter').value;
    const container = document.getElementById('questions-list');
    
    try {
        const response = await fetch(`/api/admin/questions/${location}`);
        const questions = await response.json();
        
        if (questions.length === 0) {
            container.innerHTML = '<p class="no-data">No questions yet. Add some!</p>';
            return;
        }
        
        container.innerHTML = questions.map((q, index) => `
            <div class="question-card">
                <div class="question-header-flex">
                    <span class="question-number">Q${index + 1}</span>
                    <span class="question-points">${q.points} pts</span>
                </div>
                <p class="question-text">${q.question}</p>
                <p class="question-type"><strong>Type:</strong> ${formatQuestionType(q.type)}</p>
                ${q.options ? `<p class="question-options"><strong>Options:</strong> ${q.options.join(', ')}</p>` : ''}
                <div class="question-actions">
                    <button class="btn btn-sm btn-secondary" onclick="editQuestion(${q.id}, '${location}')">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteQuestion(${q.id}, '${location}')">Delete</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        container.innerHTML = '<p class="error">Error loading questions</p>';
        console.error(error);
    }
}

function formatQuestionType(type) {
    const types = {
        'single': 'Single Choice',
        'multiple': 'Multiple Choice',
        'truefalse': 'True/False',
        'text': 'Text Input'
    };
    return types[type] || type;
}

// Question Modal
const questionModal = document.getElementById('question-modal');
const questionForm = document.getElementById('question-form');
const questionTypeSelect = document.getElementById('question-type');
const optionsGroup = document.getElementById('options-group');
const trueFalseGroup = document.getElementById('truefalse-group');
const textAnswerGroup = document.getElementById('text-answer-group');
const optionsList = document.getElementById('options-list');
const pointsHelp = document.getElementById('points-help');

let optionCounter = 0;

document.getElementById('add-question-btn').addEventListener('click', () => {
    document.getElementById('modal-title').textContent = 'Add Question';
    document.getElementById('question-id').value = '';
    questionForm.reset();
    optionsList.innerHTML = '';
    optionCounter = 0;
    updateQuestionTypeFields();
    questionModal.style.display = 'block';
});

document.querySelector('.close').addEventListener('click', closeQuestionModal);

function closeQuestionModal() {
    questionModal.style.display = 'none';
}

// Add Option Button
document.getElementById('add-option-btn').addEventListener('click', () => {
    addOptionField();
});

function addOptionField(value = '', isCorrect = false) {
    const optionId = `option-${optionCounter++}`;
    const questionType = questionTypeSelect.value;
    
    const optionDiv = document.createElement('div');
    optionDiv.className = 'option-item';
    optionDiv.dataset.optionId = optionId;
    
    if (questionType === 'single') {
        optionDiv.innerHTML = `
            <input type="radio" name="correct-option" value="${optionId}" ${isCorrect ? 'checked' : ''}>
            <input type="text" class="option-text" placeholder="Enter option" value="${value}" required>
            <button type="button" class="btn-remove" onclick="removeOption('${optionId}')">✕</button>
        `;
    } else if (questionType === 'multiple') {
        optionDiv.innerHTML = `
            <input type="checkbox" class="correct-option-checkbox" ${isCorrect ? 'checked' : ''}>
            <input type="text" class="option-text" placeholder="Enter option" value="${value}" required>
            <button type="button" class="btn-remove" onclick="removeOption('${optionId}')">✕</button>
        `;
    }
    
    optionsList.appendChild(optionDiv);
}

function removeOption(optionId) {
    const optionDiv = document.querySelector(`[data-option-id="${optionId}"]`);
    if (optionDiv) {
        optionDiv.remove();
    }
}

questionTypeSelect.addEventListener('change', updateQuestionTypeFields);

function updateQuestionTypeFields() {
    const type = questionTypeSelect.value;
    
    // Hide all groups first
    optionsGroup.style.display = 'none';
    trueFalseGroup.style.display = 'none';
    textAnswerGroup.style.display = 'none';
    pointsHelp.style.display = 'none';
    
    // Clear options
    optionsList.innerHTML = '';
    optionCounter = 0;
    
    if (type === 'single') {
        optionsGroup.style.display = 'block';
        document.getElementById('points-label').textContent = 'Points *';
        // Add default 2 options
        addOptionField();
        addOptionField();
    } else if (type === 'multiple') {
        optionsGroup.style.display = 'block';
        document.getElementById('points-label').textContent = 'Points per Correct Option *';
        pointsHelp.style.display = 'block';
        // Add default 2 options
        addOptionField();
        addOptionField();
    } else if (type === 'truefalse') {
        trueFalseGroup.style.display = 'block';
        document.getElementById('points-label').textContent = 'Points *';
    } else if (type === 'text') {
        textAnswerGroup.style.display = 'block';
        document.getElementById('points-label').textContent = 'Points *';
    }
}

// Question Form Submit
questionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const location = document.getElementById('questions-location-filter').value;
    const questionId = document.getElementById('question-id').value;
    const questionText = document.getElementById('question-text').value;
    const type = questionTypeSelect.value;
    const points = parseInt(document.getElementById('question-points').value);
    
    let options = null;
    let correctAnswer = null;
    
    if (type === 'single' || type === 'multiple') {
        // Get all options
        const optionItems = optionsList.querySelectorAll('.option-item');
        options = [];
        const correctAnswers = [];
        
        optionItems.forEach((item, index) => {
            const optionText = item.querySelector('.option-text').value.trim();
            if (optionText) {
                options.push(optionText);
                
                if (type === 'single') {
                    const radio = item.querySelector('input[type="radio"]');
                    if (radio && radio.checked) {
                        correctAnswer = optionText;
                    }
                } else if (type === 'multiple') {
                    const checkbox = item.querySelector('.correct-option-checkbox');
                    if (checkbox && checkbox.checked) {
                        correctAnswers.push(optionText);
                    }
                }
            }
        });
        
        if (options.length < 2) {
            alert('Please provide at least 2 options');
            return;
        }
        
        if (type === 'multiple') {
            if (correctAnswers.length === 0) {
                alert('Please select at least one correct answer');
                return;
            }
            correctAnswer = correctAnswers;
        } else if (type === 'single' && !correctAnswer) {
            alert('Please select the correct answer');
            return;
        }
    } else if (type === 'truefalse') {
        const selectedRadio = document.querySelector('input[name="truefalse-answer"]:checked');
        if (!selectedRadio) {
            alert('Please select True or False');
            return;
        }
        correctAnswer = selectedRadio.value;
    } else if (type === 'text') {
        correctAnswer = document.getElementById('text-correct-answer').value.trim();
        if (!correctAnswer) {
            alert('Please enter the correct answer');
            return;
        }
    }
    
    const questionData = {
        question: questionText,
        type: type,
        options: options,
        correct_answer: correctAnswer,
        points: points
    };
    
    try {
        const url = questionId 
            ? `/api/admin/questions/${location}/${questionId}`
            : `/api/admin/questions/${location}`;
        
        const method = questionId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(questionData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            closeQuestionModal();
            loadQuestions();
        } else {
            alert('Error saving question');
        }
    } catch (error) {
        alert('Error saving question');
        console.error(error);
    }
});

// Edit Question
async function editQuestion(questionId, location) {
    try {
        const response = await fetch(`/api/admin/questions/${location}`);
        const questions = await response.json();
        const question = questions.find(q => q.id === questionId);
        
        if (!question) return;
        
        document.getElementById('modal-title').textContent = 'Edit Question';
        document.getElementById('question-id').value = question.id;
        document.getElementById('question-text').value = question.question;
        document.getElementById('question-type').value = question.type;
        document.getElementById('question-points').value = question.points;
        
        // Clear options list
        optionsList.innerHTML = '';
        optionCounter = 0;
        
        // Call updateQuestionTypeFields but don't add default options for editing
        const type = question.type;
        
        // Hide all groups first
        optionsGroup.style.display = 'none';
        trueFalseGroup.style.display = 'none';
        textAnswerGroup.style.display = 'none';
        pointsHelp.style.display = 'none';
        
        if (type === 'single') {
            optionsGroup.style.display = 'block';
            document.getElementById('points-label').textContent = 'Points *';
            // Add actual options with correct answers marked
            question.options.forEach(option => {
                const isCorrect = (option === question.correct_answer);
                addOptionField(option, isCorrect);
            });
        } else if (type === 'multiple') {
            optionsGroup.style.display = 'block';
            document.getElementById('points-label').textContent = 'Points per Correct Option *';
            pointsHelp.style.display = 'block';
            // Add actual options with correct answers marked
            question.options.forEach(option => {
                const isCorrect = Array.isArray(question.correct_answer) && 
                               question.correct_answer.includes(option);
                addOptionField(option, isCorrect);
            });
        } else if (type === 'truefalse') {
            trueFalseGroup.style.display = 'block';
            document.getElementById('points-label').textContent = 'Points *';
            const radioValue = question.correct_answer;
            const radio = document.querySelector(`input[name="truefalse-answer"][value="${radioValue}"]`);
            if (radio) radio.checked = true;
        } else if (type === 'text') {
            textAnswerGroup.style.display = 'block';
            document.getElementById('points-label').textContent = 'Points *';
            document.getElementById('text-correct-answer').value = question.correct_answer;
        }
        
        questionModal.style.display = 'block';
    } catch (error) {
        alert('Error loading question');
        console.error(error);
    }
}

// Delete Question
async function deleteQuestion(questionId, location) {
    if (!confirm('Are you sure you want to delete this question?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/questions/${location}/${questionId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            loadQuestions();
        } else {
            alert('Error deleting question');
        }
    } catch (error) {
        alert('Error deleting question');
        console.error(error);
    }
}

// Load Quiz Status
async function loadQuizStatus() {
    const container = document.getElementById('quiz-status-controls');
    
    try {
        const response = await fetch('/api/admin/quiz-status');
        const statuses = await response.json();
        
        container.innerHTML = Object.entries(statuses).map(([location, isOpen]) => `
            <div class="quiz-control-item">
                <span class="location-name">${location}</span>
                <label class="toggle-switch">
                    <input type="checkbox" ${isOpen ? 'checked' : ''} 
                           onchange="toggleQuizStatus('${location}', this.checked)">
                    <span class="slider"></span>
                </label>
                <span class="status-label ${isOpen ? 'open' : 'closed'}">${isOpen ? 'OPEN' : 'CLOSED'}</span>
            </div>
        `).join('');
    } catch (error) {
        container.innerHTML = '<p class="error">Error loading quiz status</p>';
        console.error(error);
    }
}

// Toggle Quiz Status
async function toggleQuizStatus(location, isOpen) {
    try {
        const response = await fetch('/api/admin/quiz-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ location, is_open: isOpen })
        });
        
        const data = await response.json();
        
        if (data.success) {
            loadQuizStatus();
        } else {
            alert('Error updating quiz status');
        }
    } catch (error) {
        alert('Error updating quiz status');
        console.error(error);
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target == questionModal) {
        closeQuestionModal();
    }
}

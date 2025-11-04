// Quiz Application - Participant Side
let quizData = {
    sso: '',
    name: '',
    email: '',
    location: '',
    questions: [],
    answers: {},
    currentQuestionIndex: 0
};

// Screen Management
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

// Registration Form
document.getElementById('registration-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const sso = document.getElementById('sso').value.trim();
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const location = document.getElementById('location').value;
    
    const errorDiv = document.getElementById('register-error');
    errorDiv.textContent = '';
    
    // Validate SSO (exactly 9 digits)
    const ssoRegex = /^\d{9}$/;
    if (!ssoRegex.test(sso)) {
        errorDiv.textContent = 'SSO must be exactly 9 digits';
        return;
    }
    
    // Validate email (@gevernova.com)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@gevernova\.com$/;
    if (!emailRegex.test(email)) {
        errorDiv.textContent = 'Email must be a valid GE Vernova email address (@gevernova.com)';
        return;
    }
    
    try {
        // Check quiz status
        const statusRes = await fetch(`/api/quiz-status/${location}`);
        const statusData = await statusRes.json();
        
        if (!statusData.is_open) {
            errorDiv.textContent = 'Quiz is currently closed for this location. Please contact admin.';
            return;
        }
        
        // Register participant
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sso, name, email, location })
        });
        
        const data = await response.json();
        
        if (data.success) {
            quizData.sso = sso;
            quizData.name = name;
            quizData.email = email;
            quizData.location = data.can_resume ? data.location : location;
            
            if (data.can_resume) {
                alert(data.message);
            }
            
            await loadQuiz();
        } else {
            errorDiv.textContent = data.message || 'Registration failed';
        }
    } catch (error) {
        errorDiv.textContent = 'Error connecting to server';
        console.error(error);
    }
});

// Load Quiz Questions
async function loadQuiz() {
    try {
        const response = await fetch(`/api/questions/${quizData.location}?sso=${quizData.sso}`);
        const data = await response.json();
        
        if (data.error) {
            alert(data.error);
            return;
        }
        
        quizData.questions = data.questions;
        quizData.answers = data.existing_answers || {};
        
        renderQuestionNavigation();
        renderQuestion(0);
        setupHamburgerMenu();
        
        document.getElementById('participant-info').textContent = `${quizData.name} (${quizData.location})`;
        
        showScreen('quiz-screen');
    } catch (error) {
        alert('Error loading quiz');
        console.error(error);
    }
}

// Render Question Navigation
function renderQuestionNavigation() {
    const navContainer = document.getElementById('question-nav');
    navContainer.innerHTML = '';
    
    quizData.questions.forEach((question, index) => {
        const btn = document.createElement('button');
        btn.className = 'question-nav-btn';
        btn.textContent = `Q${index + 1}`;
        btn.onclick = () => navigateToQuestion(index);
        
        // Mark answered questions
        if (quizData.answers[question.id]) {
            btn.classList.add('answered');
        }
        
        navContainer.appendChild(btn);
    });
}

// Navigate to Question
function navigateToQuestion(index) {
    saveCurrentAnswer();
    quizData.currentQuestionIndex = index;
    renderQuestion(index);
}

// Render Question
function renderQuestion(index) {
    const question = quizData.questions[index];
    const container = document.getElementById('question-container');
    
    let html = `
        <div class="question-header">
            <span class="question-number">Question ${index + 1} of ${quizData.questions.length}</span>
            <span class="question-points">${question.points} point(s)</span>
        </div>
        <h2 class="question-text">${question.question}</h2>
        <div class="options-container">
    `;
    
    const existingAnswer = quizData.answers[question.id];
    
    switch (question.type) {
        case 'single':
            question.options.forEach((option, optIndex) => {
                const checked = existingAnswer === option ? 'checked' : '';
                html += `
                    <label class="option-label">
                        <input type="radio" name="answer" value="${option}" ${checked}>
                        <span>${option}</span>
                    </label>
                `;
            });
            break;
            
        case 'multiple':
            const maxSelections = question.max_selections || 1;
            html += `<p class="selection-limit-text">Select up to ${maxSelections} option(s)</p>`;
            question.options.forEach((option, optIndex) => {
                const checked = existingAnswer && existingAnswer.includes(option) ? 'checked' : '';
                html += `
                    <label class="option-label">
                        <input type="checkbox" name="answer" value="${option}" ${checked} data-max="${maxSelections}">
                        <span>${option}</span>
                    </label>
                `;
            });
            break;
            
        case 'truefalse':
            const trueChecked = existingAnswer === 'True' ? 'checked' : '';
            const falseChecked = existingAnswer === 'False' ? 'checked' : '';
            html += `
                <label class="option-label">
                    <input type="radio" name="answer" value="True" ${trueChecked}>
                    <span>True</span>
                </label>
                <label class="option-label">
                    <input type="radio" name="answer" value="False" ${falseChecked}>
                    <span>False</span>
                </label>
            `;
            break;
            
        case 'text':
            const textValue = existingAnswer || '';
            html += `
                <textarea name="answer" class="text-answer" placeholder="Type your answer here..." rows="4">${textValue}</textarea>
            `;
            break;
    }
    
    html += `
        </div>
        <div class="question-navigation-buttons">
            ${index > 0 ? '<button class="btn btn-secondary" onclick="navigateToQuestion(' + (index - 1) + ')">Previous</button>' : ''}
            ${index < quizData.questions.length - 1 ? '<button class="btn btn-primary" onclick="navigateToQuestion(' + (index + 1) + ')">Next</button>' : ''}
            ${index === quizData.questions.length - 1 ? '<button class="btn btn-danger" onclick="submitQuiz()" style="margin-left: 10px;">Submit Quiz</button>' : ''}
        </div>
    `;
    
    container.innerHTML = html;
    
    // Add checkbox limit enforcement for multiple choice
    if (question.type === 'multiple') {
        const checkboxes = document.querySelectorAll('input[name="answer"][type="checkbox"]');
        const maxSelections = parseInt(checkboxes[0]?.dataset.max || 1);
        
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const checkedBoxes = document.querySelectorAll('input[name="answer"][type="checkbox"]:checked');
                
                if (checkedBoxes.length > maxSelections) {
                    this.checked = false;
                    alert(`You can only select up to ${maxSelections} option(s) for this question.`);
                }
            });
        });
    }
    
    // Update navigation highlighting
    document.querySelectorAll('.question-nav-btn').forEach((btn, i) => {
        btn.classList.remove('active');
        if (i === index) {
            btn.classList.add('active');
        }
    });
}

// Save Current Answer
async function saveCurrentAnswer() {
    const question = quizData.questions[quizData.currentQuestionIndex];
    let answer = null;
    
    if (question.type === 'multiple') {
        const checkboxes = document.querySelectorAll('input[name="answer"]:checked');
        answer = Array.from(checkboxes).map(cb => cb.value);
    } else if (question.type === 'text') {
        answer = document.querySelector('textarea[name="answer"]').value.trim();
    } else {
        const radio = document.querySelector('input[name="answer"]:checked');
        answer = radio ? radio.value : null;
    }
    
    if (answer !== null && (Array.isArray(answer) ? answer.length > 0 : answer !== '')) {
        quizData.answers[question.id] = answer;
        
        // Save to server
        try {
            await fetch('/api/save-answer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sso: quizData.sso,
                    location: quizData.location,
                    question_id: question.id,
                    answer: answer
                })
            });
        } catch (error) {
            console.error('Error saving answer:', error);
        }
        
        updateQuestionNavigation();
    }
}

// Update Question Navigation
function updateQuestionNavigation() {
    document.querySelectorAll('.question-nav-btn').forEach((btn, index) => {
        const questionId = quizData.questions[index].id;
        if (quizData.answers[questionId]) {
            btn.classList.add('answered');
        } else {
            btn.classList.remove('answered');
        }
    });
}

// Submit Quiz Function (can be called from anywhere)
function submitQuiz() {
    saveCurrentAnswer();
    
    const totalQuestions = quizData.questions.length;
    const answeredCount = Object.keys(quizData.answers).length;
    
    const warningDiv = document.getElementById('unanswered-warning');
    if (answeredCount < totalQuestions) {
        warningDiv.textContent = `You have answered ${answeredCount} out of ${totalQuestions} questions. Unanswered questions will be marked as incorrect.`;
    } else {
        warningDiv.textContent = '';
    }
    
    showScreen('submit-confirm-screen');
}

// Submit Quiz Button in Sidebar
document.getElementById('submit-quiz-btn').addEventListener('click', () => {
    submitQuiz();
});

// Confirm Submit
document.getElementById('confirm-submit-btn').addEventListener('click', async () => {
    try {
        const response = await fetch('/api/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sso: quizData.sso,
                location: quizData.location
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Display score
            document.getElementById('final-score').textContent = data.score;
            
            showScreen('success-screen');
        } else {
            alert('Error submitting quiz: ' + data.message);
        }
    } catch (error) {
        alert('Error submitting quiz');
        console.error(error);
    }
});

// Cancel Submit
document.getElementById('cancel-submit-btn').addEventListener('click', () => {
    showScreen('quiz-screen');
});

// Hamburger Menu
function setupHamburgerMenu() {
    const hamburger = document.getElementById('hamburger-menu');
    const sidebar = document.getElementById('sidebar');
    
    hamburger.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            if (!sidebar.contains(e.target) && !hamburger.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        }
    });
}

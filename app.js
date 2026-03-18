// app.js
document.addEventListener('DOMContentLoaded', () => {
    // ---- DOM Elements ----
    const navLinks = document.querySelectorAll('.nav-links li');
    const tabContents = document.querySelectorAll('.tab-content');
    const pageTitle = document.getElementById('page-title');
    const mainApp = document.getElementById('main-app');
    
    // Auth & Overlays
    const loginScreen = document.getElementById('login-screen');
    const btnLogin = document.getElementById('btn-login');
    const btnLoginGuest = document.getElementById('btn-login-guest');
    const btnLogout = document.getElementById('btn-logout');
    const userDisplayName = document.getElementById('user-display-name');

    // Start Modal
    const startModal = document.getElementById('start-modal');
    const startModalTitle = document.getElementById('start-modal-title');
    const startQuestionCount = document.getElementById('start-question-count');
    const btnCancelStart = document.getElementById('btn-cancel-start');
    const btnConfirmStart = document.getElementById('btn-confirm-start');
    
    // Forms
    const toggleImportBtn = document.getElementById('toggle-import');
    const importPanel = document.getElementById('import-panel');
    const btnAddItem = document.getElementById('btn-add-item');
    const btnProcessImport = document.getElementById('btn-process-import');
    const itemsPreviewList = document.getElementById('items-preview-list');
    const quizForm = document.getElementById('quiz-form');
    
    // Dashboard elements
    const quizGrid = document.getElementById('quiz-grid');
    const totalQuizzesEl = document.getElementById('total-quizzes');
    const totalWordsEl = document.getElementById('total-words');

    // Quiz Player elements
    const activeQuizTitle = document.getElementById('active-quiz-title');
    const currentQNum = document.getElementById('current-q-num');
    const totalQNum = document.getElementById('total-q-num');
    const quizProgressFill = document.getElementById('quiz-progress-fill');
    const questionText = document.getElementById('question-text');
    const optionsGrid = document.getElementById('options-grid');
    const quizResults = document.getElementById('quiz-results');
    const finalScoreEl = document.getElementById('final-score');
    const scoreMessage = document.getElementById('score-message');
    const scoreCorrect = document.getElementById('score-correct');
    const scoreTotal = document.getElementById('score-total');
    const scoreTime = document.getElementById('score-time');
    const btnRestartQuiz = document.getElementById('btn-restart-quiz');
    const btnFinishQuiz = document.getElementById('btn-finish-quiz');
    const btnBackDashboard = document.getElementById('btn-back-dashboard');
    const questionCard = document.querySelector('.question-card');
    const quizTimerText = document.getElementById('quiz-timer-text');

    // ---- State ----
    let newQuizItems = []; 
    let allQuizzes = [];
    
    // Active Quiz State
    let activeQuiz = null;
    let quizQuestionPool = [];
    let currentQuestionIndex = 0;
    let score = 0;
    let timerInterval = null;
    let secondsElapsed = 0;
    let maxQuestions = 0;
    
    // Auth State
    let currentUser = null; // null means not checked, 'guest' means local

    // ---- Utility: Local Storage Fallback ----
    function getLocalQuizzes(userId) {
        const qz = JSON.parse(localStorage.getItem('quizzes') || '[]');
        return qz.filter(q => q.userId === userId);
    }
    function saveLocalQuizzes(quizzes, userId) {
        let allLocalStorage = JSON.parse(localStorage.getItem('quizzes') || '[]');
        allLocalStorage = allLocalStorage.filter(q => q.userId !== userId); // remove old ones for this user
        allLocalStorage.push(...quizzes);
        localStorage.setItem('quizzes', JSON.stringify(allLocalStorage));
    }

    // ---- Default Quizzes ----
    const defaultQuizzes = [
        {
            name: "Japanese Basics", description: "Essential greetings and basic words.",
            items: [{q: "Hello", a: "Konnichiwa"}, {q: "Goodbye", a: "Sayounara"}, {q: "Thank you", a: "Arigatou"}, {q: "Yes", a: "Hai"}, {q: "No", a: "Iie"}]
        },
        {
            name: "Numbers 1-5", description: "Learn how to count in Japanese.",
            items: [{q: "One", a: "Ichi"}, {q: "Two", a: "Ni"}, {q: "Three", a: "San"}, {q: "Four", a: "Yon / Shi"}, {q: "Five", a: "Go"}]
        },
        {
            name: "Colors", description: "Basic colors in Japanese.",
            items: [{q: "Red", a: "Aka"}, {q: "Blue", a: "Ao"}, {q: "Green", a: "Midori"}, {q: "Black", a: "Kuro"}, {q: "White", a: "Shiro"}]
        }
    ];

    async function checkAndAddDefaultQuizzes(userId) {
        if (allQuizzes.length > 0) return; // Already has quizzes
        
        for (let dq of defaultQuizzes) {
            const quizData = { ...dq, userId, createdAt: new Date().toISOString() };
            if (userId !== 'guest' && window.db) {
                await window.db.collection('quizzes').add(quizData);
            } else {
                allQuizzes.push(quizData);
            }
        }
        if(userId === 'guest' || !window.db) saveLocalQuizzes(allQuizzes, userId);
        
        // Reload after adding
        await fetchQuizzes(userId);
    }

    // ---- Auth Logic ----
    if (window.firebase && firebase.auth) {
        firebase.auth().onAuthStateChanged(async (user) => {
            if (user) {
                currentUser = user.uid;
                userDisplayName.textContent = user.displayName || "User";
                loginScreen.classList.add('hidden');
                mainApp.classList.remove('hidden');
                await fetchQuizzes(currentUser);
            } else if (currentUser !== 'guest') {
                loginScreen.classList.remove('hidden');
                mainApp.classList.add('hidden');
            }
        });
    } else {
        // Fallback if not configured
        console.warn("Auth script missing, allowing guest");
    }

    btnLogin.addEventListener('click', () => {
        if (window.firebase && firebase.auth) {
            const provider = new firebase.auth.GoogleAuthProvider();
            firebase.auth().signInWithPopup(provider).catch(console.error);
        } else alert("Firebase Auth not properly connected!");
    });

    btnLoginGuest.addEventListener('click', async () => {
        currentUser = 'guest';
        userDisplayName.textContent = "Guest Mode";
        loginScreen.classList.add('hidden');
        mainApp.classList.remove('hidden');
        await fetchQuizzes(currentUser);
    });

    btnLogout.addEventListener('click', () => {
        if(currentUser === 'guest') {
            currentUser = null;
            loginScreen.classList.remove('hidden');
            mainApp.classList.add('hidden');
        } else if (window.firebase && firebase.auth) {
            firebase.auth().signOut().then(() => {
                currentUser = null;
                loginScreen.classList.remove('hidden');
                mainApp.classList.add('hidden');
            });
        }
    });

    // ---- Data Fetching ----
    async function fetchQuizzes(userId) {
        if (userId !== 'guest' && window.db) {
            try {
                const snapshot = await window.db.collection('quizzes').where('userId', '==', userId).get();
                allQuizzes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                allQuizzes.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)); 
            } catch (error) {
                console.error("Error fetching from Firebase:", error);
                allQuizzes = getLocalQuizzes(userId);
            }
        } else {
            allQuizzes = getLocalQuizzes(userId);
        }
        
        if (allQuizzes.length === 0) {
            await checkAndAddDefaultQuizzes(userId);
        } else {
            renderDashboard();
        }
    }

    function renderDashboard() {
        quizGrid.innerHTML = '';
        let totalWords = 0;
        
        allQuizzes.forEach((quiz, index) => {
            totalWords += quiz.items.length;
            const card = document.createElement('div');
            card.className = 'quiz-item-card glass-card';
            card.innerHTML = `
                <button class="btn-delete-quiz" data-id="${quiz.id || index}" title="Delete Quiz"><i class="fa-solid fa-trash"></i></button>
                <h3>${quiz.name}</h3>
                <p>${quiz.description || 'No description provided.'}</p>
                <div class="quiz-meta">
                    <span><i class="fa-solid fa-list"></i> ${quiz.items.length} items</span>
                    <button class="btn btn-primary" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;" onclick="openStartModal('${quiz.id || index}')">Start</button>
                </div>
            `;
            quizGrid.appendChild(card);
        });

        document.querySelectorAll('.btn-delete-quiz').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                if(confirm("Are you sure you want to delete this quiz?")) deleteQuiz(id);
            });
        });

        totalQuizzesEl.textContent = allQuizzes.length;
        totalWordsEl.textContent = totalWords;
        
        if (allQuizzes.length === 0) {
            quizGrid.innerHTML = '<p style="color: var(--text-muted); grid-column: 1/-1;">No quizzes found. Create one to get started!</p>';
        }
    }

    async function deleteQuiz(quizIdentifier) {
        if(currentUser !== 'guest' && window.db && isNaN(quizIdentifier)) { 
            await window.db.collection('quizzes').doc(quizIdentifier).delete();
        } else {
            allQuizzes = allQuizzes.filter((q, idx) => (q.id !== quizIdentifier && idx.toString() !== quizIdentifier));
            saveLocalQuizzes(allQuizzes, currentUser);
        }
        await fetchQuizzes(currentUser);
    }

    // ---- Tab Navigation ----
    function switchTab(tabId, title) {
        navLinks.forEach(link => link.classList.toggle('active', link.dataset.tab === tabId));
        tabContents.forEach(content => content.classList.toggle('active', content.id === tabId));
        if (title) pageTitle.textContent = title;
    }

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            const tabId = link.dataset.tab;
            let title = tabId === 'dashboard' ? 'Dashboard' : 'Create New Quiz';
            switchTab(tabId, title);
            if(tabId === 'dashboard') fetchQuizzes(currentUser);
        });
    });

    document.getElementById('btn-create-new').addEventListener('click', () => {
        switchTab('create-quiz', 'Create New Quiz');
    });

    // ---- Create Quiz Logic ----
    toggleImportBtn.addEventListener('click', () => importPanel.classList.toggle('hidden'));

    function renderPreviewItems() {
        itemsPreviewList.innerHTML = '';
        if(newQuizItems.length === 0) {
            itemsPreviewList.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">No items added yet.</p>';
            return;
        }

        newQuizItems.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'preview-item';
            div.innerHTML = `
                <div><span class="q-text">${item.q}</span> <i class="fa-solid fa-arrow-right" style="margin: 0 10px; opacity:0.5;"></i> <span>${item.a}</span></div>
                <button type="button" class="action-btn" data-index="${index}"><i class="fa-solid fa-trash"></i></button>
            `;
            itemsPreviewList.appendChild(div);
        });

        document.querySelectorAll('.preview-item .action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                newQuizItems.splice(parseInt(e.currentTarget.dataset.index), 1);
                renderPreviewItems();
            });
        });
    }

    btnAddItem.addEventListener('click', () => {
        const qInput = document.getElementById('item-q');
        const aInput = document.getElementById('item-a');
        if(qInput.value.trim() && aInput.value.trim()) {
            newQuizItems.push({ q: qInput.value.trim(), a: aInput.value.trim() });
            qInput.value = ''; aInput.value = '';
            qInput.focus();
            renderPreviewItems();
        } else alert('Please enter both Prompt and Answer.');
    });

    btnProcessImport.addEventListener('click', () => {
        const text = document.getElementById('bulk-import-text').value;
        if(!text) return;
        
        let count = 0;
        let lines = text.split(/\n+/);

        lines.forEach(line => {
            let parts = line.split(',');
            let currentQ = "";
            let currentA = "";
            
            parts.forEach(part => {
                if (part.includes(':')) {
                    if (currentQ && currentA) {
                        let cleanQ = currentQ.trim().replace(/^\d+[\.\-\)]\s*/, '');
                        newQuizItems.push({ q: cleanQ, a: currentA.trim() });
                        count++;
                    }
                    let subParts = part.split(':');
                    currentQ = subParts[0];
                    currentA = subParts.slice(1).join(':'); 
                } else {
                    if (currentQ) currentA += "," + part;
                }
            });
            if (currentQ && currentA) {
                let cleanQ = currentQ.trim().replace(/^\d+[\.\-\)]\s*/, '');
                newQuizItems.push({ q: cleanQ, a: currentA.trim() });
                count++;
            }
        });
        
        document.getElementById('bulk-import-text').value = '';
        importPanel.classList.add('hidden');
        renderPreviewItems();
        if(count > 0) alert(`Imported ${count} items successfully!`);
    });

    quizForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('quiz-name').value;
        const desc = document.getElementById('quiz-desc').value;
        
        if(newQuizItems.length < 2) {
            alert('Please add at least 2 items to allow multiple choice options.');
            return;
        }

        const quizData = { name, description: desc, items: newQuizItems, userId: currentUser, createdAt: new Date().toISOString() };
        
        const btnSubmit = quizForm.querySelector('button[type="submit"]');
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

        try {
            if(currentUser !== 'guest' && window.db) {
                await window.db.collection('quizzes').add(quizData);
            } else {
                allQuizzes.unshift(quizData);
                saveLocalQuizzes(allQuizzes, currentUser);
            }
            alert('Quiz saved successfully!');
            quizForm.reset();
            newQuizItems = [];
            renderPreviewItems();
            switchTab('dashboard', 'Dashboard');
            fetchQuizzes(currentUser);
        } catch (error) {
            console.error(error);
            alert('Error saving quiz.');
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = '<i class="fa-solid fa-save"></i> Save Quiz';
        }
    });

    // ---- Quiz Playing Logic ----
    function shuffleArray(array) {
        let arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    function formatTime(secs) {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }

    window.openStartModal = (quizIdentifier) => {
        activeQuiz = allQuizzes.find((q, idx) => (q.id === quizIdentifier) || (idx.toString() === quizIdentifier));
        if (!activeQuiz) return;
        
        startModalTitle.textContent = activeQuiz.name;
        
        startQuestionCount.innerHTML = '';
        const len = activeQuiz.items.length;
        
        const opts = [5, 10, 20];
        opts.forEach(val => {
            if(len > val) {
                startQuestionCount.innerHTML += `<option value="${val}">${val} Questions</option>`;
            }
        });
        startQuestionCount.innerHTML += `<option value="${len}">All Questions (${len})</option>`;
        
        startModal.classList.remove('hidden');
    };

    btnCancelStart.addEventListener('click', () => startModal.classList.add('hidden'));

    btnConfirmStart.addEventListener('click', () => {
        startModal.classList.add('hidden');
        maxQuestions = parseInt(startQuestionCount.value);
        
        quizQuestionPool = shuffleArray(activeQuiz.items).slice(0, maxQuestions);
        
        currentQuestionIndex = 0;
        score = 0;
        secondsElapsed = 0;
        
        activeQuizTitle.textContent = activeQuiz.name;
        totalQNum.textContent = maxQuestions;
        quizTimerText.textContent = "00:00";
        
        quizResults.classList.add('hidden');
        questionCard.classList.remove('hidden');
        
        switchTab('take-quiz', 'Taking Quiz');
        
        if(timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            secondsElapsed++;
            quizTimerText.textContent = formatTime(secondsElapsed);
        }, 1000);
        
        loadQuestion();
    });

    function loadQuestion() {
        if (currentQuestionIndex >= maxQuestions) {
            showResults();
            return;
        }

        const currentItem = quizQuestionPool[currentQuestionIndex];
        currentQNum.textContent = currentQuestionIndex + 1;
        quizProgressFill.style.width = `${((currentQuestionIndex) / maxQuestions) * 100}%`;
        
        questionText.textContent = currentItem.q;
        
        const correctAnswers = currentItem.a.split('/').map(s => s.trim());
        const displayedCorrect = correctAnswers[Math.floor(Math.random() * correctAnswers.length)];

        let options = [displayedCorrect];
        let distractors = [];
        activeQuiz.items.forEach(item => {
            if (item.a !== currentItem.a) {
                const itemOptions = item.a.split('/').map(s => s.trim());
                distractors.push(...itemOptions);
            }
        });
        distractors = shuffleArray(distractors);
        
        for(let i=0; i < 3 && i < distractors.length; i++) {
            options.push(distractors[i]);
        }
        
        options = shuffleArray(options);
        
        optionsGrid.innerHTML = '';
        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = opt;
            btn.addEventListener('click', () => handleAnswer(btn, correctAnswers.includes(opt)));
            optionsGrid.appendChild(btn);
        });
    }

    function handleAnswer(btn, isCorrect) {
        const allBtns = optionsGrid.querySelectorAll('.option-btn');
        allBtns.forEach(b => b.disabled = true);
        
        if (isCorrect) {
            btn.classList.add('correct');
            score++;
        } else {
            btn.classList.add('wrong');
            const correctAnswers = quizQuestionPool[currentQuestionIndex].a.split('/').map(s => s.trim());
            allBtns.forEach(b => {
                if(correctAnswers.includes(b.textContent)) b.classList.add('correct');
            });
        }
        
        setTimeout(() => {
            currentQuestionIndex++;
            loadQuestion();
        }, 1500);
    }

    function showResults() {
        clearInterval(timerInterval);
        
        questionCard.classList.add('hidden');
        quizResults.classList.remove('hidden');
        quizProgressFill.style.width = '100%';
        
        const percentage = Math.round((score / maxQuestions) * 100);
        finalScoreEl.textContent = percentage;
        scoreCorrect.textContent = score;
        scoreTotal.textContent = maxQuestions;
        scoreTime.textContent = formatTime(secondsElapsed);
        
        if(percentage === 100) scoreMessage.textContent = "Perfect! Master of memory.";
        else if(percentage >= 70) scoreMessage.textContent = "Great job! Keep practicing.";
        else scoreMessage.textContent = "Good try! Review and try again.";
    }

    btnRestartQuiz.addEventListener('click', () => {
        window.openStartModal(activeQuiz.id || allQuizzes.indexOf(activeQuiz).toString());
    });

    btnBackDashboard.addEventListener('click', () => {
        if(timerInterval) clearInterval(timerInterval);
        switchTab('dashboard', 'Dashboard');
        fetchQuizzes(currentUser);
    });

    btnFinishQuiz.addEventListener('click', () => {
        switchTab('dashboard', 'Dashboard');
        fetchQuizzes(currentUser);
    });

    // Initialize mock preview
    renderPreviewItems();
});

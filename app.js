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
    const startQuizMode = document.getElementById('start-quiz-mode');
    const startQuizDifficulty = document.getElementById('start-quiz-difficulty');
    const difficultyGroup = document.getElementById('difficulty-group');
    const startQuestionCount = document.getElementById('start-question-count');
    const btnCancelStart = document.getElementById('btn-cancel-start');
    const btnConfirmStart = document.getElementById('btn-confirm-start');

    startQuizMode.addEventListener('change', () => {
        if (startQuizMode.value === 'vocabulary') {
            difficultyGroup.classList.remove('hidden');
        } else {
            difficultyGroup.classList.add('hidden');
        }
    });

    const mediaControls = document.getElementById('media-controls');
    const btnPlayAudio = document.getElementById('btn-play-audio');
    const speakingControls = document.getElementById('speaking-controls');
    const btnMic = document.getElementById('btn-mic');
    const micStatus = document.getElementById('mic-status');
    
    // Forms
    const toggleImportBtn = document.getElementById('toggle-import');
    const importPanel = document.getElementById('import-panel');
    const btnAddItem = document.getElementById('btn-add-item');
    const btnProcessImport = document.getElementById('btn-process-import');
    const itemsPreviewList = document.getElementById('items-preview-list');
    const quizForm = document.getElementById('quiz-form');
    
    // JLPT Elements
    const jlptForm = document.getElementById('jlpt-form');
    const jlptPassage = document.getElementById('jlpt-passage');
    const jlptQuestionsList = document.getElementById('jlpt-questions-list');
    const btnAddJlptQ = document.getElementById('btn-add-jlpt-q');
    
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
    let newJlptQuestions = [];
    let allQuizzes = [];
    
    // Active Quiz State
    let activeQuiz = null;
    let quizQuestionPool = [];
    let currentQuestionIndex = 0;
    let score = 0;
    let timerInterval = null;
    let secondsElapsed = 0;
    let maxQuestions = 0;
    let currentQuizMode = 'vocabulary';
    let currentQuizDifficulty = 'easy';
    let recognition = null; 
    let isRecording = false;
    
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
            items: [
                {english: "Hello", romaji: "Konnichiwa", kana: "こんにちは"},
                {english: "Goodbye", romaji: "Sayounara", kana: "さようなら"},
                {english: "Thank you", romaji: "Arigatou", kana: "ありがとう"},
                {english: "Yes", romaji: "Hai", kana: "はい"},
                {english: "No", romaji: "Iie", kana: "いいえ"}
            ]
        },
        {
            name: "Numbers 1-5", description: "Learn how to count in Japanese.",
            items: [
                {english: "One", romaji: "Ichi", kana: "いち"}, 
                {english: "Two", romaji: "Ni", kana: "に"}, 
                {english: "Three", romaji: "San", kana: "さん"}, 
                {english: "Four", romaji: "Yon", kana: "よん"}, 
                {english: "Five", romaji: "Go", kana: "ご"}
            ]
        },
        {
            name: "Colors", description: "Basic colors in Japanese.",
            items: [
                {english: "Red", romaji: "Aka", kana: "あか"}, 
                {english: "Blue", romaji: "Ao", kana: "あお"}, 
                {english: "Green", romaji: "Midori", kana: "みどり"}, 
                {english: "Black", romaji: "Kuro", kana: "くろ"}, 
                {english: "White", romaji: "Shiro", kana: "しろ"}
            ]
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
            const isJlpt = quiz.type === 'jlpt';
            const icon = isJlpt ? '<i class="fa-solid fa-book-open-reader" style="color: var(--primary);"></i> <span style="font-size: 0.8rem; font-weight: 500;">JLPT Reading</span>' : '';
            
            const card = document.createElement('div');
            card.className = 'quiz-item-card glass-card';
            card.innerHTML = `
                <button class="btn-delete-quiz" data-id="${quiz.id || index}" title="Delete Quiz"><i class="fa-solid fa-trash"></i></button>
                <h3>${quiz.name}</h3>
                ${icon ? '<p style="margin-top: -0.5rem; margin-bottom: 0.5rem;">' + icon + '</p>' : ''}
                <p>${quiz.description || (isJlpt ? 'Reading comprehension practice.' : 'No description provided.')}</p>
                <div class="quiz-meta">
                    <span><i class="fa-solid fa-list"></i> ${quiz.items.length} ${isJlpt ? 'questions' : 'items'}</span>
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
            let title = tabId === 'dashboard' ? 'Dashboard' : (tabId === 'create-jlpt' ? 'Create JLPT Quiz' : 'Create New Quiz');
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
                <div>
                   <strong>${item.english}</strong> <i class="fa-solid fa-arrow-right" style="margin: 0 5px; opacity:0.5;"></i> 
                   <em>${item.romaji}</em> <i class="fa-solid fa-arrow-right" style="margin: 0 5px; opacity:0.5;"></i> 
                   <span class="q-text">${item.kana}</span>
                </div>
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
        const engInput = document.getElementById('item-english');
        const romajiInput = document.getElementById('item-romaji');
        const kanaInput = document.getElementById('item-kana');
        
        if(engInput.value.trim() && romajiInput.value.trim() && kanaInput.value.trim()) {
            newQuizItems.push({ english: engInput.value.trim(), romaji: romajiInput.value.trim(), kana: kanaInput.value.trim() });
            engInput.value = ''; romajiInput.value = ''; kanaInput.value = '';
            engInput.focus();
            renderPreviewItems();
        } else alert('Please enter English, Romaji, and Kana forms.');
    });

    btnProcessImport.addEventListener('click', () => {
        const text = document.getElementById('bulk-import-text').value;
        if(!text) return;
        
        let count = 0;
        let lines = text.split(/\n+/);

        lines.forEach(line => {
            let parts = line.split(',').map(s => s.trim());
            if (parts.length >= 3) {
                newQuizItems.push({ english: parts[0], romaji: parts[1], kana: parts[2] });
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

    function renderJlptPreviewItems() {
        if (!jlptQuestionsList) return;
        jlptQuestionsList.innerHTML = '';
        if(newJlptQuestions.length === 0) {
            jlptQuestionsList.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">No questions added yet.</p>';
            return;
        }

        newJlptQuestions.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'preview-item';
            div.innerHTML = `
                <div>
                   <strong>Q: ${item.q}</strong><br>
                   <small class="q-text">A: ${item.ans}</small>
                </div>
                <button type="button" class="action-btn" data-index="${index}"><i class="fa-solid fa-trash"></i></button>
            `;
            jlptQuestionsList.appendChild(div);
        });

        document.querySelectorAll('#jlpt-questions-list .action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                newJlptQuestions.splice(parseInt(e.currentTarget.dataset.index), 1);
                renderJlptPreviewItems();
            });
        });
    }

    if (btnAddJlptQ) {
        btnAddJlptQ.addEventListener('click', () => {
            const q = document.getElementById('jlpt-q-text').value.trim();
            const o1 = document.getElementById('jlpt-opt-1').value.trim();
            const o2 = document.getElementById('jlpt-opt-2').value.trim();
            const o3 = document.getElementById('jlpt-opt-3').value.trim();
            const o4 = document.getElementById('jlpt-opt-4').value.trim();
            if(q && o1 && o2 && o3 && o4) {
                newJlptQuestions.push({ q, ans: o1, options: [o1, o2, o3, o4] });
                document.getElementById('jlpt-q-text').value = '';
                document.getElementById('jlpt-opt-1').value = '';
                document.getElementById('jlpt-opt-2').value = '';
                document.getElementById('jlpt-opt-3').value = '';
                document.getElementById('jlpt-opt-4').value = '';
                document.getElementById('jlpt-q-text').focus();
                renderJlptPreviewItems();
            } else alert('Please fill question and all 4 options.');
        });
    }

    if (jlptForm) {
        jlptForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('jlpt-quiz-name').value;
            const passage = jlptPassage.value;
            
            if(newJlptQuestions.length === 0) {
                alert('Please add at least 1 question.');
                return;
            }

            const quizData = { type: 'jlpt', name, passage, items: newJlptQuestions, userId: currentUser, createdAt: new Date().toISOString() };
            
            const btnSubmit = jlptForm.querySelector('button[type="submit"]');
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

            try {
                if(currentUser !== 'guest' && window.db) {
                    await window.db.collection('quizzes').add(quizData);
                } else {
                    allQuizzes.unshift(quizData);
                    saveLocalQuizzes(allQuizzes, currentUser);
                }
                alert('JLPT Quiz saved successfully!');
                jlptForm.reset();
                newJlptQuestions = [];
                renderJlptPreviewItems();
                switchTab('dashboard', 'Dashboard');
                fetchQuizzes(currentUser);
            } catch (error) {
                console.error(error);
                alert('Error saving JLPT quiz.');
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = '<i class="fa-solid fa-save"></i> Save JLPT Quiz';
            }
        });
    }

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
        
        if (activeQuiz.type === 'jlpt') {
            document.getElementById('jlpt-passage-display').classList.remove('hidden');
            document.getElementById('jlpt-passage-text').textContent = activeQuiz.passage;
            startModal.classList.add('hidden');
            
            maxQuestions = activeQuiz.items.length;
            currentQuizMode = 'jlpt';
            quizQuestionPool = [...activeQuiz.items];
            currentQuestionIndex = 0;
            score = 0;
            secondsElapsed = 0;
            
            activeQuizTitle.textContent = activeQuiz.name;
            totalQNum.textContent = maxQuestions;
            quizTimerText.textContent = "00:00";
            
            quizResults.classList.add('hidden');
            questionCard.classList.remove('hidden');
            
            mediaControls.classList.add('hidden');
            speakingControls.classList.add('hidden');
            optionsGrid.classList.remove('hidden');
            
            switchTab('take-quiz', 'Taking JLPT Quiz');
            
            if(timerInterval) clearInterval(timerInterval);
            timerInterval = setInterval(() => {
                secondsElapsed++;
                quizTimerText.textContent = formatTime(secondsElapsed);
            }, 1000);
            
            loadQuestion();
            return;
        }

        document.getElementById('jlpt-passage-display').classList.add('hidden');
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
        currentQuizMode = startQuizMode.value;
        currentQuizDifficulty = startQuizDifficulty.value;
        
        quizQuestionPool = shuffleArray(activeQuiz.items).slice(0, maxQuestions);
        
        currentQuestionIndex = 0;
        score = 0;
        secondsElapsed = 0;
        
        activeQuizTitle.textContent = activeQuiz.name;
        totalQNum.textContent = maxQuestions;
        quizTimerText.textContent = "00:00";
        
        quizResults.classList.add('hidden');
        questionCard.classList.remove('hidden');
        
        // Setup Media/Speech controls based on mode
        mediaControls.classList.add('hidden');
        speakingControls.classList.add('hidden');
        optionsGrid.classList.remove('hidden');
        btnMic.classList.remove('recording');
        micStatus.textContent = "Tap mic to speak";
        
        if (currentQuizMode === 'speaking') {
            optionsGrid.classList.add('hidden'); // No options for speaking
            speakingControls.classList.remove('hidden');
        } else if (currentQuizMode === 'listening' || currentQuizMode === 'reader') {
            mediaControls.classList.remove('hidden');
        }
        
        switchTab('take-quiz', 'Taking Quiz');
        
        if(timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            secondsElapsed++;
            quizTimerText.textContent = formatTime(secondsElapsed);
        }, 1000);
        
        loadQuestion();
    });

    function getQuestionAnswerMapping(item, mode, difficulty) {
        if (mode === 'vocabulary') {
            if (difficulty === 'easy') return { q: item.english, a: item.romaji };
            if (difficulty === 'medium') {
                const ans = Math.random() > 0.5 ? item.romaji : item.english;
                return { q: item.kana, a: ans };
            }
            if (difficulty === 'hard') return { q: item.kana, a: item.kana };
        } else if (mode === 'speaking') {
            return { q: item.kana, a: item.kana };
        } else if (mode === 'listening') {
            return { q: "Listen to the audio...", a: item.english, audioText: item.kana };
        } else if (mode === 'reader') {
            return { q: item.kana, a: item.english, audioText: item.kana };
        }
        return { q: item.english || item.q, a: item.romaji || item.a };
    }

    function loadQuestion() {
        if (currentQuestionIndex >= maxQuestions) {
            showResults();
            return;
        }

        const currentItem = quizQuestionPool[currentQuestionIndex];
        
        if (currentQuizMode === 'jlpt') {
            currentQNum.textContent = currentQuestionIndex + 1;
            quizProgressFill.style.width = `${((currentQuestionIndex) / maxQuestions) * 100}%`;
            questionText.textContent = currentItem.q;
            
            let options = shuffleArray([...currentItem.options]);
            optionsGrid.innerHTML = '';
            options.forEach(opt => {
                const btn = document.createElement('button');
                btn.className = 'option-btn';
                btn.textContent = opt;
                btn.addEventListener('click', () => handleAnswer(btn, opt === currentItem.ans));
                optionsGrid.appendChild(btn);
            });
            return;
        }

        const mapping = getQuestionAnswerMapping(currentItem, currentQuizMode, currentQuizDifficulty);
        
        currentQNum.textContent = currentQuestionIndex + 1;
        quizProgressFill.style.width = `${((currentQuestionIndex) / maxQuestions) * 100}%`;
        
        questionText.textContent = mapping.q;
        
        // Handlers for Speaking Mode
        if (currentQuizMode === 'speaking') {
            if (isRecording) stopRecording();
            micStatus.textContent = "Tap mic to speak";
            micStatus.style.color = "var(--text-muted)";
            return; // No options to render
        }

        // Auto-play audio for listening mode
        if (currentQuizMode === 'listening' && mapping.audioText) {
            playAudio(mapping.audioText);
        }

        const correctAnswers = mapping.a.split('/').map(s => s.trim());
        const displayedCorrect = correctAnswers[Math.floor(Math.random() * correctAnswers.length)];

        let options = [displayedCorrect];
        let distractors = [];
        activeQuiz.items.forEach(item => {
            const tempMap = getQuestionAnswerMapping(item, currentQuizMode, currentQuizDifficulty);
            if (tempMap.a !== mapping.a && tempMap.a) {
                const itemOptions = tempMap.a.split('/').map(s => s.trim());
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
            if (!opt) return;
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
            if (btn) btn.classList.add('correct');
            score++;
        } else {
            if (btn) btn.classList.add('wrong');
            if (currentQuizMode === 'jlpt') {
                const correctAns = quizQuestionPool[currentQuestionIndex].ans;
                allBtns.forEach(b => {
                    if(b.textContent === correctAns) b.classList.add('correct');
                });
            } else {
                const mapping = getQuestionAnswerMapping(quizQuestionPool[currentQuestionIndex], currentQuizMode, currentQuizDifficulty);
                const correctAnswers = mapping.a.split('/').map(s => s.trim());
                allBtns.forEach(b => {
                    if(correctAnswers.includes(b.textContent)) b.classList.add('correct');
                });
            }
        }
        
        if (currentQuizMode === 'speaking') {
            micStatus.textContent = isCorrect ? "Correct!" : `Incorrect. Expected: ${quizQuestionPool[currentQuestionIndex].kana}`;
            micStatus.style.color = isCorrect ? "var(--secondary)" : "#ff4d4d";
        }
        
        setTimeout(() => {
            currentQuestionIndex++;
            loadQuestion();
        }, 1500);
    }

    // ---- Speech API Logic ----
    function playAudio(text) {
        if (!window.speechSynthesis) return;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ja-JP';
        utterance.rate = 0.9; // Slightly slower for learning
        window.speechSynthesis.speak(utterance);
    }

    btnPlayAudio.addEventListener('click', () => {
        if (currentQuizMode === 'listening' || currentQuizMode === 'reader') {
            const mapping = getQuestionAnswerMapping(quizQuestionPool[currentQuestionIndex], currentQuizMode, currentQuizDifficulty);
            if (mapping.audioText) playAudio(mapping.audioText);
        }
    });

    const btnPlayJlptAudio = document.getElementById('btn-play-jlpt-audio');
    if (btnPlayJlptAudio) {
        btnPlayJlptAudio.addEventListener('click', () => {
            if (activeQuiz && activeQuiz.type === 'jlpt' && activeQuiz.passage) {
                playAudio(activeQuiz.passage);
            }
        });
    }

    function startRecording() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Speech recognition not supported in this browser.");
            return;
        }
        
        recognition = new SpeechRecognition();
        recognition.lang = 'ja-JP';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        
        recognition.onstart = () => {
            isRecording = true;
            btnMic.classList.add('recording');
            btnMic.style.background = "#ff4d4d"; // error color
            micStatus.textContent = "Listening...";
        };
        
        recognition.onspeechend = () => {
            stopRecording();
        };
        
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript.trim();
            const confidence = event.results[0][0].confidence;
            const currentItem = quizQuestionPool[currentQuestionIndex];
            
            // Check if spoken text matches kana or romaji (simple check)
            const expected = currentItem.kana;
            const isCorrect = transcript === expected || transcript.includes(expected) || expected.includes(transcript) || confidence > 0.85;
            
            handleAnswer(null, isCorrect);
        };
        
        recognition.onerror = (event) => {
            console.error("Speech error", event);
            stopRecording();
            micStatus.textContent = "Error listening. Try again.";
        };
        
        recognition.start();
    }
    
    function stopRecording() {
        if (recognition && isRecording) {
            recognition.stop();
            isRecording = false;
            btnMic.classList.remove('recording');
            btnMic.style.background = "var(--secondary)";
            if (micStatus.textContent === "Listening...") micStatus.textContent = "Processing...";
        }
    }

    btnMic.addEventListener('click', () => {
        if (isRecording) stopRecording();
        else startRecording();
    });

    function showResults() {
        clearInterval(timerInterval);
        if (isRecording) stopRecording();
        
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
    if(typeof renderJlptPreviewItems === 'function') renderJlptPreviewItems();
});

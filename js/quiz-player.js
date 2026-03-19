// js/quiz-player.js – Take Quiz: start modal, load questions, handle answers, speech, results

import { state } from './state.js';
import { switchTab } from './navigation.js';
import { fetchQuizzes } from './firebase-data.js';
import { shuffleArray, formatTime, playAudio, getQuestionAnswerMapping } from './utils.js';

// ---- Start Modal ----

export function initStartModal() {
    const startModal         = document.getElementById('start-modal');
    const startModalTitle    = document.getElementById('start-modal-title');
    const startQuizMode      = document.getElementById('start-quiz-mode');
    const startQuizDifficulty= document.getElementById('start-quiz-difficulty');
    const difficultyGroup    = document.getElementById('difficulty-group');
    const startQuestionCount = document.getElementById('start-question-count');
    const btnCancelStart     = document.getElementById('btn-cancel-start');
    const btnConfirmStart    = document.getElementById('btn-confirm-start');

    // Show/hide difficulty selector based on quiz mode
    startQuizMode.addEventListener('change', () => {
        difficultyGroup.classList.toggle('hidden', startQuizMode.value !== 'vocabulary');
    });

    btnCancelStart.addEventListener('click', () => startModal.classList.add('hidden'));

    /** Called from dashboard card's onclick */
    window.openStartModal = (quizIdentifier) => {
        state.activeQuiz = state.allQuizzes.find(
            (q, idx) => q.id === quizIdentifier || idx.toString() === quizIdentifier
        );
        if (!state.activeQuiz) return;

        // JLPT quizzes skip the modal and start directly
        if (state.activeQuiz.type === 'jlpt') {
            _startJlptQuiz();
            return;
        }

        // Populate question-count options
        startModalTitle.textContent = state.activeQuiz.name;
        startQuestionCount.innerHTML = '';
        const len = state.activeQuiz.items.length;
        [5, 10, 20].forEach(val => {
            if (len > val) startQuestionCount.innerHTML += `<option value="${val}">${val} Questions</option>`;
        });
        startQuestionCount.innerHTML += `<option value="${len}">All (${len})</option>`;

        startModal.classList.remove('hidden');
    };

    btnConfirmStart.addEventListener('click', () => {
        startModal.classList.add('hidden');
        state.maxQuestions         = parseInt(startQuestionCount.value);
        state.currentQuizMode      = startQuizMode.value;
        state.currentQuizDifficulty= startQuizDifficulty.value;
        state.quizQuestionPool     = shuffleArray(state.activeQuiz.items).slice(0, state.maxQuestions);
        _startQuizSession();
    });
}

// ---- Internal Helpers ----

function _startJlptQuiz() {
    document.getElementById('jlpt-passage-display').classList.remove('hidden');
    document.getElementById('jlpt-passage-text').textContent = state.activeQuiz.passage;

    state.maxQuestions         = state.activeQuiz.items.length;
    state.currentQuizMode      = 'jlpt';
    state.quizQuestionPool     = [...state.activeQuiz.items];
    _startQuizSession();
}

function _startQuizSession() {
    state.currentQuestionIndex = 0;
    state.score                = 0;
    state.secondsElapsed       = 0;

    document.getElementById('active-quiz-title').textContent = state.activeQuiz.name;
    document.getElementById('total-q-num').textContent       = state.maxQuestions;
    document.getElementById('quiz-timer-text').textContent   = '00:00';

    const questionCard = document.querySelector('.question-card');
    questionCard.classList.remove('hidden');
    document.getElementById('quiz-results').classList.add('hidden');

    const mediaControls   = document.getElementById('media-controls');
    const speakingControls= document.getElementById('speaking-controls');
    const optionsGrid     = document.getElementById('options-grid');
    const btnMic          = document.getElementById('btn-mic');
    const micStatus       = document.getElementById('mic-status');

    mediaControls.classList.add('hidden');
    speakingControls.classList.add('hidden');
    optionsGrid.classList.remove('hidden');
    btnMic.classList.remove('recording');
    micStatus.textContent = 'Tap mic to speak';

    if (state.currentQuizMode === 'speaking') {
        optionsGrid.classList.add('hidden');
        speakingControls.classList.remove('hidden');
    } else if (['listening','reader'].includes(state.currentQuizMode)) {
        mediaControls.classList.remove('hidden');
    }

    switchTab('take-quiz', 'Taking Quiz');

    if (state.timerInterval) clearInterval(state.timerInterval);
    state.timerInterval = setInterval(() => {
        state.secondsElapsed++;
        document.getElementById('quiz-timer-text').textContent = formatTime(state.secondsElapsed);
    }, 1000);

    loadQuestion();
}

// ---- Question Loading ----

function loadQuestion() {
    const questionCard = document.querySelector('.question-card');
    const optionsGrid  = document.getElementById('options-grid');

    if (state.currentQuestionIndex >= state.maxQuestions) {
        showResults();
        return;
    }

    const currentItem = state.quizQuestionPool[state.currentQuestionIndex];
    document.getElementById('current-q-num').textContent     = state.currentQuestionIndex + 1;
    document.getElementById('quiz-progress-fill').style.width =
        `${(state.currentQuestionIndex / state.maxQuestions) * 100}%`;

    // JLPT mode
    if (state.currentQuizMode === 'jlpt') {
        document.getElementById('question-text').textContent = currentItem.q;
        optionsGrid.innerHTML = '';
        shuffleArray([...currentItem.options]).forEach(opt => {
            const btn = document.createElement('button');
            btn.className   = 'option-btn';
            btn.textContent = opt;
            btn.addEventListener('click', () => handleAnswer(btn, opt === currentItem.ans));
            optionsGrid.appendChild(btn);
        });
        return;
    }

    const mapping = getQuestionAnswerMapping(currentItem, state.currentQuizMode, state.currentQuizDifficulty);
    document.getElementById('question-text').textContent = mapping.q;

    // Speaking mode – render mic only
    if (state.currentQuizMode === 'speaking') {
        if (state.isRecording) stopRecording();
        document.getElementById('mic-status').textContent  = 'Tap mic to speak';
        document.getElementById('mic-status').style.color  = 'inherit';
        return;
    }

    // Auto-play audio for listening mode
    if (state.currentQuizMode === 'listening' && mapping.audioText) {
        playAudio(mapping.audioText);
    }

    // Build answer options
    const correctAnswers  = mapping.a.split('/').map(s => s.trim());
    const displayCorrect  = correctAnswers[Math.floor(Math.random() * correctAnswers.length)];

    let distractors = [];
    state.activeQuiz.items.forEach(item => {
        const m = getQuestionAnswerMapping(item, state.currentQuizMode, state.currentQuizDifficulty);
        if (m.a !== mapping.a && m.a) distractors.push(...m.a.split('/').map(s => s.trim()));
    });

    let options = shuffleArray([displayCorrect, ...shuffleArray(distractors).slice(0, 3)]);
    optionsGrid.innerHTML = '';
    options.forEach(opt => {
        if (!opt) return;
        const btn = document.createElement('button');
        btn.className   = 'option-btn';
        btn.textContent = opt;
        btn.addEventListener('click', () => handleAnswer(btn, correctAnswers.includes(opt)));
        optionsGrid.appendChild(btn);
    });
}

function handleAnswer(btn, isCorrect) {
    const allBtns = document.querySelectorAll('#options-grid .option-btn');
    allBtns.forEach(b => { b.disabled = true; });

    if (isCorrect) {
        if (btn) btn.classList.add('correct');
        state.score++;
    } else {
        if (btn) btn.classList.add('wrong');
        // Highlight the correct answer
        if (state.currentQuizMode === 'jlpt') {
            const correctAns = state.quizQuestionPool[state.currentQuestionIndex].ans;
            allBtns.forEach(b => { if (b.textContent === correctAns) b.classList.add('correct'); });
        } else {
            const mapping = getQuestionAnswerMapping(
                state.quizQuestionPool[state.currentQuestionIndex],
                state.currentQuizMode, state.currentQuizDifficulty
            );
            const correct = mapping.a.split('/').map(s => s.trim());
            allBtns.forEach(b => { if (correct.includes(b.textContent)) b.classList.add('correct'); });
        }
    }

    if (state.currentQuizMode === 'speaking') {
        const micStatus = document.getElementById('mic-status');
        micStatus.textContent = isCorrect
            ? 'Correct!'
            : `Incorrect. Expected: ${state.quizQuestionPool[state.currentQuestionIndex].kana}`;
        micStatus.style.color = isCorrect ? 'var(--success)' : 'var(--danger)';
    }

    setTimeout(() => {
        state.currentQuestionIndex++;
        loadQuestion();
    }, 1500);
}

// ---- Speech Recognition ----

function levenshtein(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
            }
        }
    }
    return matrix[b.length][a.length];
}

function matches(transcript, expected) {
    const t = transcript.toLowerCase().trim().replace(/[.,!?;:]/g, "");
    const e = expected.toLowerCase().trim().replace(/[.,!?;:]/g, "");
    if (t === e) return true;
    if (t.includes(e) || e.includes(t)) return true;
    
    // Levenshtein distance check for similarity (allowing ~25% error)
    const distance = levenshtein(t, e);
    const threshold = Math.ceil(e.length * 0.25);
    return distance <= threshold;
}

function startRecording() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('Speech recognition not supported in this browser.'); return; }

    state.recognition                 = new SR();
    state.recognition.lang            = 'ja-JP';
    state.recognition.interimResults  = false;
    state.recognition.maxAlternatives = 1;

    const btnMic    = document.getElementById('btn-mic');
    const micStatus = document.getElementById('mic-status');

    state.recognition.onstart = () => {
        state.isRecording        = true;
        btnMic.classList.add('recording');
        micStatus.textContent    = 'Listening…';
    };
    state.recognition.onspeechend  = () => stopRecording();
    state.recognition.onresult     = (event) => {
        const transcript = event.results[0][0].transcript.trim();
        const expected   = state.quizQuestionPool[state.currentQuestionIndex].kana;
        
        // BUG FIX: Removed confidence > 0.85 which always marked it correct
        const isCorrect = matches(transcript, expected);
        
        handleAnswer(null, isCorrect);
    };
    state.recognition.onerror = (e) => {
        console.error('Speech error', e);
        stopRecording();
        document.getElementById('mic-status').textContent = 'Error listening. Try again.';
    };
    state.recognition.start();
}

function stopRecording() {
    if (state.recognition && state.isRecording) {
        state.recognition.stop();
        state.isRecording = false;
        const btnMic = document.getElementById('btn-mic');
        btnMic.classList.remove('recording');
        const micStatus = document.getElementById('mic-status');
        if (micStatus.textContent === 'Listening…') micStatus.textContent = 'Processing…';
    }
}

// ---- Audio Controls ----

function initAudioControls() {
    const btnPlayAudio = document.getElementById('btn-play-audio');
    if (btnPlayAudio) {
        btnPlayAudio.addEventListener('click', () => {
            const mapping = getQuestionAnswerMapping(
                state.quizQuestionPool[state.currentQuestionIndex],
                state.currentQuizMode, state.currentQuizDifficulty
            );
            if (mapping.audioText) playAudio(mapping.audioText);
        });
    }

    const btnPlayJlptAudio = document.getElementById('btn-play-jlpt-audio');
    if (btnPlayJlptAudio) {
        btnPlayJlptAudio.addEventListener('click', () => {
            if (state.activeQuiz?.passage) playAudio(state.activeQuiz.passage);
        });
    }

    const btnMic = document.getElementById('btn-mic');
    if (btnMic) {
        btnMic.addEventListener('click', () => {
            if (state.isRecording) stopRecording();
            else startRecording();
        });
    }
}

// ---- Results ----

function showResults() {
    clearInterval(state.timerInterval);
    if (state.isRecording) stopRecording();

    document.querySelector('.question-card').classList.add('hidden');
    const quizResults = document.getElementById('quiz-results');
    quizResults.classList.remove('hidden');
    document.getElementById('quiz-progress-fill').style.width = '100%';

    const pct = Math.round((state.score / state.maxQuestions) * 100);
    document.getElementById('final-score').textContent  = pct;
    document.getElementById('score-correct').textContent= state.score;
    document.getElementById('score-total').textContent  = state.maxQuestions;
    document.getElementById('score-time').textContent   = formatTime(state.secondsElapsed);

    const msg = pct === 100
        ? 'Perfect! 🎉 Master of memory.'
        : pct >= 70 ? 'Great job! Keep practising.'
        : 'Good try! Review and try again.';
    document.getElementById('score-message').textContent = msg;
}

function initResultButtons() {
    document.getElementById('btn-restart-quiz')?.addEventListener('click', () => {
        window.openStartModal(
            state.activeQuiz.id || state.allQuizzes.indexOf(state.activeQuiz).toString()
        );
    });
    document.getElementById('btn-finish-quiz')?.addEventListener('click', () => {
        switchTab('dashboard', 'Dashboard');
        fetchQuizzes(state.currentUser);
    });
    document.getElementById('btn-back-dashboard')?.addEventListener('click', () => {
        if (state.timerInterval) clearInterval(state.timerInterval);
        switchTab('dashboard', 'Dashboard');
        fetchQuizzes(state.currentUser);
    });

    document.getElementById('btn-end-quiz')?.addEventListener('click', () => {
        if (confirm('End this quiz session and return to dashboard?')) {
            if (state.timerInterval) clearInterval(state.timerInterval);
            switchTab('dashboard', 'Dashboard');
            fetchQuizzes(state.currentUser);
        }
    });
}


// ---- Public Init ----
export function initQuizPlayer() {
    initStartModal();
    initAudioControls();
    initResultButtons();
}

// js/state.js – Shared application state (single source of truth)
// All modules import from here to read/write shared state.

export const state = {
    // Auth
    currentUser: null,       // Firebase UID, 'guest', or null

    // Quiz data
    allQuizzes: [],

    // New quiz being built in the Create page
    newQuizItems:     [],
    newJlptQuestions: [],

    // Active quiz session
    activeQuiz:           null,
    quizQuestionPool:     [],
    currentQuestionIndex: 0,
    score:                0,
    timerInterval:        null,
    secondsElapsed:       0,
    maxQuestions:         0,
    currentQuizMode:      'vocabulary',  // vocabulary | speaking | listening | jlpt
    currentQuizDifficulty:'easy',        // easy | medium | hard

    // Speech recognition
    recognition:  null,
    isRecording:  false,

    // AI Bot
    aiGather: {
        topic:      null,
        difficulty: null,   // easy | medium | hard
        count:      null,   // number of words
        step:       'topic' // 'topic' | 'difficulty' | 'count' | 'done'
    }
};

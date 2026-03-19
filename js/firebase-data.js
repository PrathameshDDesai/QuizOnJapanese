// js/firebase-data.js – Firestore + localStorage CRUD for quizzes

import { state } from './state.js';
import { getLocalQuizzes, saveLocalQuizzes, DEFAULT_QUIZZES } from './storage.js';
import { renderDashboard } from './dashboard.js';

/** Fetch all quizzes for the current user (Firestore or localStorage) */
export async function fetchQuizzes(userId) {
    if (userId !== 'guest' && window.db) {
        try {
            const snapshot = await window.db
                .collection('quizzes')
                .where('userId', '==', userId)
                .get();
            state.allQuizzes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            state.allQuizzes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } catch (err) {
            console.error('Firestore fetch failed, falling back to localStorage:', err);
            state.allQuizzes = getLocalQuizzes(userId);
        }
    } else {
        state.allQuizzes = getLocalQuizzes(userId);
    }

    if (state.allQuizzes.length === 0) {
        await seedDefaultQuizzes(userId);
    } else {
        renderDashboard();
    }
}

/** Seed 3 built-in quizzes for brand-new users */
async function seedDefaultQuizzes(userId) {
    for (const dq of DEFAULT_QUIZZES) {
        const quizData = { ...dq, userId, createdAt: new Date().toISOString() };
        if (userId !== 'guest' && window.db) {
            await window.db.collection('quizzes').add(quizData);
        } else {
            state.allQuizzes.push(quizData);
        }
    }
    if (userId === 'guest' || !window.db) saveLocalQuizzes(state.allQuizzes, userId);
    await fetchQuizzes(userId);
}

/** Save a new vocabulary quiz */
export async function saveVocabQuiz(quizData) {
    if (state.currentUser !== 'guest' && window.db) {
        await window.db.collection('quizzes').add(quizData);
    } else {
        state.allQuizzes.unshift(quizData);
        saveLocalQuizzes(state.allQuizzes, state.currentUser);
    }
}

/** Save a new JLPT reading quiz */
export async function saveJlptQuiz(quizData) {
    if (state.currentUser !== 'guest' && window.db) {
        await window.db.collection('quizzes').add(quizData);
    } else {
        state.allQuizzes.unshift(quizData);
        saveLocalQuizzes(state.allQuizzes, state.currentUser);
    }
}

/** Delete a quiz by its Firestore document ID or local array index */
export async function deleteQuiz(quizIdentifier) {
    if (state.currentUser !== 'guest' && window.db && isNaN(quizIdentifier)) {
        await window.db.collection('quizzes').doc(quizIdentifier).delete();
    } else {
        state.allQuizzes = state.allQuizzes.filter(
            (q, idx) => q.id !== quizIdentifier && idx.toString() !== quizIdentifier
        );
        saveLocalQuizzes(state.allQuizzes, state.currentUser);
    }
    await fetchQuizzes(state.currentUser);
}

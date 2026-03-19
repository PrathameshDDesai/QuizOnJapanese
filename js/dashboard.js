// js/dashboard.js – Render the quiz grid and stats on the Dashboard tab

import { state } from './state.js';
import { deleteQuiz } from './firebase-data.js';

export function renderDashboard() {
    const quizGrid       = document.getElementById('quiz-grid');
    const totalQuizzesEl = document.getElementById('total-quizzes');
    const totalWordsEl   = document.getElementById('total-words');

    quizGrid.innerHTML = '';
    let totalWords = 0;

    if (state.allQuizzes.length === 0) {
        quizGrid.innerHTML = '<p style="color:var(--text-muted);grid-column:1/-1;">No quizzes yet. Create one to get started!</p>';
        totalQuizzesEl.textContent = '0';
        totalWordsEl.textContent   = '0';
        return;
    }

    state.allQuizzes.forEach((quiz, index) => {
        totalWords += quiz.items ? quiz.items.length : 0;
        const isJlpt = quiz.type === 'jlpt';

        const card = document.createElement('div');
        card.className = 'quiz-item-card';
        card.innerHTML = `
            <div class="card-header-actions">
                <button class="btn-more-options" title="More Options">
                    <span class="material-symbols-rounded">more_vert</span>
                </button>
                <button class="btn-delete-quiz" data-id="${quiz.id || index}" title="Delete Quiz">
                    <span class="material-symbols-rounded">delete</span>
                </button>
            </div>
            <h3>${quiz.name}</h3>
            ${isJlpt
                ? '<p style="margin-top:-0.3rem;margin-bottom:0.4rem;font-size:0.8rem;color:var(--accent)"><span class="material-symbols-rounded" style="font-size:1.1rem;vertical-align:middle;margin-right:4px">menu_book</span> JLPT Reading</p>'
                : ''}
            <p>${quiz.description || (isJlpt ? 'Reading comprehension practice.' : 'No description.')}</p>
            <div class="quiz-meta">
                <span><span class="material-symbols-rounded" style="font-size:1.1rem;vertical-align:middle;margin-right:4px">list</span> ${quiz.items ? quiz.items.length : 0} ${isJlpt ? 'questions' : 'items'}</span>
                <button class="btn btn-primary btn-sm" onclick="window.openStartModal('${quiz.id || index}')" style="padding-right:1rem">
                    Start <span class="material-symbols-rounded" style="font-size:1.1rem">play_arrow</span>
                </button>
            </div>
        `;
        quizGrid.appendChild(card);
    });

    // Wire up delete buttons
    quizGrid.querySelectorAll('.btn-delete-quiz').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.dataset.id;
            if (confirm('Delete this quiz?')) await deleteQuiz(id);
        });
    });

    totalQuizzesEl.textContent = state.allQuizzes.length;
    totalWordsEl.textContent   = totalWords;
}

// js/jlpt-creator.js – Create JLPT Reading Quiz: add questions, save

import { state } from './state.js';
import { saveJlptQuiz } from './firebase-data.js';
import { fetchQuizzes } from './firebase-data.js';
import { switchTab } from './navigation.js';

/** Render the list of JLPT questions that have been added so far */
function renderJlptPreview() {
    const list = document.getElementById('jlpt-questions-list');
    if (!list) return;
    list.innerHTML = '';

    if (state.newJlptQuestions.length === 0) {
        list.innerHTML = '<p style="color:var(--text-muted);font-size:0.88rem;">No questions added yet.</p>';
        return;
    }

    state.newJlptQuestions.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'preview-item';
        div.innerHTML = `
            <div>
                <strong>Q: ${item.q}</strong><br>
                <small class="q-text">✓ ${item.ans}</small>
            </div>
            <button type="button" class="action-btn" data-index="${index}">
                <i class="fa-solid fa-trash"></i>
            </button>
        `;
        list.appendChild(div);
    });

    list.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            state.newJlptQuestions.splice(parseInt(e.currentTarget.dataset.index), 1);
            renderJlptPreview();
        });
    });
}

/** Populates the JLPT form with data from AI assistant */
export function populateJlptFormFromAi(passage, questions, suggestedName) {
    document.getElementById('jlpt-quiz-name').value = suggestedName;
    document.getElementById('jlpt-passage').value   = passage;
    state.newJlptQuestions = [...questions];
    renderJlptPreview();
}

export function initJlptCreator() {
    const btnAddJlptQ = document.getElementById('btn-add-jlpt-q');
    const jlptForm    = document.getElementById('jlpt-form');

    if (btnAddJlptQ) {
        btnAddJlptQ.addEventListener('click', () => {
            const q  = document.getElementById('jlpt-q-text').value.trim();
            const o1 = document.getElementById('jlpt-opt-1').value.trim();
            const o2 = document.getElementById('jlpt-opt-2').value.trim();
            const o3 = document.getElementById('jlpt-opt-3').value.trim();
            const o4 = document.getElementById('jlpt-opt-4').value.trim();

            if (q && o1 && o2 && o3 && o4) {
                state.newJlptQuestions.push({ q, ans: o1, options: [o1, o2, o3, o4] });
                ['jlpt-q-text','jlpt-opt-1','jlpt-opt-2','jlpt-opt-3','jlpt-opt-4']
                    .forEach(id => { document.getElementById(id).value = ''; });
                document.getElementById('jlpt-q-text').focus();
                renderJlptPreview();
            } else {
                alert('Please fill in the question and all 4 options.');
            }
        });
    }

    if (jlptForm) {
        jlptForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (state.newJlptQuestions.length === 0) {
                alert('Add at least 1 question.');
                return;
            }

            const quizData = {
                type:      'jlpt',
                name:      document.getElementById('jlpt-quiz-name').value,
                passage:   document.getElementById('jlpt-passage').value,
                items:     state.newJlptQuestions,
                userId:    state.currentUser,
                createdAt: new Date().toISOString(),
            };

            const submitBtn = jlptForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving…';

            try {
                await saveJlptQuiz(quizData);
                alert('JLPT Quiz saved!');
                jlptForm.reset();
                state.newJlptQuestions = [];
                renderJlptPreview();
                switchTab('dashboard', 'Dashboard');
                fetchQuizzes(state.currentUser);
            } catch (err) {
                console.error(err);
                alert('Error saving JLPT quiz.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Save JLPT Quiz';
            }
        });
    }

    renderJlptPreview();
}

// js/quiz-creator.js – Create Vocabulary Quiz form: add items, bulk import, save

import { state } from './state.js';
import { saveVocabQuiz } from './firebase-data.js';
import { fetchQuizzes } from './firebase-data.js';
import { switchTab } from './navigation.js';

/** Render the preview list of items added so far */
export function renderItemPreview() {
    const list = document.getElementById('items-preview-list');
    if (!list) return;
    list.innerHTML = '';

    if (state.newQuizItems.length === 0) {
        list.innerHTML = '<p style="color:var(--text-muted);font-size:0.88rem;">No items added yet.</p>';
        return;
    }

    state.newQuizItems.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'preview-item';
        div.innerHTML = `
            <div>
                <strong>${item.english}</strong>
                <i class="fa-solid fa-arrow-right" style="margin:0 6px;opacity:.4;font-size:.75rem"></i>
                <em>${item.romaji}</em>
                <i class="fa-solid fa-arrow-right" style="margin:0 6px;opacity:.4;font-size:.75rem"></i>
                <span class="q-text">${item.kana}</span>
            </div>
            <button type="button" class="action-btn" data-index="${index}">
                <i class="fa-solid fa-trash"></i>
            </button>
        `;
        list.appendChild(div);
    });

    list.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            state.newQuizItems.splice(parseInt(e.currentTarget.dataset.index), 1);
            renderItemPreview();
        });
    });
}

/** Populate the form with AI-generated items */
export function populateFormFromAi(items, suggestedName) {
    state.newQuizItems = [...items];
    renderItemPreview();
    const nameInput = document.getElementById('quiz-name');
    if (nameInput && suggestedName) nameInput.value = suggestedName;
}

export function initQuizCreator() {
    const btnAddItem      = document.getElementById('btn-add-item');
    const toggleImportBtn = document.getElementById('toggle-import');
    const importPanel     = document.getElementById('import-panel');
    const btnProcessImport= document.getElementById('btn-process-import');
    const quizForm        = document.getElementById('quiz-form');
    const btnCreateNew    = document.getElementById('btn-create-new');

    if (btnCreateNew) {
        btnCreateNew.addEventListener('click', () => switchTab('create-quiz', 'Create New Quiz'));
    }

    if (toggleImportBtn) {
        toggleImportBtn.addEventListener('click', () => importPanel.classList.toggle('hidden'));
    }

    if (btnAddItem) {
        btnAddItem.addEventListener('click', () => {
            const eng    = document.getElementById('item-english').value.trim();
            const romaji = document.getElementById('item-romaji').value.trim();
            const kana   = document.getElementById('item-kana').value.trim();

            if (eng && romaji && kana) {
                state.newQuizItems.push({ english: eng, romaji, kana });
                document.getElementById('item-english').value = '';
                document.getElementById('item-romaji').value  = '';
                document.getElementById('item-kana').value    = '';
                document.getElementById('item-english').focus();
                renderItemPreview();
            } else {
                alert('Please fill in English, Romaji, and Kana.');
            }
        });
    }

    if (btnProcessImport) {
        btnProcessImport.addEventListener('click', () => {
            const text = document.getElementById('bulk-import-text').value;
            if (!text) return;

            let count = 0;
            const lines = text.split(/\n+/);
            
            lines.forEach(line => {
                // Remove Markdown table decorators if present
                let cleanLine = line.trim();
                if (cleanLine.startsWith('|')) cleanLine = cleanLine.substring(1);
                if (cleanLine.endsWith('|')) cleanLine = cleanLine.slice(0, -1);
                
                // Split by common delimiters: comma, pipe, or tab
                const parts = cleanLine.split(/[,|\t]+/).map(s => s.trim());
                
                // Skip header rows (e.g., "English, Romaji, Kana") or empty rows
                if (parts.length >= 3 && !parts[0].toLowerCase().includes('english')) {
                    state.newQuizItems.push({ 
                        english: parts[0], 
                        romaji:  parts[1], 
                        kana:    parts[2] 
                    });
                    count++;
                }
            });

            document.getElementById('bulk-import-text').value = '';
            importPanel.classList.add('hidden');
            renderItemPreview();
            if (count > 0) alert(`Imported ${count} items.`);
        });
    }

    if (quizForm) {
        quizForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (state.newQuizItems.length < 2) {
                alert('Add at least 2 items for multiple-choice options.');
                return;
            }

            const quizData = {
                name:        document.getElementById('quiz-name').value,
                description: document.getElementById('quiz-desc').value,
                items:       state.newQuizItems,
                userId:      state.currentUser,
                createdAt:   new Date().toISOString(),
            };

            const submitBtn = quizForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving…';

            try {
                await saveVocabQuiz(quizData);
                alert('Quiz saved!');
                quizForm.reset();
                state.newQuizItems = [];
                renderItemPreview();
                switchTab('dashboard', 'Dashboard');
                fetchQuizzes(state.currentUser);
            } catch (err) {
                console.error(err);
                alert('Error saving quiz.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fa-solid fa-save"></i> Save Quiz';
            }
        });
    }

    // Render empty preview on load
    renderItemPreview();
}

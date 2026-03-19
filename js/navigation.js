// js/navigation.js – Tab switching and sidebar nav-link handlers

import { state } from './state.js';
import { fetchQuizzes } from './firebase-data.js';

/** Switch the visible tab and update sidebar highlights */
export function switchTab(tabId, title) {
    document.querySelectorAll('.nav-links li').forEach(li =>
        li.classList.toggle('active', li.dataset.tab === tabId)
    );
    document.querySelectorAll('.tab-content').forEach(section =>
        section.classList.toggle('active', section.id === tabId)
    );
    const pageTitle = document.getElementById('page-title');
    if (title && pageTitle) pageTitle.textContent = title;
}

export function initNavigation() {
    document.querySelectorAll('.nav-links li').forEach(link => {
        link.addEventListener('click', () => {
            const tabId = link.dataset.tab;
            const titleMap = {
                'dashboard':    'Dashboard',
                'create-quiz':  'Create New Quiz',
                'create-jlpt':  'Create JLPT Quiz',
            };
            switchTab(tabId, titleMap[tabId] || tabId);
            if (tabId === 'dashboard') fetchQuizzes(state.currentUser);
        });
    });
}

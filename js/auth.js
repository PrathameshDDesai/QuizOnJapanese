// js/auth.js – Firebase authentication: Google sign-in, guest mode, logout

import { state } from './state.js';
import { fetchQuizzes } from './firebase-data.js';

export function initAuth() {
    const loginScreen     = document.getElementById('login-screen');
    const mainApp         = document.getElementById('main-app');
    const userDisplayName = document.getElementById('user-display-name');
    const btnLogin        = document.getElementById('btn-login');
    const btnLoginGuest   = document.getElementById('btn-login-guest');
    const btnLogout       = document.getElementById('btn-logout');

    function showApp(displayName) {
        userDisplayName.textContent = displayName;
        loginScreen.classList.add('hidden');
        mainApp.classList.remove('hidden');
    }

    function showLogin() {
        loginScreen.classList.remove('hidden');
        mainApp.classList.add('hidden');
    }

    // Listen for Firebase auth state changes
    if (window.firebase && firebase.auth) {
        firebase.auth().onAuthStateChanged(async (user) => {
            if (user) {
                state.currentUser = user.uid;
                showApp(user.displayName || 'User');
                await fetchQuizzes(state.currentUser);
            } else if (state.currentUser !== 'guest') {
                showLogin();
            }
        });
    }

    // Google sign-in
    btnLogin.addEventListener('click', () => {
        if (window.firebase && firebase.auth) {
            const provider = new firebase.auth.GoogleAuthProvider();
            firebase.auth().signInWithPopup(provider).catch(console.error);
        } else {
            alert('Firebase Auth is not configured.');
        }
    });

    // Guest / local-only mode
    btnLoginGuest.addEventListener('click', async () => {
        state.currentUser = 'guest';
        showApp('Guest Mode');
        await fetchQuizzes('guest');
    });

    // Sign out
    btnLogout.addEventListener('click', () => {
        if (state.currentUser === 'guest') {
            state.currentUser = null;
            showLogin();
        } else if (window.firebase && firebase.auth) {
            firebase.auth().signOut().then(() => {
                state.currentUser = null;
                showLogin();
            });
        }
    });
}

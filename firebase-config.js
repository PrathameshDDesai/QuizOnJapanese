// firebase-config.js

const firebaseConfig = {
    apiKey: "AIzaSyB17dAVJEro2S_Y63leGYmaH5nfG5_Zd5s",
    authDomain: "quizonjapanese.firebaseapp.com",
    projectId: "quizonjapanese",
    storageBucket: "quizonjapanese.firebasestorage.app",
    messagingSenderId: "524603504199",
    appId: "1:524603504199:web:06e3c8d84a2c7567cf6362",
    measurementId: "G-0J0G7QRD1M"
};

try {
    // Initialize Firebase
    if(!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    const db = firebase.firestore();
    window.db = db;
    console.log("Firebase initialized successfully with your project 'quizonjapanese'");
} catch (error) {
    console.warn("Firebase config not fully set up. Ensure config values are replaced.", error);
    window.db = null;
}

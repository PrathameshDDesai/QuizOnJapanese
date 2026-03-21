# QuizOnJapanese

A sleek, modern web application for mastering Japanese vocabulary and JLPT reading comprehension. Features a glassmorphism-inspired dark-mode UI, AI-assisted quiz generation, and Firebase cloud sync.

## Features

- **Japanese Vocabulary Quizzes**: Practice English ↔ Romaji ↔ Kana with auto-generated multiple-choice distractors.
- **JLPT Reading Comprehension**: Add Japanese passages and custom comprehension questions for N5–N1 practice.
- **Multiple Quiz Modes**: Vocabulary, Speaking (pronunciation check), and Listening (audio comprehension).
- **Difficulty Levels**: Easy (English → Romaji), Medium (Kana → Romaji/English), Hard (Kana → Kana).
- **AI Assistant**: Generate vocabulary lists or JLPT reading passages using the built-in AI chatbot.
- **Bulk CSV Import**: Import vocabulary in bulk with `English, Romaji, Kana` format (one entry per line).
- **Google Sign-In & Guest Mode**: Sign in with Google for cloud sync, or continue as a guest using `localStorage`.
- **Dark / Light Mode**: Toggle between themes at any time.
- **Firebase Cloud Sync**: Quizzes saved to Firestore and synced across devices when signed in.

## Getting Started

### 1. Firebase Setup (Cloud Saving)
Out of the box, the app works completely offline using your browser's local storage. To sync across devices, connect it to Firebase:
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Create a new project.
3. Build a **Firestore Database** (start in **Test Mode** for development, then secure rules for production).
4. Enable **Google Sign-In** under **Authentication > Sign-in method**.
5. Register a Web App in project settings.
6. Copy the SDK configuration snippet provided.
7. Open `firebase-config.js` and replace the `firebaseConfig` object with your details.

### 2. Local Development
```bash
npm install
npm run dev   # starts nodemon server at http://localhost:3000
```

### 3. Deployment (GitHub Pages)
This app is built with HTML, CSS, and vanilla JS — no build step required.
1. Push the code to a GitHub repository.
2. Go to **Settings > Pages** in your repository.
3. Under **Source**, select `Deploy from a branch`.
4. Select `main` branch and `/root` folder, then click **Save**.
5. Your site will be live in a few minutes.

Enjoy learning Japanese! 🇯🇵

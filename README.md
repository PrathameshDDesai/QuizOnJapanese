# QuizApp - Master Your Memory

A sleek, modern web application designed to help you remember words, learn new languages, or memorize data. 

## Features
- **Modern User Interface**: A dynamic, glassmorphism-inspired dark-mode design.
- **Custom Quizzes**: Name and describe your quizzes easily.
- **ChatGPT Integration**: Bulk import data directly from ChatGPT outputs (comma-separated or colon-separated lists).
- **Multiple Choice Generation**: Automatically creates distractors for a seamless multiple-choice quiz experience.
- **Firebase Ready**: Easily deployable with cloud sync (or perfectly functional locally via `localStorage`).

## Getting Started

### 1. Firebase Setup (Cloud Saving)
Out of the box, the app will work completely offline using your browser's local storage. To sync across devices, connect it to Firebase:
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Create a new Project.
3. Build a **Firestore Database** (Start in **Test Mode** for initial development, then secure rules later).
4. Register a Web App in settings.
5. Copy the SDK configuration snippet provided.
6. Open `firebase-config.js` and replace the `firebaseConfig` object with your details.

### 2. Deployment (GitHub Pages)
This app is built natively in HTML, CSS, and vanilla JS, meaning no build steps are required.
1. Initialize a Git repository in this folder and push the code to a GitHub repository.
2. In your GitHub repository, go to **Settings > Pages**.
3. Under **Source**, select `Deploy from a branch`.
4. Select `main` branch and `/root` folder, then click **Save**.
5. Wait a few minutes, and your site will be live!

Enjoy learning!

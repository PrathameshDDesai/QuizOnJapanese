// js/utils.js – Pure helper functions (no DOM, no state)

/** Fisher-Yates shuffle – returns a new shuffled array */
export function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/** Format seconds as MM:SS */
export function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

/** Speak Japanese text using the browser's SpeechSynthesis API */
export function playAudio(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
}

/** Map a vocabulary item to a question/answer pair based on mode + difficulty */
export function getQuestionAnswerMapping(item, mode, difficulty) {
    if (mode === 'vocabulary') {
        if (difficulty === 'easy')   return { q: item.english, a: item.romaji };
        if (difficulty === 'medium') return { q: item.kana, a: item.romaji };
        if (difficulty === 'hard')   return { q: item.kana, a: item.english };
    }
    if (mode === 'speaking')  return { q: item.kana, a: item.kana };
    if (mode === 'listening') return { q: 'Listen to the audio…', a: item.english, audioText: item.kana };
    if (mode === 'reader')    return { q: item.kana, a: item.english, audioText: item.kana };
    // Fallback (JLPT questions use item.q / item.a directly)
    return { q: item.english || item.q, a: item.romaji || item.a };
}

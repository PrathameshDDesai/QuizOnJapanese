// js/storage.js – localStorage helpers + default quiz seed data

/** Read all quizzes for a userId from localStorage */
export function getLocalQuizzes(userId) {
    const all = JSON.parse(localStorage.getItem('quizzes') || '[]');
    return all.filter(q => q.userId === userId);
}

/** Persist the current user's quizzes to localStorage */
export function saveLocalQuizzes(quizzes, userId) {
    let all = JSON.parse(localStorage.getItem('quizzes') || '[]');
    all = all.filter(q => q.userId !== userId); // remove old data for this user
    all.push(...quizzes);
    localStorage.setItem('quizzes', JSON.stringify(all));
}

/** Pre-built quizzes added when a new user has no data */
export const DEFAULT_QUIZZES = [
    {
        name: 'Japanese Basics',
        description: 'Essential greetings and basic words.',
        items: [
            { english: 'Hello',      romaji: 'Konnichiwa', kana: 'こんにちは' },
            { english: 'Goodbye',    romaji: 'Sayounara',  kana: 'さようなら' },
            { english: 'Thank you',  romaji: 'Arigatou',   kana: 'ありがとう' },
            { english: 'Yes',        romaji: 'Hai',         kana: 'はい' },
            { english: 'No',         romaji: 'Iie',         kana: 'いいえ' },
        ],
    },
    {
        name: 'Numbers 1–5',
        description: 'Learn to count in Japanese.',
        items: [
            { english: 'One',   romaji: 'Ichi', kana: 'いち' },
            { english: 'Two',   romaji: 'Ni',   kana: 'に' },
            { english: 'Three', romaji: 'San',  kana: 'さん' },
            { english: 'Four',  romaji: 'Yon',  kana: 'よん' },
            { english: 'Five',  romaji: 'Go',   kana: 'ご' },
        ],
    },
    {
        name: 'Colors',
        description: 'Basic colors in Japanese.',
        items: [
            { english: 'Red',   romaji: 'Aka',    kana: 'あか' },
            { english: 'Blue',  romaji: 'Ao',     kana: 'あお' },
            { english: 'Green', romaji: 'Midori', kana: 'みどり' },
            { english: 'Black', romaji: 'Kuro',   kana: 'くろ' },
            { english: 'White', romaji: 'Shiro',  kana: 'しろ' },
        ],
    },
];

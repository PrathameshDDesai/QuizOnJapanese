// js/ai-bot.js – AI Assistant panel on the Create Quiz page

import { state } from './state.js';
import { populateFormFromAi } from './quiz-creator.js';
import { populateJlptFormFromAi } from './jlpt-creator.js';

// ---- Seed Data (Fallback) ----
const VOCAB_SEEDS = {
    animals: [
        { english:'Dog',   romaji:'Inu',     kana:'いぬ' },
        { english:'Cat',   romaji:'Neko',    kana:'ねこ' },
        { english:'Bird',  romaji:'Tori',    kana:'とり' },
        { english:'Fish',  romaji:'Sakana',  kana:'さかな' },
        { english:'Horse', romaji:'Uma',     kana:'うま' },
    ],
    food: [
        { english:'Rice',      romaji:'Gohan',     kana:'ごはん' },
        { english:'Bread',     romaji:'Pan',       kana:'パン' },
        { english:'Tea',       romaji:'Ocha',      kana:'おちゃ' },
        { english:'Ramen',     romaji:'Ramen',     kana:'ラーメン' },
        { english:'Sushi',     romaji:'Sushi',     kana:'すし' },
    ],
    // ... more or fuzzy match is enough for mock
};

const JLPT_SEEDS = {
    n5: {
        passage: "はじめまして。わたしは田中です。日本から来ました。どうぞよろしく。",
        questions: [
            { q: "田中さんはどこから来ましたか？", ans: "日本", options: ["日本", "アメリカ", "韓国", "中国"] }
        ]
    },
    n4: {
        passage: "昨日は友達と映画を見に行きました。映画はとてもおもしろかったです。その後、レストランでご飯を食べました。",
        questions: [
            { q: "昨日は何をしましたか？", ans: "映画を見た", options: ["映画を見た", "料理した", "寝た", "勉強した"] }
        ]
    }
};

// ---- Modular AI Assistant Class ----

class AiAssistant {
    constructor(config) {
        this.type           = config.type; // 'vocab' or 'jlpt'
        this.messagesId     = config.messagesId;
        this.inputId        = config.inputId;
        this.sendBtnId      = config.sendBtnId;
        this.generateBtnId  = config.generateBtnId;
        this.gatherState    = { step: config.initialStep, data: {} };
        
        this.init();
    }

    init() {
        const sendBtn   = document.getElementById(this.sendBtnId);
        const input     = document.getElementById(this.inputId);
        const generateBtn = document.getElementById(this.generateBtnId);

        if (!sendBtn) return;

        sendBtn.addEventListener('click', () => this.handleSend());
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') this.handleSend(); });
        
        generateBtn.addEventListener('click', () => this.handleGenerate());

        // Quick Actions (Samples & Paste)
        const sampleBtn = document.getElementById('ai-btn-sample');
        const pasteBtn  = document.getElementById('ai-btn-paste');

        if (sampleBtn && this.type === 'vocab') {
            sampleBtn.addEventListener('click', () => this.handleSample());
        }
        if (pasteBtn && this.type === 'vocab') {
            pasteBtn.addEventListener('click', () => this.handlePaste());
        }

        // Initial Greeting
        setTimeout(() => {
            const msg = this.type === 'vocab' 
                ? "👋 Hi! I'm your Vocab AI. What topic would you like? (e.g. animals, food)\n\nYou can also click 'View Sample' or 'Paste ChatGPT' to add data directly!"
                : "👋 Hello! I'm your JLPT Assistant. What level should we practice? (N5, N4, etc.)";
            this.appendBubble(msg, 'bot');
        }, 500);
    }

    handleSample() {
        const sample = `English,Romaji,Hiragana/Katakana\nnew,atarashii,あたらしい\nold,furui,ふるい\nhot,atsui,あつい`;
        this.appendBubble("Sure! You can paste data directly from ChatGPT like this:", 'bot');
        this.appendBubble(sample, 'bot');
    }


    handlePaste() {
        // Toggle the bulk import panel that's already in the manual form
        const importPanel = document.getElementById('import-panel');
        if (importPanel) {
            importPanel.classList.remove('hidden');
            importPanel.scrollIntoView({ behavior: 'smooth' });
            this.appendBubble("I've opened the Bulk Import panel for you below. Just paste your ChatGPT data there!", 'bot');
        }
    }


    appendBubble(text, sender) {
        const container = document.getElementById(this.messagesId);
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${sender}`;
        bubble.textContent = text;
        container.appendChild(bubble);
        container.scrollTop = container.scrollHeight;
    }

    showTyping() {
        const container = document.getElementById(this.messagesId);
        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator';
        indicator.id = `${this.messagesId}-typing`;
        indicator.innerHTML = '<span></span><span></span><span></span>';
        container.appendChild(indicator);
        container.scrollTop = container.scrollHeight;
    }

    hideTyping() {
        document.getElementById(`${this.messagesId}-typing`)?.remove();
    }

    async handleSend() {
        const input = document.getElementById(this.inputId);
        const text = input.value.trim();
        if (!text) return;

        this.appendBubble(text, 'user');
        input.value = '';

        this.showTyping();
        await new Promise(r => setTimeout(r, 600)); 
        this.hideTyping();

        const reply = this.processInput(text);
        if (reply.message) this.appendBubble(reply.message, 'bot');

        if (reply.ready) {
            const btn = document.getElementById(this.generateBtnId);
            btn.disabled = false;
            this.gatherState.finalData = reply.readyData;
        }
    }

    processInput(text) {
        const input = text.toLowerCase();
        const s = this.gatherState;

        // Detect if input is a vocabulary list (multiple lines + delimiters)
        const lines = text.split('\n').filter(l => l.trim().length > 0);
        if (lines.length >= 2) {
            const detectedItems = [];
            lines.forEach(line => {
                let cleanLine = line.trim();
                if (cleanLine.startsWith('|')) cleanLine = cleanLine.substring(1);
                if (cleanLine.endsWith('|')) cleanLine = cleanLine.slice(0, -1);
                
                const parts = cleanLine.split(/[,|\t]+/).map(p => p.trim());
                if (parts.length >= 3 && !parts[0].toLowerCase().includes('english')) {
                    detectedItems.push({ english: parts[0], romaji: parts[1], kana: parts[2] });
                }
            });

            if (detectedItems.length >= 2) {
                this.gatherState.finalData = detectedItems;
                const btn = document.getElementById(this.generateBtnId);
                btn.disabled = false;
                return { 
                    message: `I've detected ${detectedItems.length} vocabulary items! Click "Generate" below to populate your quiz form immediately.`,
                    ready: true,
                    readyData: detectedItems 
                };
            }
        }

        if (this.type === 'vocab') {
            if (s.step === 'topic') {
                s.data.topic = text;
                s.step = 'difficulty';
                return { message: `Got it! What difficulty? (easy/medium/hard)` };
            }
            if (s.step === 'difficulty') {
                s.data.difficulty = input;
                s.step = 'done';
                const items = VOCAB_SEEDS[s.data.topic.toLowerCase()] || VOCAB_SEEDS.animals;
                return { 
                    message: `Perfect! Click "Generate" to build your ${s.data.topic} quiz.`,
                    ready: true,
                    readyData: items
                };
            }
        } else {
            // JLPT logic
            if (s.step === 'level') {
                const levelMatch = input.match(/n[1-5]/);
                s.data.level = levelMatch ? levelMatch[0] : 'n5';
                s.step = 'done';
                return {
                    message: `Building an ${s.data.level.toUpperCase()} reading passage... Click "Generate" below.`,
                    ready: true,
                    readyData: { level: s.data.level }
                };
            }
        }
        return { message: "I'm ready! You can paste a list of words or tell me a topic." };
    }

    handleGenerate() {
        const data = this.gatherState.finalData;
        if (this.type === 'vocab') {
            // Check if data is already items (from direct paste) or needs seeding
            const items = Array.isArray(data) ? data : (VOCAB_SEEDS[data.topic.toLowerCase()] || VOCAB_SEEDS.animals);
            populateFormFromAi(items, data.topic ? `${data.topic} Quiz` : "My New Quiz");
        } else {
            // JLPT generation
            const seed = JLPT_SEEDS[data.level] || JLPT_SEEDS.n5;
            populateJlptFormFromAi(seed.passage, seed.questions, `${data.level.toUpperCase()} Reading`);
        }
        this.appendBubble("✅ Done! Form filled below. Don't forget to save your quiz!", 'bot');
        document.getElementById(this.generateBtnId).disabled = true;
        this.gatherState.step = this.type === 'vocab' ? 'topic' : 'level'; // Reset for next use
    }

}

// ---- Public Init ----

export function initAiBot() {
    // Initialize Vocab Assistant
    new AiAssistant({
        type: 'vocab',
        messagesId: 'ai-chat-messages',
        inputId: 'ai-chat-input',
        sendBtnId: 'ai-send-btn',
        generateBtnId: 'ai-generate-btn',
        initialStep: 'topic'
    });

    // Initialize JLPT Assistant
    new AiAssistant({
        type: 'jlpt',
        messagesId: 'jlpt-ai-messages',
        inputId: 'jlpt-ai-input',
        sendBtnId: 'jlpt-ai-send',
        generateBtnId: 'jlpt-ai-generate',
        initialStep: 'level'
    });
}

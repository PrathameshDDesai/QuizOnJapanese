import { initTheme }        from './theme.js';
import { initAuth }         from './auth.js';
import { initNavigation }   from './navigation.js';
import { initQuizCreator }  from './quiz-creator.js';
import { initJlptCreator }  from './jlpt-creator.js';
import { initQuizPlayer }   from './quiz-player.js';
import { initAiBot }        from './ai-bot.js';

document.addEventListener('DOMContentLoaded', () => {
    // 0. Theme initialization
    initTheme();

    // 1. Auth – sets up login/logout and triggers first data fetch
    initAuth();

    // 2. Navigation – sidebar tab switching
    initNavigation();

    // 3. Create Quiz form
    initQuizCreator();

    // 4. JLPT Quiz form
    initJlptCreator();

    // 5. Quiz player (start modal, questions, results)
    initQuizPlayer();

    // 6. AI Bot panel (only present on Create Quiz tab)
    initAiBot();

    console.log('✅ QuizApp modules loaded');
});

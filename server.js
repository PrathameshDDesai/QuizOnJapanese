const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve our HTML, CSS, and JS files
app.use(express.static(path.join(__dirname)));

// For any other route, serve index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 QuizApp Server running at http://localhost:${PORT}`);
    console.log('👀 Nodemon is watching for file changes!');
});

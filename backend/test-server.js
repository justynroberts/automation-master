const express = require('express');
require('dotenv').config();

const app = express();

app.use(express.json());

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK' });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`Test server running on http://localhost:${PORT}`);
});
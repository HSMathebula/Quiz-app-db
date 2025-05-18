const express = require('express');
const cors = require('cors');
const db = require('./Database/db.js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Get categories
app.get('/api/categories', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM categories ORDER BY name');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get questions by category
app.get('/api/questions/:categoryId', async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM questions WHERE category_id = $1',
            [req.params.categoryId]
        );
        res.json(result.rows.map(row => ({
            ...row,
            choices: JSON.parse(row.choices)
        })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Save high score
app.post('/api/highscores', async (req, res) => {
    try {
        const { playerName, score, categoryId } = req.body;
        const result = await db.query(
            'INSERT INTO high_scores (player_name, score, category_id) VALUES ($1, $2, $3) RETURNING *',
            [playerName, score, categoryId]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get high scores
app.get('/api/highscores', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT hs.*, c.name as category_name 
            FROM high_scores hs
            JOIN categories c ON hs.category_id = c.id
            ORDER BY hs.score DESC
            LIMIT 10
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 
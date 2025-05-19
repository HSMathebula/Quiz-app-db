const express = require('express');
const cors = require('cors');
const db = require('./Database/db');
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
        console.error('Error in /api/categories:', error);
        res.status(500).json({ error: error.message || String(error) });
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
            choices: row.choices // No JSON.parse, as Postgres returns JSONB as object
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

// Add new category
app.post('/api/categories', async (req, res) => {
    try {
        const { name } = req.body;
        const result = await db.query(
            'INSERT INTO categories (name) VALUES ($1) RETURNING *',
            [name]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add new question
app.post('/api/questions', async (req, res) => {
    try {
        const { categoryId, question, choices, answer } = req.body;
        const result = await db.query(
            'INSERT INTO questions (category_id, question, choices, answer) VALUES ($1, $2, $3, $4) RETURNING *',
            [categoryId, question, JSON.stringify(choices), answer]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete a question
app.delete('/api/questions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM questions WHERE id = $1', [id]);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update a question
app.put('/api/questions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { question, choices, answer } = req.body;
        const result = await db.query(
            'UPDATE questions SET question = $1, choices = $2, answer = $3 WHERE id = $4 RETURNING *',
            [question, JSON.stringify(choices), answer, id]
        );
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

if (process.env.ENABLE_MIGRATION === 'true') {
  app.get('/run-migration', async (req, res) => {
    try {
      await require('./Database/createTables');
      res.send('Migration script executed! Check logs for details.');
    } catch (err) {
      res.status(500).send('Migration failed: ' + err.message);
    }
  });
}

if (process.env.ENABLE_IMPORT === 'true') {
  app.get('/run-import', async (req, res) => {
    try {
      await require('./Database/importQuestions');
      res.send('Import script executed! Check logs for details.');
    } catch (err) {
      res.status(500).send('Import failed: ' + err.message);
    }
  });
}

app.get('/', (req, res) => {
  res.send('Quiz App API is running');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 
const db = require('./db');

const quizDb = {
    // Get all categories
    async getCategories() {
        const result = await db.query('SELECT * FROM categories ORDER BY name');
        return result.rows;
    },

    // Get questions by category
    async getQuestionsByCategory(categoryId) {
        const result = await db.query(
            'SELECT * FROM questions WHERE category_id = $1',
            [categoryId]
        );
        return result.rows.map(row => ({
            ...row,
            choices: JSON.parse(row.choices)
        }));
    },

    // Save high score
    async saveHighScore(playerName, score, categoryId) {
        const result = await db.query(
            'INSERT INTO high_scores (player_name, score, category_id) VALUES ($1, $2, $3) RETURNING *',
            [playerName, score, categoryId]
        );
        return result.rows[0];
    },

    // Get high scores
    async getHighScores(categoryId = null) {
        let query = `
            SELECT hs.*, c.name as category_name 
            FROM high_scores hs
            JOIN categories c ON hs.category_id = c.id
        `;
        const params = [];
        
        if (categoryId) {
            query += ' WHERE hs.category_id = $1';
            params.push(categoryId);
        }
        
        query += ' ORDER BY hs.score DESC LIMIT 10';
        
        const result = await db.query(query, params);
        return result.rows;
    }
};

module.exports = quizDb; 
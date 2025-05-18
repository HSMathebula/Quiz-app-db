const fs = require('fs');
const path = require('path');
const db = require('./db');

async function migrateQuestions() {
    try {
        // Read questions from JSON file
        const questionsData = JSON.parse(
            fs.readFileSync(path.join(__dirname, '..', 'questions.json'), 'utf8')
        );

        // Insert categories first
        const categories = [...new Set(questionsData.map(q => q.category))];
        for (const category of categories) {
            await db.query(
                'INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
                [category]
            );
        }

        // Get category IDs
        const categoryMap = {};
        const categoryResults = await db.query('SELECT id, name FROM categories');
        categoryResults.rows.forEach(row => {
            categoryMap[row.name] = row.id;
        });

        // Insert questions
        for (const question of questionsData) {
            await db.query(
                'INSERT INTO questions (category_id, question, choices, answer) VALUES ($1, $2, $3, $4)',
                [
                    categoryMap[question.category],
                    question.question,
                    JSON.stringify(question.choices),
                    question.answer
                ]
            );
        }

        console.log('Migration completed successfully!');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await db.pool.end();
    }
}

migrateQuestions(); 
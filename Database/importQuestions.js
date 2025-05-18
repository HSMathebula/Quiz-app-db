const fs = require('fs');
const path = require('path');
const db = require('./db');

async function importData() {
  const dataPath = path.join(__dirname, '../questions.json');
  const raw = fs.readFileSync(dataPath, 'utf-8');
  const questions = JSON.parse(raw);

  // 1. Insert unique categories
  const categoryNames = [...new Set(questions.map(q => q.category))];
  const categoryMap = {};
  for (const name of categoryNames) {
    // Insert category if it doesn't exist
    const result = await db.query(
      'INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id',
      [name]
    );
    categoryMap[name] = result.rows[0].id;
  }

  // 2. Insert questions
  for (const q of questions) {
    const categoryId = categoryMap[q.category];
    await db.query(
      'INSERT INTO questions (category_id, question, choices, answer) VALUES ($1, $2, $3, $4)',
      [categoryId, q.question, JSON.stringify(q.choices), q.answer]
    );
  }

  console.log('Import complete!');
  process.exit(0);
}

importData().catch(err => {
  console.error('Error importing data:', err);
  process.exit(1);
}); 
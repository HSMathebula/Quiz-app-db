const db = require('./db');

async function createTables() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE
      );

      CREATE TABLE IF NOT EXISTS questions (
        id SERIAL PRIMARY KEY,
        category_id INTEGER REFERENCES categories(id),
        question TEXT NOT NULL,
        choices JSONB NOT NULL,
        answer VARCHAR(255) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS high_scores (
        id SERIAL PRIMARY KEY,
        player_name VARCHAR(100) NOT NULL,
        score INTEGER NOT NULL,
        category_id INTEGER REFERENCES categories(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Tables created or already exist.');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
}

module.exports = createTables; 
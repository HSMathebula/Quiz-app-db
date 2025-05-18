const { Client } = require('pg');
require('dotenv').config();

async function setupDatabase() {
    // First connect to default postgres database to create our database
    const client = new Client({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: 'postgres', // Connect to default postgres database first
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT || 5432,
    });

    try {
        console.log('Connecting to PostgreSQL...');
        await client.connect();

        // Create database if it doesn't exist
        console.log('Creating database if it doesn\'t exist...');
        await client.query(`CREATE DATABASE ${process.env.DB_NAME}`)
            .catch(err => {
                if (err.code === '42P04') { // Database already exists
                    console.log('Database already exists, continuing...');
                } else {
                    throw err;
                }
            });

        // Close connection to postgres database
        await client.end();

        // Connect to our new database
        const dbClient = new Client({
            user: process.env.DB_USER,
            host: process.env.DB_HOST,
            database: process.env.DB_NAME,
            password: process.env.DB_PASSWORD,
            port: process.env.DB_PORT || 5432,
        });

        await dbClient.connect();

        // Create tables
        console.log('Creating tables...');
        await dbClient.query(`
            -- Create categories table
            CREATE TABLE IF NOT EXISTS categories (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE
            );

            -- Create questions table
            CREATE TABLE IF NOT EXISTS questions (
                id SERIAL PRIMARY KEY,
                category_id INTEGER REFERENCES categories(id),
                question TEXT NOT NULL,
                choices JSONB NOT NULL,
                answer VARCHAR(255) NOT NULL
            );

            -- Create high_scores table
            CREATE TABLE IF NOT EXISTS high_scores (
                id SERIAL PRIMARY KEY,
                player_name VARCHAR(100) NOT NULL,
                score INTEGER NOT NULL,
                category_id INTEGER REFERENCES categories(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log('Database and tables created successfully!');
        await dbClient.end();

    } catch (error) {
        console.error('Error setting up database:', error);
        process.exit(1);
    }
}

// Run the setup
setupDatabase(); 
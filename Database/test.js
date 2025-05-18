const quizDb = require('./quizDb');

async function runTests() {
    try {
        console.log('Starting database tests...\n');

        // Test 1: Get Categories
        console.log('Test 1: Getting all categories');
        const categories = await quizDb.getCategories();
        console.log('Categories:', categories);
        console.log('Test 1 passed!\n');

        // Test 2: Get Questions by Category
        if (categories.length > 0) {
            console.log('Test 2: Getting questions for first category');
            const categoryId = categories[0].id;
            const questions = await quizDb.getQuestionsByCategory(categoryId);
            console.log(`Found ${questions.length} questions for category ${categories[0].name}`);
            console.log('Sample question:', questions[0]);
            console.log('Test 2 passed!\n');
        }

        // Test 3: Save High Score
        console.log('Test 3: Saving high score');
        const highScore = await quizDb.saveHighScore('Test Player', 85, categories[0].id);
        console.log('Saved high score:', highScore);
        console.log('Test 3 passed!\n');

        // Test 4: Get High Scores
        console.log('Test 4: Getting high scores');
        const highScores = await quizDb.getHighScores();
        console.log('High scores:', highScores);
        console.log('Test 4 passed!\n');

        console.log('All tests completed successfully!');
    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        process.exit();
    }
}

runTests(); 
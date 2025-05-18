const { pool } = require("./database-config.js");
const questions = require("../../questions.json")

const testQuestion = {
  "category": "Web Development",
  "question": "What does a 404 HTTP status code mean?",
  "choices": ["Page moved", "Page not found", "Internal server error", "Request successful"],
  "answer": "Page not found"
}

const createQuestionsTable = async (err) => {
  const createTable = `CREATE TABLE IF NOT EXISTS questions(
    question_id SERIAL,
    category VARCHAR(50) NOT NULL,
    question VARCHAR(200) UNIQUE NOT NULL,
    choice_a VARCHAR(200) NOT NULL,
    choice_b VARCHAR(200) NOT NULL,
    choice_c VARCHAR(200) NOT NULL,
    choice_d VARCHAR(200) NOT NULL,
    answer VARCHAR(200) NOT NULL,
    PRIMARY KEY(question_id)
  );`;

  await pool.query(createTable);
  if (err) throw new Error(`Failed to create table: ${err}.`);
  return "Table created.";
}

const addQuestion = async (arrOfQuestions, err) => {

  for (const obj of arrOfQuestions) {
    const addQuestionQuery = `INSERT INTO questions(category, question, choice_a, choice_b, choice_c, choice_d, answer) 
    VALUES ($$${obj.category}$$, $$${obj.question}$$, $$${obj.choices[0]}$$, $$${obj.choices[1]}$$, $$${obj.choices[2]}$$, $$${obj.choices[3]}$$, $$${obj.answer}$$);`;

    await pool.query(addQuestionQuery);
    if (err) throw new Error(`Failed to add entry/entries to database: ${err}.`);
  }

  return "Records added successfully."
}

const fetchQuestions = async (numOfQuestions, err) => {
  const displayQuestionsQuery = `SELECT * FROM questions ORDER BY RANDOM() LIMIT ${numOfQuestions}`;
  console.log(displayQuestionsQuery)
  const questions = await pool.query(displayQuestionsQuery);
  if (err) throw new Error(`Failed to retrieve questions from database: ${err}.`);
  return questions.rows;
}

module.exports = {
  createQuestionsTable,
  addQuestion,
  fetchQuestions
}

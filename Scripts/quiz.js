document.addEventListener('DOMContentLoaded', function() {
  // Get username and category from URL
  const params = new URLSearchParams(window.location.search);
  const username = params.get('username');
  const category = params.get('category');

  // API configuration
  const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'
    : 'https://quiz-app-db-2.onrender.com/api';

  let questions = [];
  let filteredQuestions = [];
  let currentQuestionIndex = 0;
  let score = 0;
  let timer;
  let timeLeft = 15;

  function showQuestion() {
    const currentQuestion = filteredQuestions[currentQuestionIndex];
    document.getElementById('question').textContent = currentQuestion.question;
    document.getElementById('choices').innerHTML = '';
    document.getElementById('progress-bar').style.width = `${((currentQuestionIndex + 1) / filteredQuestions.length) * 100}%`;
    document.getElementById('quiz-timer').textContent = `${timeLeft}s`;

    currentQuestion.choices.forEach(choice => {
      const li = document.createElement('li');
      li.textContent = choice;
      li.addEventListener('click', () => selectAnswer(choice, li));
      document.getElementById('choices').appendChild(li);
    });

    startTimer();
  }

  function selectAnswer(choice, selectedLi) {
    clearInterval(timer);
    const currentQuestion = filteredQuestions[currentQuestionIndex];
    const choicesEl = document.getElementById('choices');

    Array.from(choicesEl.children).forEach(li => {
      li.style.pointerEvents = 'none';
      if (li.textContent === currentQuestion.answer) {
        li.style.backgroundColor = '#4caf50';
        li.style.color = 'white';
      } else if (li === selectedLi && li.textContent !== currentQuestion.answer) {
        li.style.backgroundColor = '#f44336';
        li.style.color = 'white';
      }
    });

    if (choice === currentQuestion.answer) {
      score++;
    }

    setTimeout(() => {
      if (currentQuestionIndex < filteredQuestions.length - 1) {
        currentQuestionIndex++;
        timeLeft = 15;
        showQuestion();
      } else {
        showResults();
      }
    }, 800);
  }

  async function showResults() {
    // Save high score to backend
    const params = new URLSearchParams(window.location.search);
    const username = params.get('username') || 'Anonymous';
    const categoryName = params.get('category') || 'General';
    let categoryId = null;
    try {
      // Fetch categoryId from backend
      const catRes = await fetch(`${API_BASE_URL.replace('/api','')}/api/categories`);
      const categories = await catRes.json();
      const cat = categories.find(c => c.name === categoryName);
      if (cat) categoryId = cat.id;
      if (!categoryId) throw new Error('Category not found');
      // Save high score
      await fetch(`${API_BASE_URL}/highscores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: username, score, categoryId })
      });
    } catch (err) {
      console.error('Failed to save high score:', err);
    }
    document.querySelector('.quiz-question').innerHTML = `
      <h2 class="quiz-complete-title">Quiz Completed!</h2>
      <div class="quiz-score-large">${score} / ${filteredQuestions.length}</div>
      <div class="quiz-encouragement">${score === filteredQuestions.length ? 'Excellent!' : score > 0 ? 'Good job!' : 'Keep practicing!'}</div>
      <button class="btn btn-dark" id="view-high-scores">View High Scores</button>
      <button class="btn btn-light" id="return-home">Return to Home</button>
    `;
    document.getElementById('view-high-scores').onclick = function() {
      window.location.href = 'highscores.html';
    };
    document.getElementById('return-home').onclick = function() {
      window.location.href = 'user.html';
    };
  }

  function startTimer() {
    timeLeft = 15;
    document.getElementById('quiz-timer').textContent = `${timeLeft}s`;
    timer = setInterval(() => {
      timeLeft--;
      document.getElementById('quiz-timer').textContent = `${timeLeft}s`;
      if (timeLeft <= 0) {
        clearInterval(timer);
        selectAnswer(null, null);
      }
    }, 1000);
  }

  function shuffleArray(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
  }

  fetch(`${API_BASE_URL}/questions?category=${encodeURIComponent(category)}`)
    .then(async response => {
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }
      // Try to parse JSON, throw if invalid
      try {
        return await response.json();
      } catch (e) {
        throw new Error('Invalid JSON response');
      }
    })
    .then(data => {
      // Remove duplicate questions by question id or text
      const seen = new Set();
      questions = data.filter(q => {
        if (seen.has(q.question)) return false;
        seen.add(q.question);
        return true;
      }).map(q => ({
        question: q.question,
        choices: Array.isArray(q.choices) ? shuffleArray(q.choices) : [],
        answer: q.answer,
        category: q.category_id
      }));
      
      // Get min and max from localStorage (set by admin)
      const settings = JSON.parse(localStorage.getItem('quizSettings') || '{"min":1,"max":5}');
      const min = settings.min || 1;
      const max = settings.max || 5;
      // Pick a random number between min and max
      const numQuestions = Math.floor(Math.random() * (max - min + 1)) + min;
      filteredQuestions = shuffleArray(questions).slice(0, numQuestions);
      showQuestion();
    })
    .catch(err => {
      document.querySelector('.quiz-question').innerHTML = `<p class="error">Error loading questions: ${err.message}</p>`;
      console.error('Error loading questions:', err);
    });
}); 
document.addEventListener('DOMContentLoaded', function() {
  // Get username and category from URL
  const params = new URLSearchParams(window.location.search);
  const username = params.get('username');
  const category = params.get('category');

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

  function showResults() {
    // Save high score to localStorage
    const params = new URLSearchParams(window.location.search);
    const username = params.get('username') || 'Anonymous';
    const category = params.get('category') || 'General';
    const highScores = JSON.parse(localStorage.getItem('highScores') || '[]');
    highScores.push({ name: username, score, total: filteredQuestions.length, category, date: new Date().toISOString() });
    localStorage.setItem('highScores', JSON.stringify(highScores));

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

  fetch('questions.json')
    .then(response => response.json())
    .then(data => {
      questions = data;
      // Get min and max from localStorage (set by admin)
      const settings = JSON.parse(localStorage.getItem('quizSettings') || '{"min":1,"max":5}');
      const min = settings.min || 1;
      const max = settings.max || 5;
      // Pick a random number between min and max
      const numQuestions = Math.floor(Math.random() * (max - min + 1)) + min;
      filteredQuestions = questions.filter(q => q.category === category);
      filteredQuestions = shuffleArray(filteredQuestions).slice(0, numQuestions);
      showQuestion();
    })
    .catch(err => {
      document.querySelector('.quiz-question').innerHTML = '<p>Error loading questions.</p>';
      console.error('Error loading questions:', err);
    });
}); 
document.addEventListener('DOMContentLoaded', function() {
// const { fetchQuestions } = require("../Database/src/index.js")

let questions = [];
let filteredQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let timer;
let timeLeft = 15;


document.getElementById('start-btn').addEventListener('click', function() {
  const username = document.getElementById('username').value.trim();
  const categoryRadio = document.querySelector('input[name="category"]:checked');
  const category = categoryRadio ? categoryRadio.value : null;

  if (!username) {
    alert('Please enter your name');
    return;
  }
  if (!category) {
    alert('Please select a category');
    return;
  }

  // Redirect to quiz.html with query params
  window.location.href = `quiz.html?username=${encodeURIComponent(username)}&category=${encodeURIComponent(category)}`;
});

function startQuiz() {
  const username = document.getElementById('username').value.trim();
  const categoryRadio = document.querySelector('input[name="category"]:checked');
  const category = categoryRadio ? categoryRadio.value : null;

  if (!username) {
    alert('Please enter your name');
    return;
  }
  if (!category) {
    alert('Please select a category');
    return;
  }

  filteredQuestions = questions.filter(q => q.category === category);
  filteredQuestions = shuffleArray(filteredQuestions);
  currentQuestionIndex = 0;
  score = 0;

  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('quiz-screen').classList.remove('hidden');
  document.getElementById('result-screen').classList.add('hidden');

  showQuestion();
}

function showQuestion() {
  const currentQuestion = filteredQuestions[currentQuestionIndex];
  document.getElementById('question').textContent = currentQuestion.question;
  document.getElementById('choices').innerHTML = '';
  document.getElementById('progress').textContent = `Question ${currentQuestionIndex + 1} of ${filteredQuestions.length}`;
  document.getElementById('progress-bar').style.width = `${((currentQuestionIndex + 1) / filteredQuestions.length) * 100}%`;

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

  const iconSpan = document.createElement('span');
  iconSpan.style.marginLeft = '10px';
  iconSpan.style.fontWeight = 'bold';

  if (li.textContent === currentQuestion.answer) {
    
    iconSpan.textContent = '✔️';
  } else if (li === selectedLi && li.textContent !== currentQuestion.answer) {
    
    iconSpan.textContent = '❌';
  }

  if (iconSpan.textContent) {
    li.appendChild(iconSpan);
  }
});


  if (choice === currentQuestion.answer) {
    score++;
  }

  if (currentQuestionIndex < filteredQuestions.length - 1) {
    currentQuestionIndex++;
    showQuestion();
  } else {
    showResults();
  }
}

function showResults() {
  document.getElementById('quiz-screen').classList.add('hidden');
  document.getElementById('result-screen').classList.remove('hidden');
  document.getElementById('score').textContent = `Score: ${score} out of ${filteredQuestions.length}`;
}

function startTimer() {
  timeLeft = 15;
  document.getElementById('timer').textContent = `Time left: ${timeLeft}s`;
  const timerBar = document.getElementById('timer-bar');
  timerBar.style.width = '100%';

  timer = setInterval(() => {
    timeLeft--;
    document.getElementById('timer').textContent = `Time left: ${timeLeft}s`;
    timerBar.style.width = `${(timeLeft / 15) * 100}%`;

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

const categoryList = document.getElementById('category-list');

// Add loading state
categoryList.innerHTML = '<p class="loading">Loading categories...</p>';

// API configuration
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000/api'
  : 'https://quiz-app-db-2.onrender.com/api';

// Function to handle errors
function handleError(error, message) {
  console.error('Error:', error);
  const errorMessage = error.message.includes('Failed to fetch') 
    ? 'Cannot connect to the server. Please make sure you are accessing the page through http://localhost:3000'
    : message;
  
  categoryList.innerHTML = `
    <div class="error-container">
      <p class="error">${errorMessage}</p>
      <button onclick="window.location.href='http://localhost:3000'" class="retry-btn">Go to Development Server</button>
    </div>
  `;
}

// Fetch categories with retry logic
async function fetchCategories(retries = 3) {
  try {
    console.log('Fetching categories from:', `${API_BASE_URL}/categories`);
    const response = await fetch(`${API_BASE_URL}/categories`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const categories = await response.json();
    
    if (!Array.isArray(categories) || categories.length === 0) {
      throw new Error('No categories found');
    }

    categoryList.innerHTML = '';
    categories.forEach(cat => {
      const label = document.createElement('label');
      label.className = 'category-option';
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'category';
      input.value = cat.name;
      label.appendChild(input);
      label.appendChild(document.createTextNode(' ' + cat.name));
      categoryList.appendChild(label);
    });
  } catch (error) {
    console.error('Fetch error:', error);
    if (retries > 0) {
      console.log(`Retrying... ${retries} attempts left`);
      setTimeout(() => fetchCategories(retries - 1), 1000);
    } else {
      handleError(error, 'Failed to load categories. Please check your connection and try again.');
    }
  }
}

// Start fetching categories
fetchCategories();
});
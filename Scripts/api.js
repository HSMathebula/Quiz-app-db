// API URL configuration
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api'
    : 'https://Quiz-app-db.onrender.com/api';

// Get categories
async function getCategories() {
    const response = await fetch(`${API_URL}/categories`);
    return response.json();
}

// Get questions by category
async function getQuestionsByCategory(categoryId) {
    const response = await fetch(`${API_URL}/questions/${categoryId}`);
    return response.json();
}

// Save high score
async function saveHighScore(playerName, score, categoryId) {
    const response = await fetch(`${API_URL}/highscores`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ playerName, score, categoryId })
    });
    return response.json();
}

// Get high scores
async function getHighScores() {
    const response = await fetch(`${API_URL}/highscores`);
    return response.json();
}

// User registration
async function register(username, email, password) {
    const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password })
    });
    return response.json();
}

// User login
async function login(email, password) {
    const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
}

// Logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
}

// Check if user is logged in
function isLoggedIn() {
    return !!localStorage.getItem('token');
}

// Get current user
function getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
} 
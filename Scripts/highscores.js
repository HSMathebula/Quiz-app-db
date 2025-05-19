document.addEventListener('DOMContentLoaded', async function() {
  const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'
    : 'https://quiz-app-backend-2.onrender.com/api';
  const list = document.getElementById('highscore-list');
  try {
    const response = await fetch(`${API_BASE_URL}/highscores`);
    if (!response.ok) throw new Error('Failed to fetch high scores');
    const highScores = await response.json();
    if (!Array.isArray(highScores) || highScores.length === 0) {
      list.innerHTML = '<li>No high scores yet.</li>';
    } else {
      highScores.forEach(entry => {
        const li = document.createElement('li');
        li.className = 'highscore-entry';
        li.innerHTML = `<strong>${entry.player_name}</strong> &mdash; ${entry.score} <span class="highscore-category">(${entry.category_name})</span> <span class="highscore-date">${new Date(entry.created_at).toLocaleDateString()}</span>`;
        list.appendChild(li);
      });
    }
  } catch (err) {
    list.innerHTML = `<li class="error">Failed to load high scores: ${err.message}</li>`;
    console.error('Error loading high scores:', err);
  }
  document.getElementById('return-home').onclick = function() {
    window.location.href = 'user.html';
  };
}); 
document.addEventListener('DOMContentLoaded', function() {
  const highScores = JSON.parse(localStorage.getItem('highScores') || '[]');
  // Sort by score descending, then by date
  highScores.sort((a, b) => b.score - a.score || new Date(b.date) - new Date(a.date));
  const list = document.getElementById('highscore-list');
  if (highScores.length === 0) {
    list.innerHTML = '<li>No high scores yet.</li>';
  } else {
    highScores.slice(0, 10).forEach(entry => {
      const li = document.createElement('li');
      li.className = 'highscore-entry';
      li.innerHTML = `<strong>${entry.name}</strong> &mdash; ${entry.score} / ${entry.total} <span class="highscore-category">(${entry.category})</span> <span class="highscore-date">${new Date(entry.date).toLocaleDateString()}</span>`;
      list.appendChild(li);
    });
  }
  document.getElementById('return-home').onclick = function() {
    window.location.href = 'user.html';
  };
}); 
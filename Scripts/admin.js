document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("question-form");
  const categorySelect = document.getElementById("category");
  const questionList = document.getElementById("question-list");
  const settingsForm = document.getElementById("settings-form");

  const minInput = document.getElementById("min-questions");
  const maxInput = document.getElementById("max-questions");

  const escapeHTML = (str) =>
    str.replace(/</g, "&lt;").replace(/>/g, "&gt;");

  let questions = [];
  let newCatInput; // define at the top so it's always available

  const loadQuestions = () => {
    const stored = localStorage.getItem("questions");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        console.warn("Invalid JSON in localStorage, resetting.");
        localStorage.removeItem("questions");
        return [];
      }
    }
    return [];
  };

  const saveQuestions = (questions) => {
    localStorage.setItem("questions", JSON.stringify(questions));
  };

  const renderQuestions = (questions) => {
    questionList.innerHTML = "";

    if (questions.length === 0) {
      questionList.innerHTML = `
        <div class="no-questions">
          <p>No questions available.</p>
        </div>
      `;
      return;
    }

    questions.forEach((q, idx) => {
      const card = document.createElement("div");
      card.classList.add("question-card");

      card.innerHTML = `
        <div class="question-header">
          <h4>${idx + 1}. ${escapeHTML(q.question)}</h4>
          <span class="category-badge">${escapeHTML(q.category)}</span>
        </div>
        
        <ul class="options-list">
          ${q.choices
          .map(
            (choice, choiceIdx) =>
              `<li class="option-item ${choice === q.answer ? "correct-answer" : ""}">
                  <span class="option-letter">${String.fromCharCode(65 + choiceIdx)}.</span>
                  ${escapeHTML(choice)}
                </li>`
          )
          .join("")}
        </ul>
        
        <div class="question-actions">
          <button class="delete-btn" data-index="${idx}">Delete</button>
        </div>
      `;

      questionList.appendChild(card);
    });

    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute("data-index"), 10);
        if (confirm("Are you sure you want to delete this question?")) {
          questions.splice(idx, 1);
          saveQuestions(questions);
          renderQuestions(questions);
          loadCategories(questions);
        }
      });
    });
  };

  const loadCategories = (questions) => {
    categorySelect.innerHTML = '<option value="">Select category</option>';
    const categories = [...new Set(questions.map((q) => q.category))];
    if (categories.length === 0) {
      const option = document.createElement("option");
      option.value = "new";
      option.textContent = "New Category";
      categorySelect.appendChild(option);
      newCatInput = document.createElement("input");
      newCatInput.type = "text";
      newCatInput.id = "new-category-input";
      newCatInput.placeholder = "Enter new category name";
      newCatInput.style.display = "none";
      categorySelect.parentNode.insertBefore(newCatInput, categorySelect.nextSibling);
    } else {
      categories.forEach((cat) => {
        const option = document.createElement("option");
        option.value = cat;
        option.textContent = cat;
        categorySelect.appendChild(option);
      });
    }
    // Add option for new category
    const newCatOption = document.createElement("option");
    newCatOption.value = "__new__";
    newCatOption.textContent = "Add New Category...";
    categorySelect.appendChild(newCatOption);

    categorySelect.addEventListener('change', function() {
      if (categorySelect.value === "__new__") {
        newCatInput.style.display = 'block';
        newCatInput.focus();
      } else {
        newCatInput.style.display = 'none';
      }
    });
  };

  const loadSettings = () => {
    const stored = localStorage.getItem("quizSettings");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        localStorage.removeItem("quizSettings");
      }
    }
    return { min: 1, max: 5 };
  };

  const saveSettings = (min, max) => {
    localStorage.setItem("quizSettings", JSON.stringify({ min, max }));
  };

  const settings = loadSettings();
  minInput.value = settings.min;
  maxInput.value = settings.max;

  settingsForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const minVal = parseInt(minInput.value, 10);
    const maxVal = parseInt(maxInput.value, 10);

    if (isNaN(minVal) || isNaN(maxVal) || minVal < 1 || maxVal < 1) {
      alert("Please enter valid positive numbers for min and max.");
      return;
    }

    if (minVal > maxVal) {
      alert("Minimum cannot be greater than maximum.");
      return;
    }

    saveSettings(minVal, maxVal);
    alert("Settings saved!");
  });

  const setupMarkCorrectButtons = () => {
    document.querySelectorAll(".mark-correct").forEach((btn) => {
      btn.addEventListener("click", () => {
        btn.parentElement.parentElement
          .querySelectorAll(".mark-correct")
          .forEach((b) => b.classList.remove("selected"));

        btn.classList.add("selected");
      });
    });
  };

  setupMarkCorrectButtons();

  // Fetch categories from backend and populate dropdown
  function fetchAndPopulateCategories(selectedId = null) {
    fetch('https://quiz-app-db-2.onrender.com/api/categories')
      .then(response => response.json())
      .then(categories => {
        categorySelect.innerHTML = '<option value="">Select category</option>';
        categories.forEach(cat => {
          const option = document.createElement("option");
          option.value = cat.id;
          option.textContent = cat.name;
          categorySelect.appendChild(option);
        });
        // Add option for new category
        const newCatOption = document.createElement("option");
        newCatOption.value = "__new__";
        newCatOption.textContent = "Add New Category...";
        categorySelect.appendChild(newCatOption);
        if (selectedId) categorySelect.value = selectedId;
      });
  }

  categorySelect.addEventListener('change', function() {
    if (categorySelect.value === "__new__") {
      if (!newCatInput) {
        newCatInput = document.createElement('input');
        newCatInput.type = 'text';
        newCatInput.id = 'new-category-input';
        newCatInput.placeholder = 'Enter new category name';
        newCatInput.style.display = 'block';
        categorySelect.parentNode.insertBefore(newCatInput, categorySelect.nextSibling);
      }
      newCatInput.style.display = 'block';
      newCatInput.focus();
    } else if (newCatInput) {
      newCatInput.style.display = 'none';
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    let categoryId = categorySelect.value;
    let categoryName = null;
    const statusMsg = document.getElementById('status-message') || (() => {
      const el = document.createElement('div');
      el.id = 'status-message';
      el.style.margin = '10px 0';
      form.parentNode.insertBefore(el, form);
      return el;
    })();
    statusMsg.textContent = '';
    statusMsg.style.color = '';
    try {
      if (categoryId === "__new__") {
        categoryName = newCatInput.value.trim();
        if (!categoryName) {
          alert('Please enter a new category name.');
          newCatInput.focus();
          return;
        }
        // Add new category to backend
        const res = await fetch('https://quiz-app-db-2.onrender.com/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: categoryName })
        });
        const newCat = await res.json();
        categoryId = newCat.id;
        fetchAndPopulateCategories(categoryId); // Refresh dropdown and select new
      }
      const questionText = document.getElementById("question").value.trim();
      const optionInputs = document.querySelectorAll(".option-input");
      const options = [];
      let answer = "";
      optionInputs.forEach((input) => {
        const val = input.value.trim();
        if (val) {
          options.push(val);
          const btn = input.nextElementSibling;
          if (btn && btn.classList.contains("selected")) {
            answer = val;
          }
        }
      });
      if (!categoryId) {
        alert("Please select a category.");
        return;
      }
      if (!questionText) {
        alert("Please enter the question text.");
        return;
      }
      if (options.length < 2) {
        alert("Please provide at least two options.");
        return;
      }
      if (!answer) {
        alert("Please mark the correct answer.");
        return;
      }
      // Add question to backend
      const resp = await fetch('https://quiz-app-db-2.onrender.com/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId,
          question: questionText,
          choices: options,
          answer
        })
      });
      if (resp.ok) {
        statusMsg.textContent = 'Question added successfully!';
        statusMsg.style.color = 'green';
        form.reset();
        if (newCatInput) newCatInput.style.display = 'none';
        fetchAndPopulateCategories();
      } else {
        const err = await resp.json();
        statusMsg.textContent = 'Error adding question: ' + (err.error || resp.statusText);
        statusMsg.style.color = 'red';
      }
    } catch (err) {
      statusMsg.textContent = 'Error adding question: ' + err.message;
      statusMsg.style.color = 'red';
    }
    // Optionally reload questions list here
  });

  // On page load, fetch categories
  fetchAndPopulateCategories();

  // Fetch and display all categories and their questions
  function loadAllQuestionsAndCategories() {
    questionList.innerHTML = '';
    fetch('https://quiz-app-db-2.onrender.com/api/categories')
      .then(response => response.json())
      .then(categories => {
        if (!Array.isArray(categories)) {
          questionList.innerHTML = '<div class="error">Failed to load categories. Please check your backend connection and database.</div>';
          return;
        }
        categories.forEach(cat => {
          fetch(`https://quiz-app-db-2.onrender.com/api/questions/${cat.id}`)
            .then(response => response.json())
            .then(questions => {
              const catTitle = document.createElement('h3');
              catTitle.textContent = cat.name;
              questionList.appendChild(catTitle);
              questions.forEach((q, idx) => {
                const card = document.createElement('div');
                card.classList.add('question-card');
                card.innerHTML = `
                  <div class="question-header">
                    <h4>${idx + 1}. ${q.question}</h4>
                    <span class="category-badge">${cat.name}</span>
                  </div>
                  <ul class="options-list">
                    ${q.choices.map((choice, choiceIdx) =>
                      `<li class="option-item ${choice === q.answer ? "correct-answer" : ""}">
                        <span class="option-letter">${String.fromCharCode(65 + choiceIdx)}.</span>
                        ${choice}
                      </li>`
                    ).join("")}
                  </ul>
                  <div class="question-actions">
                    <button class="edit-btn" data-id="${q.id}">Edit</button>
                    <button class="delete-btn" data-id="${q.id}">Delete</button>
                  </div>
                `;
                questionList.appendChild(card);
              });
            });
        });
        // Add event listeners for delete and edit after rendering
        setTimeout(() => {
          document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
              const id = btn.getAttribute('data-id');
              if (confirm('Are you sure you want to delete this question?')) {
                await fetch(`https://quiz-app-db-2.onrender.com/api/questions/${id}`, { method: 'DELETE' });
                loadAllQuestionsAndCategories();
              }
            });
          });
          document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
              const id = btn.getAttribute('data-id');
              // Simple prompt-based edit (for demo)
              const card = btn.closest('.question-card');
              const questionText = prompt('Edit question:', card.querySelector('h4').textContent.replace(/^\d+\.\s*/, ''));
              if (!questionText) return;
              const options = Array.from(card.querySelectorAll('.option-item')).map(li => li.textContent.trim().replace(/^\w\.\s*/, ''));
              const answer = prompt('Edit correct answer:', card.querySelector('.correct-answer')?.textContent.trim().replace(/^\w\.\s*/, ''));
              if (!answer) return;
              await fetch(`https://quiz-app-db-2.onrender.com/api/questions/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: questionText, choices: options, answer })
              });
              loadAllQuestionsAndCategories();
            });
          });
        }, 500);
      })
      .catch(err => {
        questionList.innerHTML = '<div class="error">Failed to load categories. Please check your backend connection and database.</div>';
        console.error('Error loading categories:', err);
      });
  }

  loadAllQuestionsAndCategories();
});

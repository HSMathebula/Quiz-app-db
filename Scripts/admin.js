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

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    let category = categorySelect.value.trim();
    if (category === "__new__") {
      category = newCatInput.value.trim();
      if (!category) {
        alert('Please enter a new category name.');
        newCatInput.focus();
        return;
      }
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
    if (!category) {
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
    const newQuestion = {
      category,
      question: questionText,
      choices: options,
      answer,
    };
    questions.push(newQuestion);
    saveQuestions(questions);
    renderQuestions(questions);
    loadCategories(questions);
    form.reset();
    document.querySelectorAll(".mark-correct").forEach((btn) =>
      btn.classList.remove("selected")
    );

    // Add a button to download the updated questions.json
    let downloadBtn = document.getElementById('download-questions-btn');
    if (!downloadBtn) {
      downloadBtn = document.createElement('button');
      downloadBtn.id = 'download-questions-btn';
      downloadBtn.className = 'btn btn-dark';
      downloadBtn.textContent = 'Download Updated Questions';
      form.parentNode.appendChild(downloadBtn);
    }
    downloadBtn.onclick = function() {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(questions, null, 2));
      const dl = document.createElement('a');
      dl.setAttribute('href', dataStr);
      dl.setAttribute('download', 'questions.json');
      dl.click();
    };
  });

  // Fetch and display all categories and their questions
  function loadAllQuestionsAndCategories() {
    questionList.innerHTML = '';
    fetch('https://quiz-app-db-2.onrender.com/api/categories')
      .then(response => response.json())
      .then(categories => {
        categories.forEach(cat => {
          fetch(`https://quiz-app-db-2.onrender.com/api/questions/${cat.id}`)
            .then(response => response.json())
            .then(questions => {
              // Render category title
              const catTitle = document.createElement('h3');
              catTitle.textContent = cat.name;
              questionList.appendChild(catTitle);

              // Render questions for this category
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
                `;
                questionList.appendChild(card);
              });
            });
        });
      });
  }

  loadAllQuestionsAndCategories();
});

// ================================
// 1. Select Elements
// ================================
const taskInput = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");
const sortBtn = document.getElementById("sort");
const tasksContainer = document.querySelector(".tasks-container");
const countDoneEl = document.getElementById("countDone");
const countDoneper = document.getElementById("countDoneper");
const countTotalEl = document.getElementById("countTotal");

const themeSwitch = document.querySelector(".lightandDArk");
const body = document.body;

// ================================
// 2. State Management
// ================================
let tasks = [];

// ================================
// 3. Initialization
// ================================
window.onload = function () {
  taskInput.focus();

  // Load Theme
  if (localStorage.getItem("theme") === "light") {
    body.classList.add("light-mode");
    themeSwitch.classList.add("active-light");
  }

  // Load Tasks
  const storedTasks = window.localStorage.getItem("tasks");
  if (storedTasks) {
    tasks = JSON.parse(storedTasks);
    renderTasks();
  }

  // Sortable Drag & Drop
  Sortable.create(tasksContainer, {
    animation: 150,
    ghostClass: 'dragging',
    onEnd: function (evt) {
      let item = tasks[evt.oldIndex];
      tasks.splice(evt.oldIndex, 1);
      tasks.splice(evt.newIndex, 0, item);
      saveAndRender(); // Save after sort
    },
  });
};

// ================================
// 4. Core Functions
// ================================

// Add New Task
addBtn.onclick = function () {
  const taskText = taskInput.value.trim();

  // Validation: Empty check
  if (taskText === "") {
    taskInput.focus();
    return;
  }

  // Validation: Duplicate check
  const isDuplicate = tasks.some((task) => task.title === taskText);
  if (isDuplicate) {
    showAlert(`Task "${taskText}" already exists!`);
    taskInput.value = "";
    taskInput.focus();
    return;
  }

  // Create Task Object
  const newTask = {
    id: Date.now(),
    title: taskText,
    done: false,
  };

  tasks.push(newTask);
  saveAndRender();

  taskInput.value = "";
  taskInput.focus();
};

// Trigger Add on Enter Key
taskInput.addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    addBtn.click();
  }
});

// Sort Button (Toggle Done/Not Done)
sortBtn.addEventListener("click", () => {
  tasks = [...tasks.filter((t) => !t.done), ...tasks.filter((t) => t.done)];
  saveAndRender();
});

// Theme Switcher
themeSwitch.addEventListener("click", () => {
  body.classList.toggle("light-mode");
  themeSwitch.classList.toggle("active-light");

  if (body.classList.contains("light-mode")) {
    localStorage.setItem("theme", "light");
  } else {
    localStorage.setItem("theme", "dark");
  }
});

// ================================
// 5. Helpers & Rendering
// ================================

function saveAndRender() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
  renderTasks();
}

function renderTasks() {
  tasksContainer.innerHTML = "";

  tasks.forEach((task, index) => {
    // Create Main Div
    const taskItem = document.createElement("div");
    taskItem.className = `task-item ${task.done ? "completed" : ""}`;

    // Create Left Content
    const taskContent = document.createElement("div");
    taskContent.className = "task-content";

    // Checkbox
    const checkBox = document.createElement("input");
    checkBox.type = "checkbox";
    checkBox.className = "checkbox";
    checkBox.checked = task.done;

    // Text Span
    const textSpan = document.createElement("span");
    textSpan.className = "task-text";
    textSpan.textContent = task.title;

    taskContent.appendChild(checkBox);
    taskContent.appendChild(textSpan);

    // Actions Div
    const actionsDiv = document.createElement("div");

    const editBtn = document.createElement("button");
    editBtn.className = "edit-btn";
    editBtn.innerHTML = "&#9998;"; // Edit Icon

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.innerHTML = "&times;"; // Delete Icon

    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(deleteBtn);

    taskItem.appendChild(taskContent);
    taskItem.appendChild(actionsDiv);
    
    tasksContainer.appendChild(taskItem);

    // --- Events ---

    // Toggle Status
    checkBox.onclick = function (e) {
      e.stopPropagation();
      toggleTaskStatus(index, checkBox.checked);
    };

    // Task Click to Toggle (optional UX)
    taskContent.onclick = function(e) {
        if(e.target !== checkBox) {
           checkBox.click();
        }
    }
    
    // Delete Task
    deleteBtn.onclick = function (e) {
      e.stopPropagation();
      deleteTask(index);
    };

    // Edit Task
    editBtn.onclick = function (e) {
      e.stopPropagation();

      const input = document.createElement("input");
      input.type = "text";
      input.value = task.title;
      input.className = "edit-input";

      taskContent.replaceChild(input, textSpan);
      input.focus();

      const saveEdit = () => {
        const newText = input.value.trim();
        if (newText && newText !== task.title) {
          tasks[index].title = newText;
          saveAndRender();
        } else {
          renderTasks(); // Revert if empty or same
        }
      };

      input.onkeypress = function (event) {
        if (event.key === "Enter") {
          saveEdit();
        }
      };

      // When clicking outside
      input.onblur = saveEdit;
      
      // Prevent click propagation on input
      input.onclick = (e) => e.stopPropagation();
    };
  });

  updateCounters();
}

function toggleTaskStatus(index, status) {
  tasks[index].done = status;
  saveAndRender();
}

function deleteTask(index) {
  tasks.splice(index, 1);
  saveAndRender();
}

function updateCounters() {
  const doneCount = tasks.filter((t) => t.done).length;
  const totalCount = tasks.length;
  
  // Fix NaN issue
  const doneCountper = totalCount === 0 
    ? "0%" 
    : `${Math.floor((doneCount * 100) / totalCount)}%`;

  countDoneEl.textContent = doneCount;
  countTotalEl.textContent = totalCount;
  countDoneper.textContent = doneCountper;
}

// Show Alert Function
function showAlert(message) {
    let div = document.createElement("div");
    div.className = "alertMSG";
    div.textContent = message;

    let button = document.createElement("button");
    button.innerHTML = `&times;`;
    button.className = "buttonAlert";
    
    div.append(button);
    document.body.appendChild(div);

    // Auto remove after 3 seconds
    let time = setTimeout(() => {
        div.remove();
    }, 3000);

    // Manual remove
    button.onclick = () => {
        clearTimeout(time);
      div.remove();
    }
}
// ================================
// 1. Select Elements
// ================================
const taskInput = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");
const sortBtn = document.getElementById("sort");
const tasksContainer = document.querySelector(".tasks-container");
const emptyState = document.querySelector(".empty-state"); // ضفت ده عشان كان ناقص
const countDoneEl = document.getElementById("countDone");
const countDoneper = document.getElementById("countDoneper");
const countTotalEl = document.getElementById("countTotal");

const themeSwitch = document.querySelector(".lightandDArk");
const body = document.body;
const successSound = new Audio(
  "https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3"
);
successSound.volume = 0.2;
let hasCelebrated = false;
const dateInput = document.getElementById("dateInput");
const clearCompletedBtn = document.querySelector(".clear-btn"); // اتأكد ان الكلاس ده موجود في زرار Clear

// ================================
// 2. State Management
// ================================
let tasks = [];
let deletedTask = null; // عرفته هنا عشان ميعملش مشاكل

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

  // Sortable Drag & Drop (Library must be included in HTML)
  if (typeof Sortable !== "undefined") {
    Sortable.create(tasksContainer, {
      animation: 150,
      ghostClass: "dragging",
      onEnd: function (evt) {
        let item = tasks[evt.oldIndex];
        tasks.splice(evt.oldIndex, 1);
        tasks.splice(evt.newIndex, 0, item);
        saveAndRender(); // Save after sort
      },
    });
  }
};

// ================================
// 4. Core Functions
// ================================

// Add New Task
addBtn.onclick = function () {
  const taskText = taskInput.value.trim();
  const taskDate = dateInput.value;

  // 1. لو الحقل فاضي
  if (taskText === "") {
    taskInput.focus();
    return;
  }

  const isDuplicate = tasks.some((task) => task.title === taskText);
  if (isDuplicate) {
    showAlert("هذا العنصر موجود بالفعل! 🚫");
    taskInput.focus();
    return;
  }

  // 3. إنشاء التاسك
  const newTask = {
    id: Date.now(),
    title: taskText,
    dueDate: taskDate,
    done: false,
  };

  tasks.push(newTask);
  saveAndRender();

  taskInput.value = "";
  dateInput.value = "";
  taskInput.focus();
};
taskInput.addEventListener("keypress", function (e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    addBtn.click();
  }
});

sortBtn.addEventListener("click", () => {
  tasks = [...tasks.filter((t) => !t.done), ...tasks.filter((t) => t.done)];
  saveAndRender();
});

// Clear Completed Tasks
if (clearCompletedBtn) {
  clearCompletedBtn.onclick = () => {
    if (confirm("Are you sure you want to clear completed tasks?")) {
      tasks = tasks.filter((t) => !t.done);
      saveAndRender();
    }
  };
}

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

  // Handle Empty State
  if (tasks.length === 0) {
    if (emptyState) emptyState.classList.add("show");
    tasksContainer.style.display = "none";
  } else {
    if (emptyState) emptyState.classList.remove("show");
    tasksContainer.style.display = "flex";
  }

  tasks.forEach((task, index) => {
    // 1. Create Main Container
    const taskItem = document.createElement("div");
    taskItem.className = `task-item ${task.done ? "completed" : ""}`;

    // 2. Create Content Wrapper
    const taskContent = document.createElement("div");
    taskContent.className = "task-content";

    // 3. Checkbox
    const checkBox = document.createElement("input");
    checkBox.type = "checkbox";
    checkBox.className = "checkbox";
    checkBox.checked = task.done;

    // 4. Meta Wrapper (Text + Date)
    const metaDiv = document.createElement("div");
    metaDiv.className = "task-meta";

    // Task Title
    const textSpan = document.createElement("span");
    textSpan.className = "task-text";
    textSpan.textContent = task.title;

    metaDiv.appendChild(textSpan);

    // Date Logic
    if (task.dueDate) {
      const dateSpan = document.createElement("span");
      dateSpan.className = "task-date";

      // Formatting date specifically
      dateSpan.innerHTML = `📅 ${task.dueDate}`;

      // Check for Overdue
      const today = new Date().toISOString().split("T")[0];
      if (task.dueDate < today && !task.done) {
        dateSpan.classList.add("overdue");
        dateSpan.innerHTML += " <b>(Late!)</b>";
      }

      metaDiv.appendChild(dateSpan);
    }

    // Append elements to content
    taskContent.appendChild(checkBox);
    taskContent.appendChild(metaDiv);

    // 5. Actions (Edit/Delete) -> Added class "actions" to match CSS
    const actionsDiv = document.createElement("div");
    actionsDiv.className = "actions";

    const editBtn = document.createElement("button");
    editBtn.className = "edit-btn";
    editBtn.innerHTML = "&#9998;"; // Pencil Icon

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.innerHTML = "&times;"; // X Icon

    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(deleteBtn);

    taskItem.appendChild(taskContent);
    taskItem.appendChild(actionsDiv);

    tasksContainer.appendChild(taskItem);

    // --- Event Listeners ---

    // Toggle Status
    checkBox.onclick = function (e) {
      e.stopPropagation();
      if (navigator.vibrate) navigator.vibrate(30);

      if (checkBox.checked) {
        successSound.currentTime = 0;
        successSound.play();
      }

      toggleTaskStatus(index, checkBox.checked);
    };

    // Click on Content to Toggle (Better UX)
    taskContent.onclick = function (e) {
      // Prevent toggling when clicking input during edit
      if (e.target !== checkBox && e.target.tagName !== "INPUT") {
        checkBox.click();
      }
    };

    // Delete Task
    deleteBtn.onclick = function (e) {
      e.stopPropagation();
      deleteTask(index);
    };

    // Edit Task
    editBtn.onclick = function (e) {
      e.stopPropagation();

      const input = document.createElement("textarea"); // Changed to textarea for better multiline editing
      input.className = "edit-input";
      input.value = task.title;

      // Auto resize height for editing
      input.style.height = "auto";
      input.rows = 1;

      // Replace textSpan inside metaDiv
      metaDiv.replaceChild(input, textSpan);
      input.focus();

      const saveEdit = () => {
        const newText = input.value.trim();
        if (newText && newText !== task.title) {
          tasks[index].title = newText;
          saveAndRender();
        } else {
          renderTasks(); // Revert
        }
      };

      // Save on Enter (Shift+Enter for new line)
      input.onkeypress = function (event) {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          saveEdit();
        }
      };

      input.onblur = saveEdit;
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
  deletedTask = tasks[index];
  tasks.splice(index, 1);
  saveAndRender();
  showUndoAlert();
}

function updateCounters() {
  const doneCount = tasks.filter((t) => t.done).length;
  const totalCount = tasks.length;

  const doneCountper =
    totalCount === 0 ? "0%" : `${Math.floor((doneCount * 100) / totalCount)}%`;

  if (countDoneEl) countDoneEl.textContent = doneCount;
  if (countTotalEl) countTotalEl.textContent = totalCount;
  if (countDoneper) countDoneper.textContent = doneCountper;

  doneItemsconfetti();
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

  let time = setTimeout(() => {
    div.remove();
  }, 3000);

  button.onclick = () => {
    clearTimeout(time);
    div.remove();
  };
}

function doneItemsconfetti() {
  const total = tasks.length;
  const done = tasks.filter((t) => t.done).length;

  if (total !== done) {
    hasCelebrated = false;
    return;
  }

  // Ensure confetti library is loaded
  if (
    total > 0 &&
    total === done &&
    !hasCelebrated &&
    typeof confetti !== "undefined"
  ) {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#6c5ce7", "#fab1a0", "#ffeaa7"],
    });

    hasCelebrated = true;
  }
}

function showUndoAlert() {
  const oldAlert = document.querySelector(".alertMSG");
  if (oldAlert) oldAlert.remove();

  const div = document.createElement("div");
  div.className = "alertMSG";

  div.innerHTML = `
    <span>Task Deleted 🗑️</span>
    <button id="undoBtn" style="margin-left:10px; background:transparent; border:none; color:#fff; font-weight:bold; text-decoration:underline; cursor:pointer;">
      Undo ↩️
    </button>
  `;

  document.body.appendChild(div);

  let time = setTimeout(() => {
    div.remove();
    deletedTask = null;
  }, 4000);

  const undoBtn = document.getElementById("undoBtn");
  if (undoBtn) {
    undoBtn.onclick = function () {
      if (deletedTask) {
        tasks.push(deletedTask);
        saveAndRender();
        deletedTask = null;
      }
      div.remove();
      clearTimeout(time);
    };
  }
}

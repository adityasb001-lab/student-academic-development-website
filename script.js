const STORAGE_KEY = "student-academic-development-tasks";
const THEME_KEY = "student-academic-development-theme";

const taskForm = document.getElementById("taskForm");
const taskId = document.getElementById("taskId");
const titleInput = document.getElementById("title");
const categoryInput = document.getElementById("category");
const priorityInput = document.getElementById("priority");
const deadlineInput = document.getElementById("deadline");
const notesInput = document.getElementById("notes");
const formMsg = document.getElementById("formMsg");
const submitBtn = document.getElementById("submitBtn");
const clearBtn = document.getElementById("clearBtn");

const searchInput = document.getElementById("searchInput");
const filterCategory = document.getElementById("filterCategory");
const filterStatus = document.getElementById("filterStatus");
const sortBy = document.getElementById("sortBy");

const taskList = document.getElementById("taskList");
const emptyState = document.getElementById("emptyState");

const statTotal = document.getElementById("statTotal");
const statActive = document.getElementById("statActive");
const statDone = document.getElementById("statDone");
const themeToggle = document.getElementById("themeToggle");

const template = document.getElementById("taskTemplate");

let tasks = loadTasks();

function loadTasks() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No deadline";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getDeadlineStatus(value) {
  const diff = new Date(value).getTime() - Date.now();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (Number.isNaN(diff)) return { label: "No deadline", className: "muted" };
  if (diff < 0) return { label: "Overdue", className: "danger" };
  if (diff <= day) return { label: "Due soon", className: "warning" };
  return { label: "On track", className: "success" };
}

function showMessage(message, type = "info") {
  formMsg.textContent = message;
  formMsg.dataset.type = type;
}

function resetForm() {
  taskId.value = "";
  taskForm.reset();
  categoryInput.value = "Academic";
  priorityInput.value = "Medium";
  submitBtn.textContent = "Add task";
  showMessage("");
}

function validateTask(data) {
  if (!data.title.trim()) return "Please enter a task title.";
  if (!data.deadline) return "Please choose a deadline.";
  if (Number.isNaN(new Date(data.deadline).getTime())) return "Please enter a valid deadline.";
  return "";
}

function getFormData() {
  return {
    id: taskId.value || String(Date.now()),
    title: titleInput.value.trim(),
    category: categoryInput.value,
    priority: priorityInput.value,
    deadline: deadlineInput.value,
    notes: notesInput.value.trim(),
    completed: false,
    createdAt: taskId.value ? tasks.find((task) => task.id === taskId.value)?.createdAt || Date.now() : Date.now(),
  };
}

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = getFormData();
  const error = validateTask(data);

  if (error) {
    showMessage(error, "error");
    return;
  }

  const index = tasks.findIndex((task) => task.id === data.id);
  if (index >= 0) {
    data.completed = tasks[index].completed;
    tasks[index] = data;
    showMessage("Task updated successfully.", "success");
  } else {
    tasks.unshift(data);
    showMessage("Task added successfully.", "success");
  }

  saveTasks();
  render();
  resetForm();
});

clearBtn.addEventListener("click", resetForm);

searchInput.addEventListener("input", render);
filterCategory.addEventListener("change", render);
filterStatus.addEventListener("change", render);
sortBy.addEventListener("change", render);

themeToggle.addEventListener("click", () => {
  const current = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(current);
});

function applyTheme(theme) {
  if (theme === "dark") {
    document.documentElement.dataset.theme = "dark";
    themeToggle.querySelector(".icon").textContent = "☀";
  } else {
    document.documentElement.dataset.theme = "light";
    delete document.documentElement.dataset.theme;
    themeToggle.querySelector(".icon").textContent = "◐";
  }
  localStorage.setItem(THEME_KEY, theme);
}

function priorityRank(priority) {
  return { High: 3, Medium: 2, Low: 1 }[priority] || 0;
}

function sortTasks(list) {
  const mode = sortBy.value;
  const copy = [...list];

  if (mode === "priority") {
    copy.sort((a, b) => priorityRank(b.priority) - priorityRank(a.priority) || new Date(a.deadline) - new Date(b.deadline));
  } else if (mode === "created") {
    copy.sort((a, b) => b.createdAt - a.createdAt);
  } else {
    copy.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  }
  return copy;
}

function matchesFilters(task) {
  const query = searchInput.value.trim().toLowerCase();
  const categoryOk = filterCategory.value === "All" || task.category === filterCategory.value;
  const statusOk =
    filterStatus.value === "All" ||
    (filterStatus.value === "Completed" && task.completed) ||
    (filterStatus.value === "Active" && !task.completed);
  const searchOk =
    !query ||
    task.title.toLowerCase().includes(query) ||
    task.category.toLowerCase().includes(query) ||
    task.notes.toLowerCase().includes(query);

  return categoryOk && statusOk && searchOk;
}

function createBadge(text, className) {
  const badge = document.createElement("span");
  badge.className = `badge ${className}`;
  badge.textContent = text;
  return badge;
}

function render() {
  const filtered = sortTasks(tasks.filter(matchesFilters));

  taskList.innerHTML = "";
  emptyState.style.display = filtered.length ? "none" : "block";

  filtered.forEach((task) => {
    const node = template.content.firstElementChild.cloneNode(true);
    const title = node.querySelector(".task-title");
    const notes = node.querySelector(".task-notes");
    const categoryBadge = node.querySelector(".task-category");
    const priorityBadge = node.querySelector(".task-priority");
    const deadlineText = node.querySelector(".deadline-text");
    const checkbox = node.querySelector(".task-check");
    const editBtn = node.querySelector(".edit-task");
    const deleteBtn = node.querySelector(".delete-task");

    title.textContent = task.title;
    notes.textContent = task.notes || "No extra notes added.";
    categoryBadge.textContent = task.category;
    categoryBadge.classList.add(task.category.toLowerCase());
    priorityBadge.textContent = task.priority;
    priorityBadge.classList.add(task.priority.toLowerCase());
    deadlineText.textContent = `${formatDateTime(task.deadline)} · ${getDeadlineStatus(task.deadline).label}`;

    checkbox.checked = task.completed;
    node.classList.toggle("task-completed", task.completed);

    checkbox.addEventListener("change", () => {
      task.completed = checkbox.checked;
      saveTasks();
      render();
    });

    editBtn.addEventListener("click", () => {
      taskId.value = task.id;
      titleInput.value = task.title;
      categoryInput.value = task.category;
      priorityInput.value = task.priority;
      deadlineInput.value = task.deadline;
      notesInput.value = task.notes;
      submitBtn.textContent = "Update task";
      showMessage("Editing task. Make your changes and save.");
      window.location.hash = "#planner";
      titleInput.focus();
    });

    deleteBtn.addEventListener("click", () => {
      const confirmDelete = confirm(`Delete “${task.title}”?`);
      if (!confirmDelete) return;
      tasks = tasks.filter((item) => item.id !== task.id);
      saveTasks();
      render();
      showMessage("Task deleted.");
      if (taskId.value === task.id) resetForm();
    });

    const status = getDeadlineStatus(task.deadline);
    if (status.className === "danger") {
      node.style.borderColor = "rgba(214, 69, 69, 0.45)";
    } else if (status.className === "warning") {
      node.style.borderColor = "rgba(188, 108, 37, 0.45)";
    }

    node.querySelector(".task-meta").prepend(createBadge(status.label, status.className));
    taskList.appendChild(node);
  });

  updateStats();
}

function updateStats() {
  statTotal.textContent = tasks.length;
  statDone.textContent = tasks.filter((task) => task.completed).length;
  statActive.textContent = tasks.filter((task) => !task.completed).length;
}

function seedDemoTasks() {
  if (tasks.length) return;
  tasks = [
    {
      id: "demo-1",
      title: "Review web design lecture notes",
      category: "Academic",
      priority: "High",
      deadline: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString().slice(0, 16),
      notes: "Focus on semantic HTML and Flexbox.",
      completed: false,
      createdAt: Date.now() - 300000,
    },
    {
      id: "demo-2",
      title: "30-minute workout",
      category: "Fitness",
      priority: "Medium",
      deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      notes: "Stretch before and after the session.",
      completed: true,
      createdAt: Date.now() - 200000,
    },
    {
      id: "demo-3",
      title: "Organize desk and study materials",
      category: "Personal",
      priority: "Low",
      deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      notes: "",
      completed: false,
      createdAt: Date.now() - 100000,
    },
  ];
  saveTasks();
}

function initializeTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY) || "light";
  applyTheme(savedTheme);
}

seedDemoTasks();
initializeTheme();
render();
resetForm();

const taskInput = document.getElementById("taskInput");
const taskDate = document.getElementById("taskDate");
const taskTime = document.getElementById("taskTime");
const reminderInput = document.getElementById("reminder");
const addTaskBtn = document.getElementById("addTask");
const taskList = document.getElementById("taskList");
const progressText = document.querySelector(".progress-text");
const progressCircle = document.querySelector(".progress-ring__circle");
const searchInput = document.getElementById("searchInput");

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let currentFilter = "all";

function updateProgress() {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  progressText.textContent = `${completed}/${total}`;
  const radius = 34, circ = 2 * Math.PI * radius;
  const offset = circ - (completed / (total || 1)) * circ;
  progressCircle.style.strokeDashoffset = offset;
}

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function renderTasks() {
  taskList.innerHTML = "";
  const searchVal = searchInput.value.toLowerCase();

  tasks.forEach((task, index) => {
    if (
      currentFilter === "active" && task.completed ||
      currentFilter === "completed" && !task.completed
    ) return;

    if (searchVal && !task.text.toLowerCase().includes(searchVal)) return;

    const li = document.createElement("li");
    const span = document.createElement("span");
    span.textContent = task.text;
    li.appendChild(span);

    // Deadline
    if (task.deadline) {
      const deadline = document.createElement("span");
      deadline.classList.add("deadline");
      deadline.textContent = `(${task.deadline})`;
      const now = new Date(), due = new Date(task.deadline);
      if (now > due) deadline.style.color = "red";
      else if (due - now < 3600000) deadline.style.color = "orange"; 
      else deadline.style.color = "lightgreen";
      li.appendChild(deadline);
    }

    if (task.completed) li.classList.add("completed");

    // ✔ Check
    const checkBtn = document.createElement("button");
    checkBtn.classList.add("btn", "check");
    checkBtn.textContent = "✔";
    checkBtn.onclick = () => {
      tasks[index].completed = !tasks[index].completed;
      saveTasks(); renderTasks();
    };

    // ✖ Delete
    const deleteBtn = document.createElement("button");
    deleteBtn.classList.add("btn", "delete");
    deleteBtn.textContent = "✖";
    deleteBtn.onclick = () => {
      tasks.splice(index, 1);
      saveTasks(); renderTasks();
    };

    // ✏️ Edit
    const editBtn = document.createElement("button");
    editBtn.classList.add("btn", "edit");
    editBtn.textContent = "✏️";
    editBtn.onclick = () => {
      const input = document.createElement("input");
      input.type = "text";
      input.value = span.textContent;
      li.replaceChild(input, span);
      input.focus();
      input.onblur = saveEdit;
      input.onkeypress = e => { if (e.key === "Enter") saveEdit(); };
      function saveEdit() {
        tasks[index].text = input.value.trim() || span.textContent;
        saveTasks(); renderTasks();
      }
    };

    const btnGroup = document.createElement("div");
    btnGroup.appendChild(checkBtn);
    btnGroup.appendChild(deleteBtn);
    btnGroup.appendChild(editBtn);

    li.appendChild(btnGroup);
    taskList.appendChild(li);
  });

  updateProgress();
}

addTaskBtn.onclick = () => {
  const text = taskInput.value.trim();
  if (!text) return;
  let deadline = null;
  if (taskDate.value && taskTime.value) {
    deadline = new Date(`${taskDate.value}T${taskTime.value}`).toISOString();
  }
  const reminderMins = parseInt(reminderInput.value) || 0;

  tasks.push({ text, completed: false, deadline, reminder: reminderMins });
  saveTasks(); renderTasks();
  taskInput.value = ""; taskDate.value = ""; taskTime.value = ""; reminderInput.value = "";
};

// Tambah via Enter
taskInput.addEventListener("keypress", e => {
  if (e.key === "Enter") addTaskBtn.click();
});

searchInput.oninput = () => renderTasks();

// Filter
document.querySelectorAll(".filter-btn").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    renderTasks();
  };
});

// Notifikasi
function checkReminders() {
  if (Notification.permission !== "granted") return;
  const now = new Date();
  tasks.forEach(task => {
    if (task.deadline && !task.notified) {
      const due = new Date(task.deadline);
      const remindTime = new Date(due.getTime() - (task.reminder * 60000));
      if (now >= remindTime && now <= due) {
        new Notification("Reminder", { body: task.text });
        task.notified = true;
        saveTasks();
      }
    }
  });
}

if ("Notification" in window) Notification.requestPermission();
setInterval(checkReminders, 30000);

// Auto-buka picker date/time
document.querySelectorAll("#taskDate, #taskTime").forEach(input => {
  input.addEventListener("focus", () => {
    if (input.showPicker) input.showPicker();
  });
  input.addEventListener("click", () => {
    if (input.showPicker) input.showPicker();
  });
});

renderTasks();

// Help modal
const helpBtn = document.getElementById("helpBtn");
const helpModal = document.getElementById("helpModal");
const closeHelp = document.getElementById("closeHelp");

helpBtn.onclick = () => helpModal.style.display = "flex";
closeHelp.onclick = () => helpModal.style.display = "none";
window.onclick = (e) => {
  if (e.target === helpModal) helpModal.style.display = "none";
};

// Supabase Init
const supabaseUrl = "https://crnlucdnjoclpyegnqso.supabase.co"; // ganti
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNybmx1Y2Ruam9jbHB5ZWducXNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMTc3MTUsImV4cCI6MjA3NDY5MzcxNX0.vjZIw7UuMK-iU1cPNZp1LEV4b2BKckUYTgbRIsgmmRU"; // ganti
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

let user = null;
let tasks = [];
let currentFilter = "all";

// Elements
const authContainer = document.getElementById("authContainer");
const appContainer = document.getElementById("appContainer");
const taskInput = document.getElementById("taskInput");
const taskDate = document.getElementById("taskDate");
const taskTime = document.getElementById("taskTime");
const reminderInput = document.getElementById("reminder");
const addTaskBtn = document.getElementById("addTask");
const taskList = document.getElementById("taskList");
const progressText = document.querySelector(".progress-text");
const progressCircle = document.querySelector(".progress-ring__circle");
const searchInput = document.getElementById("searchInput");

// -------- Auth --------
document.getElementById("loginBtn").onclick = async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) return alert(error.message);
  user = data.user;
  authContainer.style.display = "none";
  appContainer.style.display = "block";
  loadTasks();
};

document.getElementById("registerBtn").onclick = async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const { error } = await supabaseClient.auth.signUp({ email, password });
  if (error) return alert(error.message);
  alert("Register berhasil, silakan login.");
};

// -------- Task Functions --------
async function loadTasks() {
  const { data, error } = await supabaseClient
    .from("tasks").select("*").eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) return console.error(error);
  tasks = data;
  renderTasks();
}

async function saveTask(task) {
  const { error } = await supabaseClient.from("tasks").insert([{ ...task, user_id: user.id }]);
  if (error) console.error(error);
  else loadTasks();
}

async function updateTask(id, updates) {
  const { error } = await supabaseClient.from("tasks").update(updates).eq("id", id);
  if (error) console.error(error);
  else loadTasks();
}

async function deleteTask(id) {
  const { error } = await supabaseClient.from("tasks").delete().eq("id", id);
  if (error) console.error(error);
  else loadTasks();
}

// -------- UI --------
function updateProgress() {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  progressText.textContent = `${completed}/${total}`;
  const radius = 34, circ = 2 * Math.PI * radius;
  const offset = circ - (completed / (total || 1)) * circ;
  progressCircle.style.strokeDashoffset = offset;
}

function renderTasks() {
  taskList.innerHTML = "";
  const searchVal = searchInput.value.toLowerCase();

  tasks.forEach(task => {
    if ((currentFilter === "active" && task.completed) ||
        (currentFilter === "completed" && !task.completed)) return;
    if (searchVal && !task.text.toLowerCase().includes(searchVal)) return;

    const li = document.createElement("li");
    const span = document.createElement("span");
    span.textContent = task.text;
    li.appendChild(span);

    // Deadline
    if (task.deadline) {
      const deadline = document.createElement("span");
      deadline.classList.add("deadline");
      deadline.textContent = `(${new Date(task.deadline).toLocaleString()})`;
      li.appendChild(deadline);
    }

    if (task.completed) li.classList.add("completed");

    // Buttons
    const checkBtn = document.createElement("button");
    checkBtn.classList.add("btn","check");
    checkBtn.textContent = "✔";
    checkBtn.onclick = () => updateTask(task.id, { completed: !task.completed });

    const deleteBtn = document.createElement("button");
    deleteBtn.classList.add("btn","delete");
    deleteBtn.textContent = "✖";
    deleteBtn.onclick = () => deleteTask(task.id);

    const editBtn = document.createElement("button");
    editBtn.classList.add("btn","edit");
    editBtn.textContent = "✏️";
    editBtn.onclick = () => {
      const newText = prompt("Edit tugas:", task.text);
      if (newText) updateTask(task.id, { text: newText });
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

// Add Task
addTaskBtn.onclick = async () => {
  const text = taskInput.value.trim();
  if (!text) return;
  let deadline = null;
  if (taskDate.value && taskTime.value) {
    deadline = new Date(`${taskDate.value}T${taskTime.value}`).toISOString();
  }
  const reminderMins = parseInt(reminderInput.value) || 0;
  await saveTask({ text, completed:false, deadline, reminder:reminderMins });
  taskInput.value = ""; taskDate.value=""; taskTime.value=""; reminderInput.value="";
};

taskInput.addEventListener("keypress", e => { if (e.key === "Enter") addTaskBtn.click(); });
searchInput.oninput = () => renderTasks();
document.querySelectorAll(".filter-btn").forEach(btn=>{
  btn.onclick = ()=>{document.querySelectorAll(".filter-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active"); currentFilter = btn.dataset.filter; renderTasks();};
});

// Help modal
const helpBtn = document.getElementById("helpBtn");
const helpModal = document.getElementById("helpModal");
const closeHelp = document.getElementById("closeHelp");
helpBtn.onclick = () => helpModal.style.display = "flex";
closeHelp.onclick = () => helpModal.style.display = "none";
window.onclick = e => { if (e.target === helpModal) helpModal.style.display="none"; };

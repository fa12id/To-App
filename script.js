// Ganti dengan project Supabase kamu
const supabaseUrl = "https://crnlucdnjoclpyegnqso.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNybmx1Y2Ruam9jbHB5ZWducXNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMTc3MTUsImV4cCI6MjA3NDY5MzcxNX0.vjZIw7UuMK-iU1cPNZp1LEV4b2BKckUYTgbRIsgmmRU";
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
const logoutBtn = document.getElementById("logoutBtn");

// -------- Password toggle --------
function togglePassword(fieldId, el) {
  const input = document.getElementById(fieldId);
  if (input.type === "password") {
    input.type = "text";
    el.textContent = "🙈";
  } else {
    input.type = "password";
    el.textContent = "👁️";
  }
}

// -------- Switch forms --------
document.getElementById("showRegister").onclick = () => {
  document.getElementById("loginForm").style.display = "none";
  document.getElementById("registerForm").style.display = "block";
};
document.getElementById("showLogin").onclick = () => {
  document.getElementById("registerForm").style.display = "none";
  document.getElementById("loginForm").style.display = "block";
};

// -------- Auth --------
// Login
document.getElementById("loginBtn").onclick = async () => {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) return alert(error.message);
  user = data.user;
  authContainer.style.display = "none";
  appContainer.style.display = "block";
  loadTasks();
};

// Register (dengan redirect ke confirm.html)
document.getElementById("registerBtn").onclick = async () => {
  const email = document.getElementById("registerEmail").value;
  const password = document.getElementById("registerPassword").value;
  const username = document.getElementById("registerUsername").value;
  const { error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: { 
      data: { username },
      emailRedirectTo: "https://nama-project.vercel.app/confirm.html" // ⬅️ ganti sesuai domain kamu
    }
  });
  if (error) return alert(error.message);
  alert("Register berhasil! Silakan cek email untuk konfirmasi.");
};

// Forgot password
document.getElementById("forgotPassword").onclick = async () => {
  const email = prompt("Masukkan email kamu untuk reset password:");
  if (!email) return;
  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: "https://nama-project.vercel.app/reset.html" // ⬅️ ganti sesuai domain kamu
  });
  if (error) return alert(error.message);
  alert("Email reset password telah dikirim. Silakan cek inbox.");
};

// Logout
logoutBtn.onclick = async () => {
  const { error } = await supabaseClient.auth.signOut();
  if (error) alert("Gagal logout: " + error.message);
};

// -------- Task Functions --------
async function loadTasks() {
  const { data, error } = await supabaseClient
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
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

    if (task.deadline) {
      const deadline = document.createElement("span");
      deadline.classList.add("deadline");
      deadline.textContent = `(${new Date(task.deadline).toLocaleString()})`;
      li.appendChild(deadline);
    }

    if (task.completed) li.classList.add("completed");

    const checkBtn = document.createElement("button");
    checkBtn.classList.add("btn", "check");
    checkBtn.textContent = "✔";
    checkBtn.onclick = () => updateTask(task.id, { completed: !task.completed });

    const deleteBtn = document.createElement("button");
    deleteBtn.classList.add("btn", "delete");
    deleteBtn.textContent = "✖";
    deleteBtn.onclick = () => deleteTask(task.id);

    const editBtn = document.createElement("button");
    editBtn.classList.add("btn", "edit");
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
  await saveTask({ text, completed: false, deadline, reminder: reminderMins });
  taskInput.value = "";
  taskDate.value = "";
  taskTime.value = "";
  reminderInput.value = "";
};

taskInput.addEventListener("keypress", e => { if (e.key === "Enter") addTaskBtn.click(); });
searchInput.oninput = () => renderTasks();
document.querySelectorAll(".filter-btn").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    renderTasks();
  };
});

// -------- Help Modal --------
const helpBtn = document.getElementById("helpBtn");
const helpModal = document.getElementById("helpModal");
const closeHelp = document.getElementById("closeHelp");
helpBtn.onclick = () => (helpModal.style.display = "flex");
closeHelp.onclick = () => (helpModal.style.display = "none");
window.onclick = e => {
  if (e.target === helpModal) helpModal.style.display = "none";
};

// -------- Session Persist --------
async function checkSession() {
  const { data } = await supabaseClient.auth.getSession();
  if (data.session) {
    user = data.session.user;
    authContainer.style.display = "none";
    appContainer.style.display = "block";
    loadTasks();
  } else {
    authContainer.style.display = "flex";
    appContainer.style.display = "none";
  }
}

supabaseClient.auth.onAuthStateChange((_event, session) => {
  if (session) {
    user = session.user;
    authContainer.style.display = "none";
    appContainer.style.display = "block";
    loadTasks();
  } else {
    user = null;
    tasks = [];
    taskList.innerHTML = "";
    appContainer.style.display = "none";
    authContainer.style.display = "flex";
  }
});

// Jalankan saat page load
checkSession();

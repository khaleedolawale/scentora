// ============================================
// AUTH — login, logout, session guarding
// ============================================

const loginView = document.getElementById("adminLoginView");
const dashboardView = document.getElementById("adminDashboardView");

// Check if a user is currently logged in
async function checkAuthSession() {
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();
  return session;
}

// Show the correct view based on auth state
function showLoginView() {
  loginView.style.display = "flex";
  dashboardView.style.display = "none";
}

function showDashboardView() {
  loginView.style.display = "none";
  dashboardView.style.display = "block";

  // Trigger dashboard content loading (defined in admin.js, Phase 9b)
  if (typeof initAdminDashboard === "function") {
    initAdminDashboard();
  }
}

// Handle login form submission
async function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  const errorEl = document.getElementById("loginError");
  const submitBtn = document.getElementById("loginSubmitBtn");

  errorEl.textContent = "";
  submitBtn.textContent = "Logging in...";
  submitBtn.disabled = true;

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  submitBtn.textContent = "Log In";
  submitBtn.disabled = false;

  if (error) {
    errorEl.textContent = "Invalid email or password. Please try again.";
    console.error("Login error:", error);
    return;
  }

  showDashboardView();
}

// Handle logout
async function handleLogout() {
  const confirmed = confirm("Are you sure you want to log out?");
  if (!confirmed) return;

  await supabaseClient.auth.signOut();
  showLoginView();
  document.getElementById("loginForm").reset();
}

// On page load: check if already logged in (persisted session)
async function initAuth() {
  const session = await checkAuthSession();

  if (session) {
    showDashboardView();
  } else {
    showLoginView();
  }

  document.getElementById("loginForm").addEventListener("submit", handleLogin);
  document.getElementById("logoutBtn").addEventListener("click", handleLogout);
}

document.addEventListener("DOMContentLoaded", initAuth);

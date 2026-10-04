// Configuration for Face Recognition Backend API
// Allows dynamic switching between localhost and deployed Render URL

const CONFIG = {
  DEFAULT_LOCAL_API: "http://localhost:5000",
  // Live Render backend URL:
  DEFAULT_PROD_API: "https://face-recognition-system-x8ww.onrender.com",

  getApiBase() {
    const saved = localStorage.getItem("FACE_API_BASE_URL");
    if (saved && saved.trim() !== "") {
      return saved.trim().replace(/\/$/, "");
    }
    // Auto-detect localhost vs production host
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      return this.DEFAULT_LOCAL_API;
    }
    return this.DEFAULT_PROD_API;
  },

  setApiBase(url) {
    if (!url || url.trim() === "") {
      localStorage.removeItem("FACE_API_BASE_URL");
    } else {
      localStorage.setItem("FACE_API_BASE_URL", url.trim().replace(/\/$/, ""));
    }
  }
};

// UI Toast Notification Helper
function showToast(message, type = "info") {
  let container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  let icon = "ℹ️";
  if (type === "success") icon = "✅";
  if (type === "danger") icon = "❌";
  if (type === "warning") icon = "⚠️";

  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    toast.style.transition = "all 0.3s";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Mobile Navbar Toggle
function toggleMobileMenu() {
  const nav = document.getElementById("mainNav");
  if (nav) nav.classList.toggle("active");
}

// Settings Modal Handler
function initSettingsModal() {
  const btn = document.getElementById("btnOpenSettings");
  const modal = document.getElementById("settingsModal");
  const close = document.getElementById("btnCloseSettings");
  const save = document.getElementById("btnSaveSettings");
  const input = document.getElementById("backendUrlInput");

  if (!btn || !modal) return;

  btn.addEventListener("click", () => {
    if (input) input.value = CONFIG.getApiBase();
    modal.classList.add("show");
  });

  if (close) {
    close.addEventListener("click", () => modal.classList.remove("show"));
  }

  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.remove("show");
  });

  if (save) {
    save.addEventListener("click", async () => {
      const newUrl = input.value.trim();
      CONFIG.setApiBase(newUrl);
      showToast("Backend API URL saved! Checking connection...", "info");

      try {
        const res = await fetch(`${CONFIG.getApiBase()}/api/health`);
        if (res.ok) {
          showToast("Connected to Backend successfully!", "success");
        } else {
          showToast("Backend responded with error", "warning");
        }
      } catch (err) {
        showToast("Cannot reach backend at this URL", "danger");
      }

      modal.classList.remove("show");
      setTimeout(() => location.reload(), 1000);
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initSettingsModal();
});

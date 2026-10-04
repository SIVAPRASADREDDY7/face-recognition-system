// Controller for Enrolled Users Directory (users.html)

let allUsers = [];

document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchUserInput");

  fetchUsers();

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const q = searchInput.value.toLowerCase().trim();
      const filtered = allUsers.filter(
        (u) =>
          (u.name || "").toLowerCase().includes(q) ||
          (u.email || "").toLowerCase().includes(q) ||
          (u.department || "").toLowerCase().includes(q) ||
          (u.role || "").toLowerCase().includes(q)
      );
      renderUsersGrid(filtered);
    });
  }
});

async function fetchUsers() {
  const grid = document.getElementById("usersGridContainer");
  const countPill = document.getElementById("usersCountPill");

  try {
    const res = await fetch(`${CONFIG.getApiBase()}/api/users`);
    const data = await res.json();

    if (data.success && data.users) {
      allUsers = data.users;
      if (countPill) countPill.textContent = `${allUsers.length} Enrolled Users`;
      renderUsersGrid(allUsers);
    } else {
      grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: var(--danger); padding: 3rem;">Failed to fetch users: ${data.message || "Unknown error"}</div>`;
    }
  } catch (err) {
    console.error("Fetch users error:", err);
    grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: var(--danger); padding: 3rem;">Cannot connect to backend API at <code>${CONFIG.getApiBase()}</code></div>`;
  }
}

function renderUsersGrid(users) {
  const grid = document.getElementById("usersGridContainer");
  if (!grid) return;

  if (users.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 4rem 1rem;">
        <h3>No Enrolled Faces Found</h3>
        <p style="margin-top: 6px; margin-bottom: 1.5rem;">Enroll faces via the webcam registration page.</p>
        <a href="register.html" class="btn">➕ Enroll Face Now</a>
      </div>
    `;
    return;
  }

  grid.innerHTML = "";

  users.forEach((user) => {
    const card = document.createElement("div");
    card.className = "user-card";

    const initial = user.name ? user.name.charAt(0).toUpperCase() : "U";
    const avatarHtml = user.photo
      ? `<img src="${user.photo}" class="avatar-large" alt="${user.name}">`
      : `<div class="avatar-large" style="display: flex; align-items: center; justify-content: center; font-size: 2.2rem; background: var(--bg-card-hover);">${initial}</div>`;

    const roleBadge = user.role === "Admin"
      ? `<span class="badge badge-warning">Admin</span>`
      : `<span class="badge badge-info">${user.role || "Member"}</span>`;

    const regDate = user.createdAt
      ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : "Recently";

    card.innerHTML = `
      ${avatarHtml}
      <h3>${user.name}</h3>
      <p>${user.email}</p>
      <div style="margin-bottom: 0.8rem; display: flex; gap: 6px; justify-content: center;">
        ${roleBadge}
        <span class="badge badge-success">${user.department || "General"}</span>
      </div>
      <p style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 1.25rem;">Enrolled: ${regDate}</p>
      <button class="btn btn-danger" style="width: 100%; padding: 0.6rem 1rem; font-size: 0.88rem;" onclick="deleteUser('${user._id || user.id}', '${user.name.replace(/'/g, "\\'")}')">
        🗑️ Remove Face
      </button>
    `;

    grid.appendChild(card);
  });
}

async function deleteUser(id, name) {
  if (!confirm(`Are you sure you want to remove ${name} from enrolled faces? They will no longer be recognized by the camera.`)) {
    return;
  }

  try {
    const res = await fetch(`${CONFIG.getApiBase()}/api/users/${id}`, {
      method: "DELETE"
    });
    const data = await res.json();

    if (res.ok && data.success) {
      showToast(`User ${name} removed`, "success");
      fetchUsers();
    } else {
      showToast(data.message || "Failed to delete user", "danger");
    }
  } catch (err) {
    showToast(`Error deleting user: ${err.message}`, "danger");
  }
}

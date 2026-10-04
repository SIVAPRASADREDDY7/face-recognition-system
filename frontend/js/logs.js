// Controller for Attendance Logs (logs.html)

let allLogs = [];

document.addEventListener("DOMContentLoaded", () => {
  const nameInput = document.getElementById("filterNameInput");
  const dateInput = document.getElementById("filterDateInput");
  const btnReset = document.getElementById("btnResetFilters");
  const btnRefresh = document.getElementById("btnRefreshLogs");
  const btnExport = document.getElementById("btnExportCsv");

  // Load logs on page load
  fetchAttendanceLogs();

  // Filters
  if (nameInput) {
    nameInput.addEventListener("input", applyFilters);
  }
  if (dateInput) {
    dateInput.addEventListener("change", applyFilters);
  }
  if (btnReset) {
    btnReset.addEventListener("click", () => {
      if (nameInput) nameInput.value = "";
      if (dateInput) dateInput.value = "";
      applyFilters();
    });
  }
  if (btnRefresh) {
    btnRefresh.addEventListener("click", () => {
      fetchAttendanceLogs();
      showToast("Attendance logs refreshed", "info");
    });
  }

  // Export CSV
  if (btnExport) {
    btnExport.addEventListener("click", () => {
      const selectedDate = dateInput ? dateInput.value : "";
      window.open(`${CONFIG.getApiBase()}/api/attendance/export?date=${selectedDate}`, "_blank");
    });
  }
});

async function fetchAttendanceLogs() {
  const tbody = document.getElementById("logsTableBody");
  const countHeader = document.getElementById("tableCountHeader");

  try {
    const res = await fetch(`${CONFIG.getApiBase()}/api/attendance`);
    const data = await res.json();

    if (data.success && data.logs) {
      allLogs = data.logs;
      applyFilters();
    } else {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--danger); padding: 2rem;">Failed to fetch logs: ${data.message || "Unknown error"}</td></tr>`;
    }
  } catch (err) {
    console.error("Fetch logs error:", err);
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--danger); padding: 2rem;">Cannot connect to backend API at <code>${CONFIG.getApiBase()}</code></td></tr>`;
  }
}

function applyFilters() {
  const nameQuery = (document.getElementById("filterNameInput")?.value || "").toLowerCase().trim();
  const dateQuery = document.getElementById("filterDateInput")?.value || "";

  let filtered = allLogs;

  if (nameQuery) {
    filtered = filtered.filter((log) =>
      (log.userName || "").toLowerCase().includes(nameQuery) ||
      (log.userEmail || "").toLowerCase().includes(nameQuery) ||
      (log.department || "").toLowerCase().includes(nameQuery)
    );
  }

  if (dateQuery) {
    filtered = filtered.filter((log) => log.date === dateQuery);
  }

  renderLogsTable(filtered);
}

function renderLogsTable(logs) {
  const tbody = document.getElementById("logsTableBody");
  const countHeader = document.getElementById("tableCountHeader");
  if (!tbody) return;

  if (countHeader) countHeader.textContent = `📋 Records (${logs.length})`;

  if (logs.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 3rem;">
          No attendance records found matching criteria.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = "";

  logs.forEach((log) => {
    const tr = document.createElement("tr");

    const initial = log.userName ? log.userName.charAt(0).toUpperCase() : "U";
    const avatarHtml = log.photoSnapshot
      ? `<img src="${log.photoSnapshot}" class="avatar" style="width: 36px; height: 36px;" alt="${log.userName}">`
      : `<div class="avatar" style="width: 36px; height: 36px; font-size: 0.9rem;">${initial}</div>`;

    tr.innerHTML = `
      <td>
        <div style="display: flex; align-items: center; gap: 10px;">
          ${avatarHtml}
          <strong>${log.userName}</strong>
        </div>
      </td>
      <td style="color: var(--text-muted);">${log.userEmail || "—"}</td>
      <td>${log.department || "General"}</td>
      <td>${log.date || "—"}</td>
      <td style="font-family: monospace; font-size: 0.95rem;">${log.time || "—"}</td>
      <td>
        <span class="badge badge-info">${log.confidence || 95}%</span>
      </td>
      <td>
        <span class="badge badge-success">${log.status || "Present"}</span>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

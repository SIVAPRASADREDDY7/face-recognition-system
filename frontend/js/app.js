// Controller for Live Recognition & Attendance Scanner (index.html)

let video = null;
let canvas = null;
let faceMatcher = null;
let registeredUsers = [];
let isScanning = false;
let scanInterval = null;
let lastRecognizedUser = null;
let lastLogTimestamp = 0;

document.addEventListener("DOMContentLoaded", async () => {
  video = document.getElementById("videoFeed");
  canvas = document.getElementById("overlayCanvas");

  const btnStart = document.getElementById("btnStartCamera");
  const btnStop = document.getElementById("btnStopCamera");
  const loadingOverlay = document.getElementById("loadingOverlay");
  const loadingText = document.getElementById("loadingText");
  const laser = document.getElementById("scannerLaser");

  // Step 1: Initialize Stats and Recent Activity
  loadStats();
  loadRecentActivity();

  // Step 2: Fetch registered users from backend
  await fetchEnrolledUsers();

  // Step 3: Load Face API AI Models
  try {
    await FaceUtils.loadModels((msg) => {
      if (loadingText) loadingText.textContent = msg;
    });

    document.getElementById("systemStatusBadge").className = "badge badge-success";
    document.getElementById("systemStatusBadge").textContent = "AI Ready • Standing by";

    // Auto-start camera
    startRecognition();
  } catch (err) {
    console.error("Initialization error:", err);
    if (loadingText) {
      loadingText.innerHTML = `<span style="color: var(--danger)">Error: ${err.message}</span><br><small>Check internet connection or browser camera permissions</small>`;
    }
    showToast("Failed to load AI face models", "danger");
  }

  // Camera Control Buttons
  if (btnStart) btnStart.addEventListener("click", startRecognition);
  if (btnStop) btnStop.addEventListener("click", stopRecognition);
});

// Fetch enrolled users from backend and build FaceMatcher
async function fetchEnrolledUsers() {
  try {
    const res = await fetch(`${CONFIG.getApiBase()}/api/users`);
    const data = await res.json();
    if (data.success && data.users) {
      registeredUsers = data.users;
      faceMatcher = FaceUtils.buildFaceMatcher(registeredUsers);
      document.getElementById("statTotalUsers").textContent = registeredUsers.length;
      console.log(`Loaded ${registeredUsers.length} enrolled users for face matching.`);
    }
  } catch (err) {
    console.warn("Could not fetch enrolled users from backend:", err);
  }
}

// Fetch dashboard metrics
async function loadStats() {
  try {
    const res = await fetch(`${CONFIG.getApiBase()}/api/stats`);
    const data = await res.json();
    if (data.success && data.stats) {
      document.getElementById("statTotalUsers").textContent = data.stats.totalUsers;
      document.getElementById("statTodayLogs").textContent = data.stats.todayLogs;
    }
  } catch (err) {
    console.warn("Could not fetch stats:", err);
  }
}

// Load today's recent attendance logs
async function loadRecentActivity() {
  try {
    const res = await fetch(`${CONFIG.getApiBase()}/api/attendance?limit=10`);
    const data = await res.json();
    const feed = document.getElementById("recentActivityFeed");
    if (!feed) return;

    if (data.success && data.logs && data.logs.length > 0) {
      feed.innerHTML = "";
      data.logs.forEach((log) => {
        const item = document.createElement("div");
        item.className = "activity-item";
        const initial = log.userName ? log.userName.charAt(0).toUpperCase() : "U";
        const photo = log.photoSnapshot
          ? `<img src="${log.photoSnapshot}" class="avatar" alt="${log.userName}">`
          : `<div class="avatar">${initial}</div>`;

        item.innerHTML = `
          <div class="activity-user">
            ${photo}
            <div class="activity-details">
              <h4>${log.userName}</h4>
              <p>${log.department || "General"} • ${log.time}</p>
            </div>
          </div>
          <div>
            <span class="badge badge-success">${log.confidence || 95}%</span>
          </div>
        `;
        feed.appendChild(item);
      });
    }
  } catch (err) {
    console.warn("Could not fetch activity feed:", err);
  }
}

// Start Camera and Recognition Loop
async function startRecognition() {
  if (isScanning) return;

  const loadingOverlay = document.getElementById("loadingOverlay");
  const cameraPill = document.getElementById("cameraStatusPill");
  const laser = document.getElementById("scannerLaser");

  try {
    if (cameraPill) {
      cameraPill.className = "badge badge-info";
      cameraPill.textContent = "Connecting Camera...";
    }

    await FaceUtils.startCamera(video);

    if (loadingOverlay) loadingOverlay.style.display = "none";
    if (cameraPill) {
      cameraPill.className = "badge badge-success";
      cameraPill.textContent = "Camera Active";
    }
    if (laser) laser.classList.add("active");

    isScanning = true;

    // Match canvas dimensions to video
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    runFaceDetectionLoop();
    showToast("Camera started. Scanning for faces...", "info");
  } catch (err) {
    console.error("Camera error:", err);
    if (cameraPill) {
      cameraPill.className = "badge badge-danger";
      cameraPill.textContent = "Camera Denied";
    }
    showToast(`Camera Error: ${err.message}`, "danger");
  }
}

// Stop Camera
function stopRecognition() {
  isScanning = false;
  if (scanInterval) clearTimeout(scanInterval);

  FaceUtils.stopCamera(video);

  const cameraPill = document.getElementById("cameraStatusPill");
  const laser = document.getElementById("scannerLaser");
  const target = document.getElementById("faceTarget");

  if (cameraPill) {
    cameraPill.className = "badge badge-warning";
    cameraPill.textContent = "Camera Offline";
  }
  if (laser) laser.classList.remove("active");
  if (target) target.classList.remove("detected");

  // Clear canvas overlay
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  showToast("Camera stopped.", "info");
}

// Real-Time Face Detection & Recognition Loop
async function runFaceDetectionLoop() {
  if (!isScanning) return;

  const target = document.getElementById("faceTarget");
  const ctx = canvas.getContext("2d");

  try {
    if (video.readyState === 4) {
      // Sync canvas size
      if (canvas.width !== video.videoWidth) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      // Detect single face with landmarks & descriptor
      const detection = await FaceUtils.detectFaceAndDescriptor(video);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (detection) {
        if (target) target.classList.add("detected");

        const box = detection.detection.box;
        let matchName = "Unknown Person";
        let matchColor = "#ef4444"; // Red for unknown
        let confidenceScore = Math.round(detection.detection.score * 100);
        let recognizedUserObj = null;

        // Perform face matching against database if matcher is available
        if (faceMatcher) {
          const match = faceMatcher.findBestMatch(detection.descriptor);

          if (match && match.label !== "unknown") {
            // Label format: "userId||userName||userEmail||department"
            const parts = match.label.split("||");
            const userId = parts[0];
            const userName = parts[1];
            const userEmail = parts[2];
            const department = parts[3];

            // Convert distance to confidence %: distance 0 = 100%, distance 0.5 = 75%
            const distance = match.distance;
            confidenceScore = Math.max(70, Math.min(99, Math.round((1 - distance * 0.7) * 100)));

            matchName = `${userName} (${confidenceScore}%)`;
            matchColor = "#10b981"; // Green for recognized

            recognizedUserObj = {
              userId,
              userName,
              userEmail,
              department,
              confidence: confidenceScore
            };

            // Trigger log if not recently logged
            handleAttendanceLog(recognizedUserObj);
          }
        }

        // Draw Bounding Box and Label on Canvas
        ctx.lineWidth = 3;
        ctx.strokeStyle = matchColor;
        ctx.strokeRect(box.x, box.y, box.width, box.height);

        // Draw background pill for text
        ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
        ctx.fillRect(box.x, box.y - 32, box.width, 30);

        // Draw text
        ctx.fillStyle = matchColor;
        ctx.font = "bold 16px -apple-system, sans-serif";
        ctx.fillText(matchName, box.x + 8, box.y - 10);
      } else {
        if (target) target.classList.remove("detected");
      }
    }
  } catch (err) {
    console.warn("Detection frame error:", err);
  }

  // Next frame (throttled to ~12 FPS for smooth performance and zero UI freeze)
  if (isScanning) {
    scanInterval = setTimeout(() => runFaceDetectionLoop(), 80);
  }
}

// Log attendance to backend with duplicate debounce
async function handleAttendanceLog(user) {
  const now = Date.now();
  // Debounce: minimum 15 seconds between client-side log attempts for the same user
  if (lastRecognizedUser === user.userId && now - lastLogTimestamp < 15 * 1000) {
    return;
  }

  lastRecognizedUser = user.userId;
  lastLogTimestamp = now;

  // Play pleasant success chime!
  FaceUtils.playChime("success");

  // Show live banner in UI
  const banner = document.getElementById("latestMatchCard");
  const nameEl = document.getElementById("latestMatchName");
  const detailsEl = document.getElementById("latestMatchDetails");

  if (banner && nameEl) {
    nameEl.textContent = `Welcome, ${user.userName}!`;
    detailsEl.textContent = `${user.department || "General"} • Accuracy: ${user.confidence}%`;
    banner.style.display = "block";
    banner.style.animation = "none";
    banner.offsetHeight; // trigger reflow
    banner.style.animation = "slideIn 0.3s ease";
  }

  // Capture thumbnail snapshot
  const snapshot = FaceUtils.captureSnapshot(video, 160, 160);

  try {
    const res = await fetch(`${CONFIG.getApiBase()}/api/attendance/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.userId,
        userName: user.userName,
        userEmail: user.userEmail,
        department: user.department,
        confidence: user.confidence,
        photoSnapshot: snapshot
      })
    });

    const data = await res.json();
    if (data.success) {
      if (!data.cooldown) {
        showToast(`Attendance recorded: ${user.userName}`, "success");
        loadStats();
        loadRecentActivity();
      }
    }
  } catch (err) {
    console.warn("Attendance log API failed:", err);
  }
}

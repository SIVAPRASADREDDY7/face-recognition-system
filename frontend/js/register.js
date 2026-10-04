// Controller for New Face Enrollment (register.html)

let video = null;
let canvas = null;
let currentDetection = null;
let isDetecting = false;

document.addEventListener("DOMContentLoaded", async () => {
  video = document.getElementById("regVideo");
  canvas = document.getElementById("regCanvas");

  const form = document.getElementById("registerForm");
  const loadingOverlay = document.getElementById("regLoadingOverlay");
  const loadingText = document.getElementById("regLoadingText");
  const statusPill = document.getElementById("faceDetectionStatus");
  const target = document.getElementById("regFaceTarget");

  // Step 1: Load Models
  try {
    await FaceUtils.loadModels((msg) => {
      if (loadingText) loadingText.textContent = msg;
    });

    // Step 2: Start Camera
    if (loadingText) loadingText.textContent = "Connecting camera...";
    await FaceUtils.startCamera(video);

    if (loadingOverlay) loadingOverlay.style.display = "none";
    isDetecting = true;
    runRegistrationDetectionLoop();
  } catch (err) {
    console.error("Init error in register:", err);
    if (loadingText) {
      loadingText.innerHTML = `<span style="color: var(--danger)">Error: ${err.message}</span>`;
    }
    showToast(`Setup error: ${err.message}`, "danger");
  }

  // Handle Form Submission
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (!currentDetection || !currentDetection.descriptor) {
        showToast("No face detected! Please look straight at the camera.", "warning");
        return;
      }

      const btn = document.getElementById("btnRegisterSubmit");
      const originalText = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = `<div class="spinner" style="width: 18px; height: 18px; border-width: 2px;"></div> Enrolling Face...`;

      try {
        // Capture snapshot preview
        const snapshot = FaceUtils.captureSnapshot(video, 200, 200);

        // Convert Float32Array to regular JavaScript array of numbers
        const descriptorArray = Array.from(currentDetection.descriptor);

        const payload = {
          name: document.getElementById("userName").value.trim(),
          email: document.getElementById("userEmail").value.trim(),
          department: document.getElementById("userDepartment").value.trim() || "General",
          role: document.getElementById("userRole").value,
          descriptors: [descriptorArray],
          photo: snapshot
        };

        const res = await fetch(`${CONFIG.getApiBase()}/api/users/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (res.ok && data.success) {
          FaceUtils.playChime("success");
          showToast(`Face registered successfully for ${payload.name}!`, "success");

          // Show snapshot preview
          const previewContainer = document.getElementById("capturedPreviewContainer");
          const previewImg = document.getElementById("capturedThumbnail");
          if (previewContainer && previewImg) {
            previewImg.src = snapshot;
            previewContainer.style.display = "block";
          }

          setTimeout(() => {
            if (confirm("Registration complete! Do you want to go to the Live Scanner now to test face recognition?")) {
              window.location.href = "index.html";
            } else {
              form.reset();
              if (previewContainer) previewContainer.style.display = "none";
              btn.disabled = false;
              btn.innerHTML = originalText;
            }
          }, 800);
        } else {
          showToast(data.message || "Failed to register face", "danger");
          btn.disabled = false;
          btn.innerHTML = originalText;
        }
      } catch (err) {
        console.error("Enrollment error:", err);
        showToast(`Server connection error: ${err.message}`, "danger");
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    });
  }
});

// Loop to detect face alignment
async function runRegistrationDetectionLoop() {
  if (!isDetecting) return;

  const target = document.getElementById("regFaceTarget");
  const statusPill = document.getElementById("faceDetectionStatus");
  const ctx = canvas.getContext("2d");

  try {
    if (video.readyState === 4) {
      if (canvas.width !== video.videoWidth) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      currentDetection = await FaceUtils.detectFaceAndDescriptor(video);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (currentDetection) {
        if (target) target.classList.add("detected");
        if (statusPill) {
          statusPill.className = "badge badge-success";
          statusPill.textContent = "Face Aligned • Ready to Capture";
        }

        // Draw gentle green bounding box
        const box = currentDetection.detection.box;
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#10b981";
        ctx.strokeRect(box.x, box.y, box.width, box.height);
      } else {
        if (target) target.classList.remove("detected");
        if (statusPill) {
          statusPill.className = "badge badge-warning";
          statusPill.textContent = "Looking for Face...";
        }
      }
    }
  } catch (err) {
    console.warn("Reg loop error:", err);
  }

  if (isDetecting) {
    setTimeout(() => runRegistrationDetectionLoop(), 100);
  }
}

// Cleanup camera when leaving page
window.addEventListener("beforeunload", () => {
  isDetecting = false;
  FaceUtils.stopCamera(video);
});

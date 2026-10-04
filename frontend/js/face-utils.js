// Face Recognition Utilities using face-api.js
// Handles model loading, camera initialization, descriptor extraction, and audio chime

const FaceUtils = {
  modelsLoaded: false,
  // Model weights path: checks local directory first, then high-speed CDN fallbacks
  MODEL_URLS: [
    "./models",
    "https://justadudewhohacks.github.io/face-api.js/models",
    "https://cdn.jsdelivr.net/gh/cadenbloomburg/face-api.js@master/weights"
  ],

  // Play a pleasant chime tone using Web Audio API on successful recognition
  playChime(type = "success") {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      if (type === "success") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5

        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch (e) {
      console.warn("Audio chime skipped:", e);
    }
  },

  // Load TinyFaceDetector, 68 Landmark, and Recognition models
  async loadModels(onStatusUpdate) {
    if (this.modelsLoaded) return true;

    if (typeof faceapi === "undefined") {
      throw new Error("face-api.js library script not loaded");
    }

    let loaded = false;
    let lastError = null;

    for (const url of this.MODEL_URLS) {
      try {
        if (onStatusUpdate) onStatusUpdate("Loading AI face detection models...");
        await faceapi.nets.tinyFaceDetector.loadFromUri(url);

        if (onStatusUpdate) onStatusUpdate("Loading facial landmarks model...");
        await faceapi.nets.faceLandmark68Net.loadFromUri(url);

        if (onStatusUpdate) onStatusUpdate("Loading face recognition embedding model...");
        await faceapi.nets.faceRecognitionNet.loadFromUri(url);

        loaded = true;
        break;
      } catch (err) {
        console.warn(`Failed loading models from ${url}, trying fallback...`, err);
        lastError = err;
      }
    }

    if (!loaded) {
      throw new Error(`Failed to load face-api models: ${lastError ? lastError.message : "Network error"}`);
    }

    this.modelsLoaded = true;
    if (onStatusUpdate) onStatusUpdate("AI Models ready!");
    return true;
  },

  // Start webcam video stream
  async startCamera(videoElement) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Webcam access not supported in this browser. Please use Chrome/Firefox over HTTPS or localhost.");
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: "user"
      },
      audio: false
    });

    videoElement.srcObject = stream;
    await new Promise((resolve) => {
      videoElement.onloadedmetadata = () => {
        videoElement.play();
        resolve();
      };
    });

    return stream;
  },

  // Stop camera stream
  stopCamera(videoElement) {
    if (videoElement && videoElement.srcObject) {
      const tracks = videoElement.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      videoElement.srcObject = null;
    }
  },

  // Extract face detection, landmarks, and 128-d descriptor vector from video
  async detectFaceAndDescriptor(videoElement) {
    const options = new faceapi.TinyFaceDetectorOptions({
      inputSize: 416,
      scoreThreshold: 0.5
    });

    const detection = await faceapi
      .detectSingleFace(videoElement, options)
      .withFaceLandmarks()
      .withFaceDescriptor();

    return detection;
  },

  // Detect all faces in video stream (for multi-person recognition)
  async detectAllFacesAndDescriptors(videoElement) {
    const options = new faceapi.TinyFaceDetectorOptions({
      inputSize: 416,
      scoreThreshold: 0.45
    });

    const detections = await faceapi
      .detectAllFaces(videoElement, options)
      .withFaceLandmarks()
      .withFaceDescriptors();

    return detections;
  },

  // Capture current video frame as base64 JPEG image thumbnail
  captureSnapshot(videoElement, width = 200, height = 200) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    // Video is mirrored horizontally, so mirror snapshot as well
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(videoElement, 0, 0, width, height);

    return canvas.toDataURL("image/jpeg", 0.85);
  },

  // Create a faceapi.FaceMatcher from backend users list
  buildFaceMatcher(users, distanceThreshold = 0.52) {
    if (!users || users.length === 0) return null;

    const labeledDescriptors = [];

    users.forEach((user) => {
      if (!user.descriptors || user.descriptors.length === 0) return;

      const floatDescriptors = user.descriptors.map((d) => new Float32Array(d));
      // Label format: "userId||userName||userEmail||department"
      const label = `${user._id || user.id}||${user.name}||${user.email || ""}||${user.department || "General"}`;
      labeledDescriptors.push(new faceapi.LabeledFaceDescriptors(label, floatDescriptors));
    });

    if (labeledDescriptors.length === 0) return null;
    return new faceapi.FaceMatcher(labeledDescriptors, distanceThreshold);
  }
};

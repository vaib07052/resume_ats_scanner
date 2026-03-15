/**
 * upload.js
 * Handles resume file selection (click + drag-drop),
 * sends it to the Flask API, and stores the returned resume_id.
 */

const API_BASE = "http://localhost:5000";

// ── DOM refs ──────────────────────────────────────────────
const dropZone       = document.getElementById("drop-zone");
const fileInput      = document.getElementById("resume-file");
const filePreview    = document.getElementById("file-preview");
const fileNameDisplay= document.getElementById("file-name-display");
const removeFileBtn  = document.getElementById("remove-file");
const uploadStatus   = document.getElementById("upload-status");
const statusFill     = document.getElementById("status-fill");
const statusText     = document.getElementById("status-text");
const uploadSuccess  = document.getElementById("upload-success");
const resumeIdTag    = document.getElementById("resume-id-tag");
const analyzeBtn     = document.getElementById("analyze-btn");
const ctaHint        = document.getElementById("cta-hint");

// ── State ─────────────────────────────────────────────────
let currentResumeId  = null;
let jdReady          = false;   // set by ats_score.js

// ── File selection ────────────────────────────────────────
fileInput.addEventListener("change", () => {
  if (fileInput.files.length) handleFile(fileInput.files[0]);
});

// ── Drag & drop ───────────────────────────────────────────
dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("drag-over");
});
dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("drag-over");
});
dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("drag-over");
  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
});

// ── Click on drop-zone (not on the button) ────────────────
dropZone.addEventListener("click", (e) => {
  if (e.target.closest(".btn")) return; // let the label handle it
  fileInput.click();
});

// ── Remove selected file ──────────────────────────────────
removeFileBtn.addEventListener("click", resetUpload);

// ── Main handler ──────────────────────────────────────────
function handleFile(file) {
  const allowed = ["application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
  const extOk = /\.(pdf|docx)$/i.test(file.name);

  if (!allowed.includes(file.type) && !extOk) {
    showToast("Only PDF and DOCX files are supported.");
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    showToast("File is too large. Maximum size is 5 MB.");
    return;
  }

  // Show preview
  fileNameDisplay.textContent = file.name;
  show(filePreview);
  hide(uploadSuccess);
  hide(uploadStatus);

  // Upload
  uploadResume(file);
}

async function uploadResume(file) {
  const formData = new FormData();
  formData.append("file", file);

  // Progress UI
  show(uploadStatus);
  animateBar(30);
  statusText.textContent = "Uploading…";

  try {
    animateBar(60);
    const response = await fetch(`${API_BASE}/upload-resume`, {
      method: "POST",
      body: formData,
    });

    animateBar(90);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Upload failed.");
    }

    animateBar(100);
    statusText.textContent = "Processing complete.";

    // Store resume ID globally
    currentResumeId = data.resume_id;
    window._resumeId = currentResumeId;

    setTimeout(() => {
      hide(uploadStatus);
      show(uploadSuccess);
      resumeIdTag.textContent = `Resume ID: ${currentResumeId}`;
      updateAnalyzeButton();
    }, 400);

  } catch (err) {
    hide(uploadStatus);
    showToast(err.message || "Could not connect to the server.");
    resetUpload();
  }
}

// ── Helpers ───────────────────────────────────────────────
function animateBar(pct) {
  statusFill.style.width = pct + "%";
}

function resetUpload() {
  currentResumeId = null;
  window._resumeId = null;
  fileInput.value = "";
  hide(filePreview);
  hide(uploadStatus);
  hide(uploadSuccess);
  statusFill.style.width = "0";
  updateAnalyzeButton();
}

function updateAnalyzeButton() {
  const ready = currentResumeId && jdReady;
  analyzeBtn.disabled = !ready;
  ctaHint.textContent = ready
    ? "You're all set — click to see your ATS score."
    : (!currentResumeId && !jdReady)
      ? "Upload a resume and paste a job description to begin."
      : !currentResumeId
        ? "Upload a resume to continue."
        : "Paste a job description to continue.";
}

// Expose so ats_score.js can call it
window.setJdReady = function(val) {
  jdReady = val;
  updateAnalyzeButton();
};

// ── Toast ─────────────────────────────────────────────────
function showToast(msg) {
  const toast   = document.getElementById("error-toast");
  const toastMsg= document.getElementById("toast-msg");
  const closeBtn= document.getElementById("toast-close");

  toastMsg.textContent = msg;
  toast.classList.remove("hidden");

  const dismiss = () => toast.classList.add("hidden");
  closeBtn.onclick = dismiss;
  setTimeout(dismiss, 5000);
}

// ── Utils ─────────────────────────────────────────────────
function show(el) { el.classList.remove("hidden"); }
function hide(el) { el.classList.add("hidden"); }
/**
 * ats_score.js
 * Loaded on BOTH index.html and result.html.
 *
 * On index.html  → watches the JD textarea, fires the /calculate-ats
 *                  API call, then redirects to result.html with ?id=...
 *
 * On result.html → reads ?id from the URL, calls GET /result/<id>,
 *                  and renders the full score breakdown.
 */

const API_BASE = "http://localhost:5000";

/* ═══════════════════════════════════════════════════════════
   INDEX PAGE LOGIC
   ═══════════════════════════════════════════════════════════ */

const jdTextarea  = document.getElementById("job-description");
const analyzeBtn  = document.getElementById("analyze-btn");
const charCount   = document.getElementById("char-count");

if (jdTextarea) {
  // Character counter + JD ready state
  jdTextarea.addEventListener("input", () => {
    const len = jdTextarea.value.trim().length;
    if (charCount) charCount.textContent = jdTextarea.value.length;

    // Notify upload.js of JD readiness
    if (window.setJdReady) window.setJdReady(len >= 30);
  });
}

if (analyzeBtn) {
  analyzeBtn.addEventListener("click", runAnalysis);
}

async function runAnalysis() {
  const resumeId = window._resumeId;
  const jdText   = jdTextarea ? jdTextarea.value.trim() : "";

  if (!resumeId) { showIndexToast("Please upload a resume first."); return; }
  if (!jdText)   { showIndexToast("Please paste a job description."); return; }
  if (jdText.length < 30) {
    showIndexToast("Job description is too short — please paste the full posting.");
    return;
  }

  // Loading state
  analyzeBtn.disabled = true;
  analyzeBtn.querySelector(".btn-text").textContent = "Analyzing…";

  try {
    const response = await fetch(`${API_BASE}/calculate-ats`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resume_id: resumeId, job_description: jdText }),
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.error || "Analysis failed.");

    // Redirect to result page
    window.location.href = `result.html?id=${data.result_id}`;

  } catch (err) {
    analyzeBtn.disabled = false;
    analyzeBtn.querySelector(".btn-text").textContent = "Analyze My Resume";
    showIndexToast(err.message || "Could not connect to the server.");
  }
}

function showIndexToast(msg) {
  const toast    = document.getElementById("error-toast");
  const toastMsg = document.getElementById("toast-msg");
  const closeBtn = document.getElementById("toast-close");
  if (!toast) return;

  toastMsg.textContent = msg;
  toast.classList.remove("hidden");

  const dismiss = () => toast.classList.add("hidden");
  if (closeBtn) closeBtn.onclick = dismiss;
  setTimeout(dismiss, 5000);
}

/* ═══════════════════════════════════════════════════════════
   RESULT PAGE LOGIC
   ═══════════════════════════════════════════════════════════ */

const resultsWrapper = document.getElementById("results-wrapper");
const resultLoading  = document.getElementById("result-loading");
const resultError    = document.getElementById("result-error");
const resultErrorMsg = document.getElementById("result-error-msg");

if (resultsWrapper) {
  // We are on result.html
  loadResult();
}

async function loadResult() {
  const params   = new URLSearchParams(window.location.search);
  const resultId = params.get("id");

  if (!resultId) {
    showResultError("No result ID found. Please go back and run the analysis.");
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/result/${resultId}`);
    const data     = await response.json();

    if (!response.ok) throw new Error(data.error || "Failed to load result.");

    renderResult(data);

  } catch (err) {
    showResultError(err.message || "Could not connect to the server.");
  }
}

function renderResult(data) {
  const score   = data.score || 0;
  const matched = data.matched_keywords || [];
  const missing = data.missing_keywords || [];

  // ── Score ring ───────────────────────────────────────────
  const ringFill   = document.getElementById("ring-fill");
  const scoreNum   = document.getElementById("score-number");
  const headline   = document.getElementById("score-headline");
  const scoreSub   = document.getElementById("score-sub");

  const circumference = 2 * Math.PI * 80; // 502.65
  const offset = circumference - (score / 100) * circumference;

  // Animate number counter
  animateCount(scoreNum, 0, score, 1200);

  // Animate ring (slight delay for drama)
  setTimeout(() => {
    ringFill.style.strokeDashoffset = offset;

    // Colour the ring by score tier
    if (score >= 75)      ringFill.style.stroke = "var(--accent)";
    else if (score >= 50) ringFill.style.stroke = "var(--warn)";
    else                  ringFill.style.stroke = "var(--danger)";
  }, 100);

  // Headline and sub text
  const { label, sub } = getScoreTier(score);
  headline.textContent = label;
  scoreSub.textContent = sub;

  // ── Pill counters ────────────────────────────────────────
  document.getElementById("matched-count").textContent = matched.length;
  document.getElementById("missing-count").textContent = missing.length;

  // ── Keyword lists ────────────────────────────────────────
  const matchedList = document.getElementById("matched-list");
  const missingList = document.getElementById("missing-list");
  document.getElementById("matched-total").textContent =
    `${matched.length} keyword${matched.length !== 1 ? "s" : ""}`;
  document.getElementById("missing-total").textContent =
    `${missing.length} keyword${missing.length !== 1 ? "s" : ""}`;

  matched.forEach((kw, i) => {
    const tag = makeTag(kw, "kw-tag--matched", i * 30);
    matchedList.appendChild(tag);
  });

  missing.forEach((kw, i) => {
    const tag = makeTag(kw, "kw-tag--missing", i * 30);
    missingList.appendChild(tag);
  });

  if (matched.length === 0) {
    matchedList.innerHTML = `<p style="color:var(--text-muted);font-size:.83rem;">No matched keywords found.</p>`;
  }
  if (missing.length === 0) {
    missingList.innerHTML = `<p style="color:var(--text-muted);font-size:.83rem;">Great — no missing keywords!</p>`;
  }

  // ── Copy result button ───────────────────────────────────
  const copyBtn = document.getElementById("copy-result-btn");
  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      const summary =
        `ATS Score: ${score}/100 (${label})\n` +
        `Matched keywords (${matched.length}): ${matched.join(", ") || "none"}\n` +
        `Missing keywords (${missing.length}): ${missing.join(", ") || "none"}`;
      navigator.clipboard.writeText(summary).then(() => {
        copyBtn.textContent = "Copied ✓";
        setTimeout(() => { copyBtn.textContent = "Copy Result Summary"; }, 2000);
      });
    });
  }

  // ── Show results ─────────────────────────────────────────
  if (resultLoading) resultLoading.classList.add("hidden");
  resultsWrapper.classList.remove("hidden");
}

// ── Helpers ───────────────────────────────────────────────
function showResultError(msg) {
  if (resultLoading) resultLoading.classList.add("hidden");
  if (resultError)   {
    resultError.classList.remove("hidden");
    if (resultErrorMsg) resultErrorMsg.textContent = msg;
  }
}

function getScoreTier(score) {
  if (score >= 80) return {
    label: "Excellent Match! 🎉",
    sub:   "Your resume is highly optimised for this role. You're a strong candidate for ATS screening."
  };
  if (score >= 60) return {
    label: "Good Match",
    sub:   "Your resume matches many key requirements. A few targeted improvements could push you higher."
  };
  if (score >= 40) return {
    label: "Fair Match",
    sub:   "There's potential — but the missing keywords suggest gaps worth addressing before applying."
  };
  return {
    label: "Low Match",
    sub:   "Your resume may not pass automated screening for this role. Consider tailoring it carefully."
  };
}

function makeTag(text, cls, delay = 0) {
  const span = document.createElement("span");
  span.className = `kw-tag ${cls}`;
  span.textContent = text;
  span.style.animationDelay = `${delay}ms`;
  return span;
}

function animateCount(el, from, to, duration) {
  const start = performance.now();
  function step(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    el.textContent = Math.round(from + (to - from) * eased);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
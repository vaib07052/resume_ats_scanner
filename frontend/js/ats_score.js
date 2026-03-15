/**
 * ats_score.js
 * Loaded on BOTH index.html and result.html.
 *
 * On index.html  → watches the JD textarea, fires /calculate-ats,
 *                  then redirects to result.html?id=...
 *
 * On result.html → reads ?id from URL, calls GET /result/<id>,
 *                  and renders the full score breakdown.
 */

/* ═══════════════════════════════════════════════════════════
   INDEX PAGE LOGIC
   ═══════════════════════════════════════════════════════════ */

const jdTextarea = document.getElementById("job-description");
const charCount  = document.getElementById("char-count");
const analyzeBtnScore = document.getElementById("analyze-btn");

if (jdTextarea) {
  jdTextarea.addEventListener("input", () => {
    const len = jdTextarea.value.trim().length;
    if (charCount) charCount.textContent = jdTextarea.value.length;
    if (window.setJdReady) window.setJdReady(len >= 30);
  });
}

if (analyzeBtnScore) {
  analyzeBtnScore.addEventListener("click", runAnalysis);
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

  analyzeBtnScore.disabled = true;
  analyzeBtnScore.querySelector(".btn-text").textContent = "Analyzing…";

  try {
    const response = await fetch(`http://localhost:5000/calculate-ats`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resume_id: resumeId, job_description: jdText }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Analysis failed.");

    window.location.href = `result.html?id=${data.result_id}`;

  } catch (err) {
    analyzeBtnScore.disabled = false;
    analyzeBtnScore.querySelector(".btn-text").textContent = "Analyze My Resume";
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
    const response = await fetch(`http://localhost:5000/result/${resultId}`);
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

  const ringFill = document.getElementById("ring-fill");
  const scoreNum = document.getElementById("score-number");
  const headline = document.getElementById("score-headline");
  const scoreSub = document.getElementById("score-sub");

  const circumference = 2 * Math.PI * 80;
  const offset = circumference - (score / 100) * circumference;

  animateCount(scoreNum, 0, score, 1200);

  setTimeout(() => {
    ringFill.style.strokeDashoffset = offset;
    if (score >= 75)      ringFill.style.stroke = "var(--accent)";
    else if (score >= 50) ringFill.style.stroke = "var(--warn)";
    else                  ringFill.style.stroke = "var(--danger)";
  }, 100);

  const { label, sub } = getScoreTier(score);
  headline.textContent = label;
  scoreSub.textContent = sub;

  document.getElementById("matched-count").textContent = matched.length;
  document.getElementById("missing-count").textContent = missing.length;

  const matchedList = document.getElementById("matched-list");
  const missingList = document.getElementById("missing-list");
  document.getElementById("matched-total").textContent =
    `${matched.length} keyword${matched.length !== 1 ? "s" : ""}`;
  document.getElementById("missing-total").textContent =
    `${missing.length} keyword${missing.length !== 1 ? "s" : ""}`;

  matched.forEach((kw, i) => matchedList.appendChild(makeTag(kw, "kw-tag--matched", i * 30)));
  missing.forEach((kw, i) => missingList.appendChild(makeTag(kw, "kw-tag--missing", i * 30)));

  if (matched.length === 0) {
    matchedList.innerHTML = `<p style="color:var(--text-muted);font-size:.83rem;">No matched keywords found.</p>`;
  }
  if (missing.length === 0) {
    missingList.innerHTML = `<p style="color:var(--text-muted);font-size:.83rem;">Great — no missing keywords!</p>`;
  }

  const copyBtn = document.getElementById("copy-result-btn");
  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      const summary =
        `ATS Score: ${score}/100 (${label})\n` +
        `Matched (${matched.length}): ${matched.join(", ") || "none"}\n` +
        `Missing (${missing.length}): ${missing.join(", ") || "none"}`;
      navigator.clipboard.writeText(summary).then(() => {
        copyBtn.textContent = "Copied ✓";
        setTimeout(() => { copyBtn.textContent = "Copy Result Summary"; }, 2000);
      });
    });
  }

  if (resultLoading) resultLoading.classList.add("hidden");
  resultsWrapper.classList.remove("hidden");
}

function showResultError(msg) {
  if (resultLoading) resultLoading.classList.add("hidden");
  if (resultError) {
    resultError.classList.remove("hidden");
    if (resultErrorMsg) resultErrorMsg.textContent = msg;
  }
}

function getScoreTier(score) {
  if (score >= 80) return {
    label: "Excellent Match! 🎉",
    sub: "Your resume is highly optimised for this role."
  };
  if (score >= 60) return {
    label: "Good Match",
    sub: "Your resume matches many key requirements."
  };
  if (score >= 40) return {
    label: "Fair Match",
    sub: "There are gaps worth addressing before applying."
  };
  return {
    label: "Low Match",
    sub: "Consider tailoring your resume carefully for this role."
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
    const elapsed  = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased    = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(from + (to - from) * eased);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
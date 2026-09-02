(() => {
  const REFRESH_MS = 8000;
  let refreshTimer = null;
  let lastExpandedUid = null;

  function isTeacherViewActive() {
    return document.getElementById("teacher-view")?.classList.contains("active");
  }

  function isTeacher() {
    const email = String(cloud?.user?.email || "").toLowerCase();
    return Boolean(cloud?.db && cloud?.user && (cloud.teacherEmails || []).includes(email));
  }

  function fmtDate(value) {
    if (!value) return "";
    let date;
    if (typeof value.toDate === "function") date = value.toDate();
    else date = new Date(value);
    if (!date || Number.isNaN(date.getTime())) return "";
    return date.toLocaleString([], {month:"short", day:"numeric", hour:"numeric", minute:"2-digit"});
  }

  function injectStyles() {
    if (document.getElementById("teacher-review-styles")) return;
    const style = document.createElement("style");
    style.id = "teacher-review-styles";
    style.textContent = `
      .tp-writing-review{grid-column:1/-1;margin-top:18px;border-top:1px solid #d9e2ec;padding-top:18px}
      .tp-writing-review>h4{margin:0 0 4px;color:#102a43;font-size:1.05rem}.tp-writing-review>.tp-review-note{margin:0 0 14px;color:#627d98;font-size:.88rem}
      .tp-review-columns{display:grid;grid-template-columns:1fr 1.35fr;gap:16px}.tp-review-stack{display:grid;gap:10px}
      .tp-review-card{background:#fff;border:1px solid #d9e2ec;border-radius:12px;overflow:hidden}.tp-review-card summary{cursor:pointer;list-style:none;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 13px;font-weight:700;color:#173a64;background:#f8fafc}.tp-review-card summary::-webkit-details-marker{display:none}.tp-review-card summary span{font-size:.75rem;color:#627d98;font-weight:600}.tp-review-body{padding:12px 13px}.tp-review-body p{margin:0;white-space:pre-wrap;color:#334e68;line-height:1.55}.tp-review-body .tp-empty-writing{color:#829ab1;font-style:italic}
      .tp-answer{border-top:1px solid #eef2f6;padding-top:10px;margin-top:10px}.tp-answer:first-child{border-top:0;padding-top:0;margin-top:0}.tp-answer strong{display:block;color:#102a43;font-size:.82rem;margin-bottom:4px}.tp-answer p{margin:0;white-space:pre-wrap}.tp-submitted-pill{display:inline-block;padding:3px 7px;border-radius:999px;background:#e6f4ea;color:#246b3f;font-size:.72rem;font-weight:700}.tp-draft-pill{display:inline-block;padding:3px 7px;border-radius:999px;background:#fff7df;color:#8a5b00;font-size:.72rem;font-weight:700}
      .tp-live-note{display:inline-flex;align-items:center;gap:6px;color:#627d98;font-size:.75rem}.tp-live-dot{width:7px;height:7px;border-radius:50%;background:#2f855a;display:inline-block}
      @media(max-width:900px){.tp-review-columns{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  async function loadWriting(uid, detailRow) {
    if (!isTeacher() || !uid || !detailRow) return;
    const existing = detailRow.querySelector(".tp-writing-review");
    if (existing) existing.remove();

    const host = detailRow.querySelector(".tp-detail");
    if (!host) return;
    const loading = document.createElement("div");
    loading.className = "tp-writing-review";
    loading.innerHTML = `<h4>Student Writing</h4><p class="tp-review-note">Loading saved responses…</p>`;
    host.appendChild(loading);

    try {
      const userRef = cloud.db.collection("businessCanvasUsers").doc(uid);
      const [projectSnap, casesSnap] = await Promise.all([
        userRef.collection("projects").doc("master").get(),
        userRef.collection("cases").get()
      ]);
      const canvas = projectSnap.exists ? (projectSnap.data().canvas || {}) : {};
      const cases = {};
      casesSnap.forEach(doc => { cases[doc.id] = doc.data() || {}; });

      const canvasHtml = sectionOrder.map(key => {
        const state = canvas[key] || {};
        const writing = String(state.guided || "").trim();
        const status = state.status === "complete" ? "Complete" : state.status === "draft" ? "Draft" : "Not started";
        return `<details class="tp-review-card">
          <summary>${escapeHtml(sectionData[key].title)} <span>${escapeHtml(status)}</span></summary>
          <div class="tp-review-body">${writing ? `<p>${escapeHtml(writing)}</p>` : `<p class="tp-empty-writing">No master-canvas writing saved yet.</p>`}</div>
        </details>`;
      }).join("");

      const caseHtml = CASES.map(record => {
        const state = cases[record.id] || {};
        const answers = Array.isArray(state.answers) ? state.answers : [];
        const filled = answers.filter(answer => String(answer || "").trim()).length;
        if (!filled && !state.submitted) return "";
        const badge = state.submitted
          ? `<span class="tp-submitted-pill">Submitted${state.submittedAt ? ` · ${escapeHtml(fmtDate(state.submittedAt))}` : ""}</span>`
          : `<span class="tp-draft-pill">Draft · ${filled}/${record.questions.length} answered</span>`;
        const answersHtml = record.questions.map((question, index) => {
          const answer = String(answers[index] || "").trim();
          if (!answer) return "";
          return `<div class="tp-answer"><strong>Q${index + 1}. ${escapeHtml(question.text || "Question")}</strong><p>${escapeHtml(answer)}</p></div>`;
        }).join("");
        return `<details class="tp-review-card" ${state.submitted ? "open" : ""}>
          <summary>${escapeHtml(record.title)} ${badge}</summary>
          <div class="tp-review-body">${answersHtml || `<p class="tp-empty-writing">No written responses saved.</p>`}</div>
        </details>`;
      }).filter(Boolean).join("");

      loading.innerHTML = `
        <h4>Student Writing</h4>
        <p class="tp-review-note">Read the student's actual saved Canvas and case responses here. <strong>No minimum word count is enforced</strong>; case submission only requires each required response to be non-empty.</p>
        <div class="tp-review-columns">
          <section><p class="eyebrow">Master Canvas writing</p><div class="tp-review-stack">${canvasHtml}</div></section>
          <section><p class="eyebrow">Case responses</p><div class="tp-review-stack">${caseHtml || `<div class="tp-empty-writing">No case writing saved yet.</div>`}</div></section>
        </div>`;
    } catch (error) {
      console.error("Teacher writing review failed:", error);
      loading.innerHTML = `<h4>Student Writing</h4><p class="tp-review-note">Could not load this student's writing. Refresh and try again.</p>`;
    }
  }

  function decorateTeacherHeader() {
    const actions = document.querySelector("#teacher-progress-dashboard .teacher-progress-actions");
    if (!actions || actions.querySelector(".tp-live-note")) return;
    const note = document.createElement("span");
    note.className = "tp-live-note";
    note.innerHTML = `<span class="tp-live-dot"></span>Auto-refreshes every 8s`;
    actions.prepend(note);
  }

  function enforceNoMinimumCopy() {
    const help = document.getElementById("case-submit-help");
    if (help) help.textContent = "Complete every required response to submit. No minimum word count.";
  }

  function maybeLoadExpanded() {
    const row = document.querySelector(".student-row[aria-expanded='true']");
    const detail = row?.nextElementSibling;
    if (!row || !detail?.classList.contains("tp-detail-row")) return;
    lastExpandedUid = row.dataset.tpUid;
    loadWriting(lastExpandedUid, detail);
  }

  document.addEventListener("click", event => {
    const row = event.target.closest?.(".student-row[data-tp-uid]");
    if (row) setTimeout(maybeLoadExpanded, 60);
    if (event.target.closest?.("#tp-refresh")) setTimeout(() => { decorateTeacherHeader(); maybeLoadExpanded(); }, 350);
  });

  const observer = new MutationObserver(() => {
    enforceNoMinimumCopy();
    if (isTeacherViewActive()) decorateTeacherHeader();
  });
  observer.observe(document.documentElement, {childList:true, subtree:true});

  function startAutoRefresh() {
    clearInterval(refreshTimer);
    refreshTimer = setInterval(() => {
      if (!isTeacherViewActive() || !isTeacher()) return;
      const refresh = document.getElementById("tp-refresh");
      if (refresh) {
        refresh.click();
        setTimeout(() => {
          decorateTeacherHeader();
          if (lastExpandedUid) {
            const row = document.querySelector(`.student-row[data-tp-uid="${CSS.escape(lastExpandedUid)}"]`);
            const detail = row?.nextElementSibling;
            if (detail?.classList.contains("tp-detail-row")) loadWriting(lastExpandedUid, detail);
          }
        }, 700);
      }
    }, REFRESH_MS);
  }

  injectStyles();
  enforceNoMinimumCopy();
  startAutoRefresh();
})();

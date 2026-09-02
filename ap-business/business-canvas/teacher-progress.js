(() => {
  const TEACHER_PROGRESS_ID = "teacher-progress-dashboard";
  let cachedStudents = [];
  let expandedUid = null;

  function teacherEmail() {
    return String(cloud?.user?.email || "").toLowerCase();
  }

  function isSignedInTeacher() {
    return Boolean(
      cloud?.enabled &&
      cloud?.db &&
      cloud?.user &&
      Array.isArray(cloud.teacherEmails) &&
      cloud.teacherEmails.includes(teacherEmail())
    );
  }

  function timestampToDate(value) {
    if (!value) return null;
    if (typeof value.toDate === "function") return value.toDate();
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  function newestDate(values) {
    const dates = values.map(timestampToDate).filter(Boolean);
    return dates.length ? new Date(Math.max(...dates.map(date => date.getTime()))) : null;
  }

  function formatWhen(date) {
    if (!date) return "No cloud save yet";
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString(undefined, {month: "short", day: "numeric"});
  }

  function canvasPercent(canvas = {}) {
    if (!sectionOrder.length) return 0;
    return Math.round(
      sectionOrder.reduce((sum, key) => sum + statusPercent(canvas?.[key]?.status || "empty"), 0) /
      sectionOrder.length
    );
  }

  function caseStats(caseMap = {}) {
    let submitted = 0;
    let started = 0;
    let answered = 0;
    CASES.forEach(record => {
      const state = caseMap[record.id] || {};
      const filled = Array.isArray(state.answers)
        ? state.answers.filter(answer => String(answer || "").trim()).length
        : 0;
      answered += filled;
      if (filled || state.submitted) started += 1;
      if (state.submitted) submitted += 1;
    });
    return {submitted, started, answered};
  }

  function overallStatus(student) {
    if (!student.lastActivity) return "Not started";
    if (student.canvasPercent === 100 && student.caseStats.submitted === CASES.length) return "Complete";
    if (student.canvasPercent >= 50 || student.caseStats.started > 0) return "In progress";
    return "Started";
  }

  function injectStyles() {
    if (document.getElementById("teacher-progress-styles")) return;
    const style = document.createElement("style");
    style.id = "teacher-progress-styles";
    style.textContent = `
      .teacher-progress-shell{grid-column:1/-1;background:#fff;border:1px solid #d8e1eb;border-radius:18px;padding:22px;box-shadow:0 10px 30px rgba(16,42,67,.07)}
      .teacher-progress-top{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;margin-bottom:16px}.teacher-progress-top h3{margin:2px 0 5px;font-size:1.35rem;color:#102a43}.teacher-progress-top p{margin:0;color:#627d98;max-width:760px}
      .teacher-progress-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.teacher-progress-actions input,.teacher-progress-actions select{border:1px solid #bcccdc;border-radius:10px;padding:9px 11px;font:inherit;background:#fff;color:#243b53}
      .teacher-progress-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:14px 0 18px}.teacher-progress-summary article{background:#f7f3e8;border:1px solid #e5dfd2;border-radius:13px;padding:13px}.teacher-progress-summary span{display:block;font-size:.72rem;text-transform:uppercase;letter-spacing:.08em;color:#627d98;font-weight:700}.teacher-progress-summary strong{display:block;font-size:1.5rem;color:#173a64;margin-top:3px}
      .teacher-progress-table-wrap{overflow:auto;border:1px solid #d9e2ec;border-radius:14px}.teacher-progress-table{width:100%;border-collapse:collapse;min-width:780px}.teacher-progress-table th{background:#173a64;color:#fff;text-align:left;font-size:.75rem;letter-spacing:.04em;padding:11px}.teacher-progress-table td{padding:11px;border-top:1px solid #e6edf3;color:#334e68;vertical-align:middle}.teacher-progress-table tbody tr.student-row{cursor:pointer}.teacher-progress-table tbody tr.student-row:hover{background:#f5f8fb}.teacher-progress-table .student-name{font-weight:700;color:#102a43}.teacher-progress-table small{display:block;color:#829ab1;margin-top:2px}.tp-meter{height:8px;background:#e6edf3;border-radius:999px;overflow:hidden;min-width:90px;margin-top:5px}.tp-meter span{display:block;height:100%;background:#2f6fad;border-radius:999px}.tp-status{display:inline-block;padding:4px 8px;border-radius:999px;font-size:.74rem;font-weight:700;background:#eaf1f8;color:#173a64}.tp-status.complete{background:#e6f4ea;color:#246b3f}.tp-status.not-started{background:#f1f3f5;color:#627d98}
      .tp-detail-row td{padding:0;background:#fbfcfd}.tp-detail{padding:18px}.tp-detail-grid{display:grid;grid-template-columns:1fr 1.4fr;gap:18px}.tp-section-list,.tp-case-list{display:grid;gap:7px}.tp-detail-item{display:flex;justify-content:space-between;gap:10px;border:1px solid #e2e8f0;border-radius:10px;padding:8px 10px;background:#fff}.tp-detail-item strong{color:#173a64}.tp-detail-item span{color:#627d98;text-align:right}.tp-case-group{margin-top:10px}.tp-case-group h5{margin:0 0 6px;color:#102a43}.tp-empty{padding:20px;text-align:center;color:#627d98}.tp-error{padding:14px;border-radius:12px;background:#fff3f3;color:#9b2c2c;border:1px solid #ffd6d6}.tp-loading{padding:18px;text-align:center;color:#627d98}
      @media(max-width:900px){.teacher-progress-top{flex-direction:column}.teacher-progress-summary{grid-template-columns:1fr 1fr}.tp-detail-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function ensureDashboard() {
    injectStyles();
    const teacherView = document.getElementById("teacher-view");
    if (!teacherView || document.getElementById(TEACHER_PROGRESS_ID)) return;

    const shell = document.createElement("section");
    shell.id = TEACHER_PROGRESS_ID;
    shell.className = "teacher-progress-shell";
    shell.innerHTML = `
      <div class="teacher-progress-top">
        <div>
          <p class="eyebrow">Live class view</p>
          <h3>Student Progress</h3>
          <p>See each student's saved Business Canvas status, case progress, and most recent cloud activity. Click a student for section-by-section and case-by-case detail.</p>
        </div>
        <div class="teacher-progress-actions">
          <input id="tp-search" type="search" placeholder="Search student…" aria-label="Search students">
          <select id="tp-filter" aria-label="Filter progress status">
            <option value="all">All students</option>
            <option value="in-progress">In progress</option>
            <option value="not-started">Not started</option>
            <option value="complete">Complete</option>
          </select>
          <button class="button button-secondary" id="tp-refresh">Refresh</button>
        </div>
      </div>
      <div id="tp-content"><div class="tp-loading">Sign in with the teacher Google account to load class progress.</div></div>
    `;

    const grid = teacherView.querySelector(".teacher-grid");
    if (grid) grid.prepend(shell);
    else teacherView.appendChild(shell);

    const intro = teacherView.querySelector(".page-intro");
    if (intro) {
      const eyebrow = intro.querySelector(".eyebrow");
      const copy = intro.querySelector("p:last-child");
      if (eyebrow) eyebrow.textContent = "Teacher dashboard";
      if (copy) copy.textContent = "Review live student progress and control case access from one place.";
    }

    document.getElementById("tp-refresh")?.addEventListener("click", loadTeacherProgress);
    document.getElementById("tp-search")?.addEventListener("input", renderStudents);
    document.getElementById("tp-filter")?.addEventListener("change", renderStudents);
  }

  async function fetchStudent(userDoc) {
    const data = userDoc.data() || {};
    const ref = userDoc.ref;
    const [projectSnap, casesSnap] = await Promise.all([
      ref.collection("projects").doc("master").get(),
      ref.collection("cases").get()
    ]);

    const projectData = projectSnap.exists ? projectSnap.data() : {};
    const caseMap = {};
    const activityValues = [data.updatedAt, projectData.updatedAt];
    casesSnap.forEach(docSnap => {
      const caseData = docSnap.data() || {};
      caseMap[docSnap.id] = caseData;
      activityValues.push(caseData.updatedAt, caseData.submittedAt);
    });

    const result = {
      uid: userDoc.id,
      name: data.name || data.email || "Student",
      email: data.email || "",
      period: data.period || "AP Business",
      canvas: projectData.canvas || {},
      caseMap,
      lastActivity: newestDate(activityValues)
    };
    result.canvasPercent = canvasPercent(result.canvas);
    result.caseStats = caseStats(caseMap);
    result.status = overallStatus(result);
    return result;
  }

  async function loadTeacherProgress() {
    ensureDashboard();
    const content = document.getElementById("tp-content");
    if (!content) return;

    if (!isSignedInTeacher()) {
      content.innerHTML = `<div class="tp-error">Student progress is protected. Sign in with the authorized teacher @casdonline.org Google account to view class data.</div>`;
      return;
    }

    content.innerHTML = `<div class="tp-loading">Loading student progress from Google…</div>`;
    try {
      const usersSnap = await cloud.db.collection("businessCanvasUsers").get();
      const teacherSet = new Set((cloud.teacherEmails || []).map(email => String(email).toLowerCase()));
      const studentDocs = usersSnap.docs.filter(doc => !teacherSet.has(String(doc.data()?.email || "").toLowerCase()));
      cachedStudents = await Promise.all(studentDocs.map(fetchStudent));
      cachedStudents.sort((a, b) => a.name.localeCompare(b.name));
      renderStudents();
    } catch (error) {
      console.error("Teacher progress load failed:", error);
      const permissionHint = error?.code === "permission-denied"
        ? " Firestore is still blocking teacher class reads; deploy the repository's firestore.rules to the mrdhq-business-canvas Firebase project."
        : "";
      content.innerHTML = `<div class="tp-error">Could not load class progress.${escapeHtml(permissionHint)}</div>`;
    }
  }

  function caseDetailHtml(student) {
    const projects = new Map();
    CASES.forEach(record => {
      const key = record.project || "Cases";
      if (!projects.has(key)) projects.set(key, []);
      projects.get(key).push(record);
    });

    return [...projects.entries()].map(([project, records]) => `
      <div class="tp-case-group">
        <h5>${escapeHtml(project)}</h5>
        <div class="tp-case-list">
          ${records.map(record => {
            const state = student.caseMap[record.id] || {};
            const total = Array.isArray(record.questions) ? record.questions.length : 0;
            const filled = Array.isArray(state.answers) ? state.answers.filter(answer => String(answer || "").trim()).length : 0;
            const label = state.submitted ? "Submitted" : filled ? `${filled}/${total} answered` : "Not started";
            return `<div class="tp-detail-item"><strong>${escapeHtml(record.title)}</strong><span>${escapeHtml(label)}</span></div>`;
          }).join("")}
        </div>
      </div>
    `).join("");
  }

  function detailRow(student) {
    return `
      <tr class="tp-detail-row">
        <td colspan="6">
          <div class="tp-detail">
            <div class="tp-detail-grid">
              <section>
                <p class="eyebrow">Master Canvas</p>
                <div class="tp-section-list">
                  ${sectionOrder.map(key => {
                    const status = student.canvas?.[key]?.status || "empty";
                    const label = status === "complete" ? "Complete" : status === "draft" ? "Draft saved" : "Not started";
                    return `<div class="tp-detail-item"><strong>${escapeHtml(sectionData[key].title)}</strong><span>${label}</span></div>`;
                  }).join("")}
                </div>
              </section>
              <section>
                <p class="eyebrow">Case work</p>
                ${caseDetailHtml(student)}
              </section>
            </div>
          </div>
        </td>
      </tr>
    `;
  }

  function renderStudents() {
    const content = document.getElementById("tp-content");
    if (!content) return;
    const search = String(document.getElementById("tp-search")?.value || "").trim().toLowerCase();
    const filter = document.getElementById("tp-filter")?.value || "all";

    const filtered = cachedStudents.filter(student => {
      const haystack = `${student.name} ${student.email} ${student.period}`.toLowerCase();
      if (search && !haystack.includes(search)) return false;
      const normalized = student.status.toLowerCase().replaceAll(" ", "-");
      return filter === "all" || filter === normalized;
    });

    const activeToday = cachedStudents.filter(student => {
      if (!student.lastActivity) return false;
      return Date.now() - student.lastActivity.getTime() < 24 * 60 * 60 * 1000;
    }).length;
    const avgCanvas = cachedStudents.length
      ? Math.round(cachedStudents.reduce((sum, student) => sum + student.canvasPercent, 0) / cachedStudents.length)
      : 0;
    const totalSubmitted = cachedStudents.reduce((sum, student) => sum + student.caseStats.submitted, 0);

    const summary = `
      <div class="teacher-progress-summary">
        <article><span>Students</span><strong>${cachedStudents.length}</strong></article>
        <article><span>Active last 24h</span><strong>${activeToday}</strong></article>
        <article><span>Average Canvas</span><strong>${avgCanvas}%</strong></article>
        <article><span>Cases submitted</span><strong>${totalSubmitted}</strong></article>
      </div>
    `;

    if (!filtered.length) {
      content.innerHTML = summary + `<div class="tp-empty">${cachedStudents.length ? "No students match this filter." : "No student cloud records have been saved yet."}</div>`;
      return;
    }

    content.innerHTML = summary + `
      <div class="teacher-progress-table-wrap">
        <table class="teacher-progress-table">
          <thead><tr><th>Student</th><th>Canvas</th><th>Cases</th><th>Last saved</th><th>Class</th><th>Status</th></tr></thead>
          <tbody>
            ${filtered.map(student => {
              const statusClass = student.status.toLowerCase().replaceAll(" ", "-");
              return `
                <tr class="student-row" data-tp-uid="${escapeHtml(student.uid)}" aria-expanded="${expandedUid === student.uid}">
                  <td><span class="student-name">${escapeHtml(student.name)}</span><small>${escapeHtml(student.email)}</small></td>
                  <td><strong>${student.canvasPercent}%</strong><div class="tp-meter"><span style="width:${student.canvasPercent}%"></span></div></td>
                  <td><strong>${student.caseStats.submitted}/${CASES.length}</strong><small>${student.caseStats.started} started</small></td>
                  <td>${escapeHtml(formatWhen(student.lastActivity))}</td>
                  <td>${escapeHtml(student.period)}</td>
                  <td><span class="tp-status ${statusClass}">${escapeHtml(student.status)}</span></td>
                </tr>
                ${expandedUid === student.uid ? detailRow(student) : ""}
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    `;

    content.querySelectorAll("[data-tp-uid]").forEach(row => {
      row.addEventListener("click", () => {
        expandedUid = expandedUid === row.dataset.tpUid ? null : row.dataset.tpUid;
        renderStudents();
      });
    });
  }

  function attachTeacherViewListener() {
    document.querySelector(".teacher-nav")?.addEventListener("click", () => {
      setTimeout(loadTeacherProgress, 0);
    });
  }

  ensureDashboard();
  attachTeacherViewListener();

  if (window.firebase?.auth) {
    try {
      firebase.auth().onAuthStateChanged(() => {
        if (document.getElementById("teacher-view")?.classList.contains("active")) {
          loadTeacherProgress();
        }
      });
    } catch (error) {
      console.warn("Teacher progress auth listener not ready:", error);
    }
  }
})();

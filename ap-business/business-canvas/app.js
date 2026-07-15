const STORAGE = {
  profile: "mrdhqProfileV4",
  canvas: "mrdhqCanvasV4",
  cases: "mrdhqCaseStatesV4",
  settings: "mrdhqSettingsV4",
  legacyProfile: "mrdhqProfileV2",
  legacyCanvas: "mrdhqCanvasV2",
  legacyCase: "mrdhqBombasV2",
  legacySettings: "mrdhqSettingsV2"
};

const sectionOrder = ["organization", "operations", "customer", "product", "market", "finance"];
const sectionData = {
  organization: {
    title: "Organization", icon: "▥", className: "organization",
    summary: "Vision statement\nMission statement\nSkills assessment\nStrategic decision using PACED model",
    overview: "Explain the purpose, direction, capabilities, and strategic decision process of the business.",
    prompt: "Write the Organization section as it should currently appear on your master canvas.",
    checklist: ["Vision statement", "Mission statement", "Skills assessment", "Strategic decision using the PACED model"],
    example: "Mission: We provide reliable, affordable meal kits for busy student athletes so they can eat well without losing study or practice time. Vision: Every student athlete can access convenient food that supports performance and well-being."
  },
  operations: {
    title: "Operations", icon: "↻", className: "operations",
    summary: "Supply chain plan, including production process\nMarketing channel(s)\nKPI(s) for operations-related goal(s)",
    overview: "Show how the good or service will be produced, delivered, and measured operationally.",
    prompt: "Write the Operations section as it should currently appear on your master canvas.",
    checklist: ["Production or service-delivery process", "Supply chain inputs and suppliers", "Marketing or distribution channels", "Operations-related KPI(s)"],
    example: "Local produce is purchased weekly, assembled in a school-approved kitchen, refrigerated, and delivered through preordered pickup stations. The operations KPI is 95% of orders ready within five minutes of the promised pickup time."
  },
  customer: {
    title: "Customer", icon: "◯", className: "customer",
    summary: "Validated customer problem, need, or want*\nTarget customer profile*\nResearch findings on preferences*\nCustomer relationships and sales tactics\nMarketing campaign and digital tools*\nCustomer KPI(s)",
    overview: "Identify the paying customer, validate the problem, and explain how the business will attract, serve, and retain that customer.",
    prompt: "Write the Customer section as it should currently appear on your master canvas.",
    checklist: ["Identification and validation of a customer problem, need, or want*", "Target customer profile*", "Research findings on customer preferences*", "Plan to build customer relationships, including sales tactic(s)", "Marketing campaign, including digital marketing tool(s)*", "Customer-related KPI(s)"],
    example: "Primary customers are students ages 15–18 who remain at school for athletics and have $3–$6 available for an afternoon purchase. Interviews showed that speed, price, and protein content matter more than having many flavor choices."
  },
  product: {
    title: "Product (Good or Service)", icon: "◉", className: "product",
    summary: "Product idea and problem-solution fit*\nMVP used to assess product-market fit*\nValue proposition\nBranding and brand identity*",
    overview: "Explain the solution, the customer value it creates, and what testing showed about product-market fit and branding.",
    prompt: "Write the Product section as it should currently appear on your master canvas.",
    checklist: ["Product idea that achieves problem-solution fit*", "Minimum viable product used to assess product-market fit*", "Value proposition", "Branding or brand identity*"],
    example: "The MVP is a preorder menu containing three protein snack options. The value proposition is a fast, affordable snack designed around the schedule and nutritional needs of student athletes."
  },
  market: {
    title: "Market", icon: "◇", className: "market",
    summary: "Plan to seek competitive advantage\nPESTEL analysis\nResearch on competitive landscape\nMarket KPI(s)\nPorter’s Five Forces and/or SWOT analysis",
    overview: "Analyze the external market, competitors, risks, opportunities, and strategic position of the business.",
    prompt: "Write the Market section as it should currently appear on your master canvas.",
    checklist: ["Plan to seek competitive advantage", "PESTEL analysis", "Research findings on competitive landscape", "Market-related KPI(s)", "Porter’s Five Forces and/or SWOT analysis"],
    example: "The business competes through convenience and a focused student-athlete niche. Its main direct competitor is the school snack bar; indirect competitors include vending machines and food brought from home."
  },
  finance: {
    title: "Finance/Accounting", icon: "$", className: "finance",
    summary: "Price and pricing strategy*\nStartup costs\nPotential source(s) of financial capital\nRevenue projection\nKPI(s) for finance-related goal(s)",
    overview: "Demonstrate whether the business can support itself financially and identify the money required to begin and operate.",
    prompt: "Write the Finance/Accounting section as it should currently appear on your master canvas.",
    checklist: ["Price and pricing strategy*", "Startup costs", "Potential sources of financial capital", "Revenue projection", "Finance-related KPI(s)"],
    example: "The introductory price is $3 after customer testing. Estimated variable cost is $1.35 per snack. Startup funding of $650 will come from owner savings and a school entrepreneurship grant."
  }
};

const unitDeliverables = {
  1: {
    title: "Unit 1 · Foundations of Market Entry",
    description: "Build the first version of the opportunity, product, organization, operations, and market sections.",
    groups: {
      Customer: ["Identification and validation of a customer problem, need, or want*"],
      Product: ["Product idea that achieves problem-solution fit*"],
      Organization: ["Vision statement", "Mission statement"],
      Operations: ["Supply chain plan, including process(es) for producing the good or service"],
      Market: ["Plan to seek competitive advantage", "PESTEL analysis"]
    }
  },
  2: {
    title: "Unit 2 · Marketing",
    description: "Use primary and secondary research to develop the customer, product, market, operations, finance, and appendix elements.",
    groups: {
      Customer: ["Target customer profile*", "Plan to build customer relationships, including sales tactic(s)", "Research findings on customer preferences*", "Marketing campaign, including digital marketing tool(s)*"],
      Product: ["Minimum viable product used to assess product-market fit*", "Value proposition", "Branding/brand identity*"],
      Operations: ["Marketing channel(s)"],
      Market: ["Research findings on competitive landscape"],
      "Finance/Accounting": ["Price and pricing strategy*"],
      Appendix: ["Data visualization"]
    }
  },
  3: {
    title: "Unit 3 · Business and Personal Finance Management",
    description: "Determine the financial requirements and projected performance of the business.",
    groups: {
      "Finance/Accounting": ["Startup costs", "Potential source(s) of financial capital", "Revenue projection"],
      Appendix: ["Pitch", "Actual or projected income statement"]
    }
  },
  4: {
    title: "Unit 4 · Leading and Measuring Success",
    description: "Set measurable goals, use strategic frameworks, and revise the complete canvas into the final version.",
    groups: {
      Customer: ["KPI(s) for customer-related goal(s)"],
      Organization: ["Skills assessment", "Strategic decision using PACED model"],
      Operations: ["KPI(s) for operations-related goal(s)"],
      Market: ["KPI(s) for market-related goal(s)", "Framework analysis using Porter’s Five Forces and/or SWOT analysis"],
      "Finance/Accounting": ["KPI(s) for finance-related goal(s)"],
      Appendix: ["Final Business Canvas and Appendix"]
    }
  }
};



const CASES = Array.isArray(window.MRDHQ_CASES) ? window.MRDHQ_CASES : [];
const CASE_BY_ID = Object.fromEntries(CASES.map(item => [item.id, item]));
const CASE_AUDIT = window.MRDHQ_CASE_AUDIT || {includedCount: CASES.length, expectedCount: CASES.length, missingCount: 0, missing: []};
const PROJECT_RESOURCES = Array.isArray(window.MRDHQ_PROJECT_RESOURCES) ? window.MRDHQ_PROJECT_RESOURCES : [];

function safeParse(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function defaultCanvasState() {
  return Object.fromEntries(
    sectionOrder.map(key => [
      key,
      {
        status: "empty",
        guided: "",
        learn: "",
        hypothesis: "",
        method: "",
        evidence: "",
        decision: "",
        updatedAt: null
      }
    ])
  );
}

function defaultCaseState(caseRecord) {
  return {
    highlights: {},
    answers: Array(caseRecord?.questions?.length || 0).fill(""),
    extensions: {},
    submitted: false,
    submittedAt: null,
    updatedAt: null
  };
}

function normalizeCaseState(caseRecord, state = {}) {
  const normalized = {...defaultCaseState(caseRecord), ...state};
  const required = caseRecord.questions.length;
  normalized.answers = Array.from({length: required}, (_, index) => normalized.answers?.[index] || "");
  normalized.highlights = normalized.highlights || {};
  normalized.extensions = normalized.extensions || {};
  return normalized;
}

let profile =
  safeParse(STORAGE.profile, null) ||
  safeParse(STORAGE.legacyProfile, null);

let canvasState = {
  ...defaultCanvasState(),
  ...(safeParse(STORAGE.canvas, null) || safeParse(STORAGE.legacyCanvas, {}))
};

let caseStates = safeParse(STORAGE.cases, {});
const legacyBombas = safeParse(STORAGE.legacyCase, null);
if (legacyBombas && !caseStates.bombas) caseStates.bombas = legacyBombas;
CASES.forEach(caseRecord => {
  caseStates[caseRecord.id] = normalizeCaseState(caseRecord, caseStates[caseRecord.id]);
});

let settings =
  safeParse(STORAGE.settings, null) ||
  safeParse(STORAGE.legacySettings, {locks: {}});
settings.locks = settings.locks || {};

let activeSection = null;
let activeHighlightCategory = "customer";
let lastFocusedAnswer = 0;
let currentCaseId = sessionStorage.getItem("mrdhqCurrentCase") || CASES[0]?.id || "bombas";
let teacherMode = true;
let settingsDirty = false;
const dirtyCaseIds = new Set();
let cloudSaveTimer = null;

const cloud = {
  enabled: false,
  ready: false,
  auth: null,
  db: null,
  user: null,
  classId: window.MRDHQ_APP_SETTINGS?.classId || "ap-business-main",
  teacherEmails: (window.MRDHQ_APP_SETTINGS?.teacherEmails || []).map(email => String(email).toLowerCase())
};

function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  }[character]));
}

function statusPercent(status) {
  return status === "complete" ? 100 : status === "draft" ? 50 : 0;
}

function wordCount(text = "") {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function initials(name = "") {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join("")
    .toUpperCase() || "ST";
}

function currentCase() {
  return CASE_BY_ID[currentCaseId] || CASES[0];
}

function currentCaseState() {
  const record = currentCase();
  if (!record) return defaultCaseState({questions: []});
  caseStates[record.id] = normalizeCaseState(record, caseStates[record.id]);
  return caseStates[record.id];
}

function saveLocal() {
  localStorage.setItem(STORAGE.profile, JSON.stringify(profile));
  localStorage.setItem(STORAGE.canvas, JSON.stringify(canvasState));
  localStorage.setItem(STORAGE.cases, JSON.stringify(caseStates));
  localStorage.setItem(STORAGE.settings, JSON.stringify(settings));
}

function setSaveStatus(text) {
  const status = document.getElementById("save-status");
  if (status) status.textContent = text;
}

function scheduleCloudSave() {
  if (!cloud.enabled || !cloud.user) {
    setSaveStatus("Saved on this device");
    return;
  }
  setSaveStatus("Saving to Google…");
  clearTimeout(cloudSaveTimer);
  cloudSaveTimer = setTimeout(saveCloudNow, 900);
}

function saveAll({caseId = null, allCases = false} = {}) {
  if (caseId) dirtyCaseIds.add(caseId);
  if (allCases) CASES.forEach(item => dirtyCaseIds.add(item.id));
  saveLocal();
  scheduleCloudSave();
}

async function saveCloudNow() {
  if (!cloud.enabled || !cloud.user || !cloud.db) return;
  try {
    const userRef = cloud.db.collection("businessCanvasUsers").doc(cloud.user.uid);
    const batch = cloud.db.batch();
    batch.set(userRef, {
      name: profile?.name || cloud.user.displayName || "Student",
      email: cloud.user.email || "",
      period: profile?.period || "AP Business",
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, {merge: true});
    batch.set(userRef.collection("projects").doc("master"), {
      canvas: canvasState,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, {merge: true});

    const ids = dirtyCaseIds.size ? [...dirtyCaseIds] : [];
    ids.forEach(id => {
      batch.set(userRef.collection("cases").doc(id), {
        ...caseStates[id],
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, {merge: true});
    });

    if (settingsDirty && teacherMode) {
      batch.set(
        cloud.db.collection("classes").doc(cloud.classId).collection("settings").doc("caseAccess"),
        {
          locks: settings.locks,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        },
        {merge: true}
      );
    }

    await batch.commit();
    dirtyCaseIds.clear();
    settingsDirty = false;
    setSaveStatus("Saved to Google account");
  } catch (error) {
    console.error("Cloud save failed:", error);
    setSaveStatus("Saved on device · Google sync pending");
  }
}

function firebaseIsConfigured() {
  const config = window.MRDHQ_FIREBASE_CONFIG || {};
  return Boolean(
    window.firebase &&
    config.apiKey &&
    config.projectId &&
    !String(config.apiKey).includes("REPLACE")
  );
}

async function loadCloudState(user) {
  if (!cloud.db) return;
  try {
    setSaveStatus("Loading Google account…");
    const userRef = cloud.db.collection("businessCanvasUsers").doc(user.uid);
    const [profileSnap, projectSnap, caseSnaps, locksSnap] = await Promise.all([
      userRef.get(),
      userRef.collection("projects").doc("master").get(),
      userRef.collection("cases").get(),
      cloud.db.collection("classes").doc(cloud.classId).collection("settings").doc("caseAccess").get()
    ]);

    const cloudProfile = profileSnap.exists ? profileSnap.data() : {};
    profile = {
      name: cloudProfile.name || user.displayName || profile?.name || "Student",
      period: cloudProfile.period || profile?.period || "AP Business",
      email: user.email || cloudProfile.email || ""
    };

    if (projectSnap.exists && projectSnap.data().canvas) {
      canvasState = {...defaultCanvasState(), ...projectSnap.data().canvas};
    }

    caseSnaps.forEach(documentSnapshot => {
      const record = CASE_BY_ID[documentSnapshot.id];
      if (record) caseStates[record.id] = normalizeCaseState(record, documentSnapshot.data());
    });

    if (locksSnap.exists && locksSnap.data().locks) {
      settings.locks = {...settings.locks, ...locksSnap.data().locks};
    }

    saveLocal();
    applyProfile(profile);
    refreshAll();
    setSaveStatus("Loaded from Google account");
  } catch (error) {
    console.error("Cloud load failed:", error);
    setSaveStatus("Using saved device copy");
  }
}

function configureTeacherMode() {
  if (!cloud.enabled || !cloud.user) {
    teacherMode = true;
  } else {
    teacherMode = cloud.teacherEmails.includes(String(cloud.user.email || "").toLowerCase());
  }
  const teacherNav = document.querySelector(".teacher-nav");
  if (teacherNav) teacherNav.hidden = !teacherMode;
}

function initializeFirebase() {
  if (!firebaseIsConfigured()) {
    cloud.ready = true;
    configureTeacherMode();
    setSaveStatus("Saved on this device");
    if (!profile) openAuth();
    return;
  }

  try {
    firebase.initializeApp(window.MRDHQ_FIREBASE_CONFIG);
    cloud.auth = firebase.auth();
    cloud.db = firebase.firestore();
    cloud.enabled = true;

    cloud.auth.onAuthStateChanged(async user => {
      cloud.user = user;
      cloud.ready = true;
      configureTeacherMode();
      if (user) {
        const periodField = document.getElementById("demo-period");
        profile = {
          name: user.displayName || profile?.name || "Student",
          period: profile?.period || periodField?.value?.trim() || "AP Business",
          email: user.email || ""
        };
        applyProfile(profile);
        closeAuth();
        await loadCloudState(user);
      } else {
        setSaveStatus("Sign in to save to Google");
        if (!profile) openAuth();
      }
    });
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    cloud.enabled = false;
    cloud.ready = true;
    configureTeacherMode();
    if (!profile) openAuth();
  }
}

function applyProfile(userProfile) {
  if (!userProfile) return;
  const name = userProfile.name || "Student";
  const period = userProfile.period || "AP Business";
  const nameElement = document.getElementById("student-name");
  const periodElement = document.getElementById("student-period");
  const avatarElement = document.getElementById("student-avatar");
  if (nameElement) nameElement.textContent = name;
  if (periodElement) periodElement.textContent = period;
  if (avatarElement) avatarElement.textContent = initials(name);
}

function openAuth() {
  const gate = document.getElementById("auth-gate");
  gate?.classList.add("open");
  gate?.setAttribute("aria-hidden", "false");
}

function closeAuth() {
  const gate = document.getElementById("auth-gate");
  gate?.classList.remove("open");
  gate?.setAttribute("aria-hidden", "true");
}

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2300);
}

function renderCanvas(targetId, compact = false) {
  const target = document.getElementById(targetId);
  if (!target) return;
  target.innerHTML = "";

  sectionOrder.forEach(key => {
    const definition = sectionData[key];
    const state = canvasState[key];
    const card = document.createElement("article");
    card.className = `canvas-card ${definition.className}`;
    const source = state.guided || definition.summary;
    const limit = compact ? 220 : 520;
    const displayText = escapeHtml(source.slice(0, limit)).replace(/\n/g, "<br>");
    card.innerHTML = `
      <div class="canvas-title-row">
        <span class="canvas-title">${definition.title}</span>
        <span class="canvas-icon">${definition.icon}</span>
      </div>
      <div class="canvas-summary">${displayText}</div>
      <div class="canvas-meta">
        <span>${state.status === "empty" ? "Not started" : state.status === "complete" ? "Complete" : "Draft"}</span>
        <span class="mini-progress"><span style="width:${statusPercent(state.status)}%"></span></span>
      </div>
      <button aria-label="Open ${definition.title}" data-section="${key}"></button>
    `;
    target.appendChild(card);
  });

  target.querySelectorAll("[data-section]").forEach(button => {
    button.addEventListener("click", () => openWorkspace(button.dataset.section));
  });
}

function updateDashboardProgress() {
  const canvasPercent = Math.round(
    sectionOrder.reduce((sum, key) => sum + statusPercent(canvasState[key].status), 0) / sectionOrder.length
  );
  const submittedCount = CASES.filter(item => caseStates[item.id]?.submitted).length;
  const evidenceCount = CASES.reduce(
    (sum, item) => sum + Object.keys(caseStates[item.id]?.highlights || {}).length,
    0
  );

  const overallPercent = document.getElementById("overall-percent");
  const overallRing = document.getElementById("overall-ring");
  const progressCanvas = document.getElementById("progress-canvas");
  const progressCases = document.getElementById("progress-cases");
  const progressEvidence = document.getElementById("progress-evidence");
  const canvasWordCount = document.getElementById("canvas-word-count");

  if (overallPercent) overallPercent.textContent = `${canvasPercent}%`;
  if (overallRing) overallRing.style.setProperty("--p", canvasPercent);
  if (progressCanvas) progressCanvas.textContent = `${canvasPercent}%`;
  if (progressCases) progressCases.textContent = `${submittedCount}/${CASES.length}`;
  if (progressEvidence) progressEvidence.textContent = evidenceCount;
  if (canvasWordCount) {
    const words = sectionOrder.reduce((sum, key) => sum + wordCount(canvasState[key].guided), 0);
    canvasWordCount.textContent = `${words} words`;
  }
}

function openWorkspace(key) {
  activeSection = key;
  const definition = sectionData[key];
  const state = canvasState[key];

  document.getElementById("workspace-title").textContent = definition.title;
  document.getElementById("section-overview-text").textContent = definition.overview;
  document.getElementById("guided-label").textContent = definition.prompt;
  document.getElementById("section-checklist").innerHTML = definition.checklist
    .map(item => `<li>${escapeHtml(item)}</li>`)
    .join("");
  document.getElementById("section-example").textContent = definition.example;
  document.getElementById("guided-response").value = state.guided || "";
  document.getElementById("learn-response").value = state.learn || "";
  document.getElementById("hypothesis-response").value = state.hypothesis || "";
  document.getElementById("method-response").value = state.method || "";
  document.getElementById("evidence-response").value = state.evidence || "";
  document.getElementById("decision-response").value = state.decision || "";
  updateGuidedWordCount();

  const modal = document.getElementById("workspace-modal");
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
}

function closeWorkspace() {
  const modal = document.getElementById("workspace-modal");
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
}

function updateGuidedWordCount() {
  const response = document.getElementById("guided-response");
  const output = document.getElementById("guided-word-count");
  if (response && output) output.textContent = `${wordCount(response.value)} words`;
}

function saveWorkspace(status) {
  if (!activeSection) return;
  canvasState[activeSection] = {
    status,
    guided: document.getElementById("guided-response").value.trim(),
    learn: document.getElementById("learn-response").value.trim(),
    hypothesis: document.getElementById("hypothesis-response").value.trim(),
    method: document.getElementById("method-response").value.trim(),
    evidence: document.getElementById("evidence-response").value.trim(),
    decision: document.getElementById("decision-response").value.trim(),
    updatedAt: new Date().toISOString()
  };
  saveAll();
  refreshAll();
  closeWorkspace();
  showToast(status === "complete" ? "Section marked complete." : "Draft saved.");
}

function renderCanvasGuide() {
  const grid = document.getElementById("canvas-guide-grid");
  if (!grid) return;
  grid.innerHTML = sectionOrder.map(key => {
    const definition = sectionData[key];
    return `
      <article class="guide-card ${definition.className}">
        <div class="guide-card-header"><h3>${definition.title}</h3><span>${definition.icon}</span></div>
        <p>${definition.overview}</p>
        <details><summary>Required elements</summary><ul>${definition.checklist.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul></details>
        <details><summary>Strong example</summary><p>${escapeHtml(definition.example)}</p></details>
      </article>
    `;
  }).join("");
}

function renderUnitDeliverables(unit = 1) {
  const record = unitDeliverables[unit];
  const panel = document.getElementById("unit-deliverables-panel");
  if (!record || !panel) return;
  panel.innerHTML = `
    <h3>${record.title}</h3>
    <p>${record.description}</p>
    <div class="deliverables-grid">
      ${Object.entries(record.groups).map(([group, items]) => `
        <div class="deliverable-group"><strong>${group}</strong><ul>${items.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>
      `).join("")}
    </div>
    <p class="asterisk-note">* Indicates a canvas element requiring hypothesis testing.</p>
  `;
}

function getCaseLibrary() {
  return CASES.map(caseRecord => ({
    ...caseRecord,
    locked:
      settings.locks[caseRecord.id] !== undefined
        ? settings.locks[caseRecord.id]
        : caseRecord.locked
  }));
}

function caseProgressLabel(caseRecord) {
  const state = caseStates[caseRecord.id];
  if (state?.submitted) return "Submitted";
  const filled = (state?.answers || []).filter(answer => answer.trim()).length;
  if (filled || Object.keys(state?.highlights || {}).length) return "In progress";
  return "Not started";
}

function caseCardHtml(caseRecord) {
  const locked = caseRecord.locked;
  const stateLabel = caseProgressLabel(caseRecord);
  return `
    <article class="library-case-card ${locked ? "locked" : ""}">
      <div class="case-card-sequence">
        <span>${caseRecord.topic}</span>
        <span>${caseRecord.days}</span>
      </div>
      <span class="case-number">Official AP case · ${String(caseRecord.order).padStart(2, "0")}</span>
      <h3>${caseRecord.libraryTitle}</h3>
      <p>${caseRecord.description}</p>
      <div class="case-course-meta"><span>${caseRecord.task}</span><span>${stateLabel}</span></div>
      <div class="case-tags">${caseRecord.tags.map(tag => `<span>${tag}</span>`).join("")}</div>
      <div class="library-case-actions">
        <button class="button ${locked ? "button-secondary" : "button-primary"} open-case-btn" data-case-id="${caseRecord.id}" ${locked ? "disabled" : ""}>
          ${locked ? "Locked" : stateLabel === "Not started" ? "Open case" : "Continue case"}
        </button>
        ${!locked ? `<a class="case-download-link" href="${caseRecord.pdf}" download>Download PDF</a>` : ""}
        ${teacherMode ? `<button class="lock-control" data-lock-id="${caseRecord.id}">${locked ? "Unlock" : "Lock"}</button>` : ""}
      </div>
    </article>
  `;
}

function renderProjectResources() {
  const grid = document.getElementById("project-resource-grid");
  if (!grid) return;
  grid.innerHTML = PROJECT_RESOURCES.length
    ? PROJECT_RESOURCES.map(resource => `
        <article class="project-resource-card">
          <div><span>${escapeHtml(resource.type || "File")}</span><h3>${escapeHtml(resource.title)}</h3><p>${escapeHtml(resource.description || "")}</p></div>
          <a class="button button-secondary" href="${escapeHtml(resource.file)}" download>Download ${escapeHtml(resource.type || "file")}</a>
        </article>
      `).join("")
    : `<div class="empty-library">No additional project resources are loaded.</div>`;
}

function renderCaseLibrary() {
  const search = (document.getElementById("case-search")?.value || "").toLowerCase();
  const filter = document.getElementById("case-filter")?.value || "all";
  const cases = getCaseLibrary();
  const visible = cases.filter(caseRecord => {
    const haystack = `${caseRecord.title} ${caseRecord.libraryTitle} ${caseRecord.description} ${caseRecord.topic} ${caseRecord.task} ${caseRecord.tags.join(" ")}`.toLowerCase();
    return (!search || haystack.includes(search)) && (filter === "all" || caseRecord.tags.includes(filter));
  });

  const unlockedCount = document.getElementById("unlocked-count");
  if (unlockedCount) unlockedCount.textContent = cases.filter(item => !item.locked).length;

  const grid = document.getElementById("case-library-grid");
  if (!grid) return;

  const projectGroups = [...new Set(visible.map(item => item.project))];
  grid.innerHTML = projectGroups.map(project => {
    const projectCases = visible.filter(item => item.project === project);
    return `
      <section class="case-project-group">
        <div class="case-project-heading">
          <div><p class="eyebrow">Instructional sequence</p><h2>${project}</h2></div>
          <span>${projectCases.length} ${projectCases.length === 1 ? "case" : "cases"}</span>
        </div>
        <div class="case-library-grid">${projectCases.map(caseCardHtml).join("")}</div>
      </section>
    `;
  }).join("") || `<div class="empty-library">No cases match the current search or filter.</div>`;

  grid.querySelectorAll(".open-case-btn").forEach(button => {
    button.addEventListener("click", () => openCase(button.dataset.caseId));
  });
  grid.querySelectorAll(".lock-control").forEach(button => {
    button.addEventListener("click", () => toggleCaseLock(button.dataset.lockId));
  });
  renderProjectResources();
}

function openCase(id) {
  const caseRecord = getCaseLibrary().find(item => item.id === id);
  if (!caseRecord || caseRecord.locked) {
    showToast("This case is locked.");
    return;
  }
  currentCaseId = id;
  sessionStorage.setItem("mrdhqCurrentCase", id);
  lastFocusedAnswer = 0;
  switchView("case");
  switchCaseTab("questions");
}

function toggleCaseLock(id) {
  if (!teacherMode) return;
  const current = getCaseLibrary().find(item => item.id === id);
  settings.locks[id] = !current.locked;
  settingsDirty = true;
  saveAll();
  renderCaseLibrary();
  renderProjectResources();
  renderTeacherControls();
  showToast(settings.locks[id] ? "Case locked." : "Case unlocked.");
}

function splitSentences(text = "") {
  const protectedText = String(text)
    .replace(/U\.S\./g, "U§S§")
    .replace(/U\.K\./g, "U§K§")
    .replace(/e\.g\./gi, "e§g§")
    .replace(/i\.e\./gi, "i§e§")
    .replace(/Mr\./g, "Mr§")
    .replace(/Mrs\./g, "Mrs§")
    .replace(/Dr\./g, "Dr§")
    .replace(/Inc\./g, "Inc§")
    .replace(/Co\./g, "Co§");

  const matches = protectedText.match(/[^.!?]+(?:[.!?]+["”’']?|$)/g) || [protectedText];
  return matches
    .map(sentence => sentence.trim())
    .filter(Boolean)
    .map(sentence => sentence
      .replace(/U§S§/g, "U.S.")
      .replace(/U§K§/g, "U.K.")
      .replace(/e§g§/gi, "e.g.")
      .replace(/i§e§/gi, "i.e.")
      .replace(/Mr§/g, "Mr.")
      .replace(/Mrs§/g, "Mrs.")
      .replace(/Dr§/g, "Dr.")
      .replace(/Inc§/g, "Inc.")
      .replace(/Co§/g, "Co."));
}

function sentenceText(caseRecord, sentenceId) {
  const [itemIndexRaw, sentenceIndexRaw] = sentenceId.split(":");
  const item = caseRecord.content[Number(itemIndexRaw)];
  if (!item || item.kind !== "paragraph") return "";
  return splitSentences(item.text)[Number(sentenceIndexRaw)] || "";
}

function makeSentenceSpan(caseRecord, itemIndex, sentenceIndex, text) {
  const state = currentCaseState();
  const id = `${itemIndex}:${sentenceIndex}`;
  const span = document.createElement("span");
  span.className = "case-sentence";
  span.dataset.sentenceId = id;
  span.textContent = text;
  const category = state.highlights[id];
  if (category) span.classList.add(`hl-${category}`);
  span.addEventListener("click", () => toggleHighlight(id));
  return span;
}

function renderCaseResources(caseRecord) {
  const bar = document.getElementById("case-resource-bar");
  if (!bar) return;
  const resources = Array.isArray(caseRecord.resources) ? caseRecord.resources : [];
  if (!resources.length) {
    bar.hidden = true;
    bar.innerHTML = "";
    return;
  }
  bar.hidden = false;
  bar.innerHTML = `<div><strong>Case files</strong><span>Download the student handout or working files when your teacher assigns them. Digital reading and highlighting remain optional.</span></div><div class="case-resource-links">${resources.map(resource => `<a class="button button-secondary" href="${escapeHtml(resource.file)}" download>${escapeHtml(resource.label)}</a>`).join("")}</div>`;
}

function renderCurrentCase() {
  const caseRecord = currentCase();
  if (!caseRecord) return;
  const state = currentCaseState();

  document.getElementById("case-topic-label").textContent = `Official AP Business case · ${caseRecord.topic}`;
  document.getElementById("case-title").textContent = caseRecord.title;
  document.getElementById("case-key-question").textContent = `Key question: ${caseRecord.keyQuestion}`;
  document.getElementById("case-project-label").textContent = caseRecord.project;
  document.getElementById("case-task-label").textContent = caseRecord.task;
  document.getElementById("case-days-label").textContent = caseRecord.days;
  document.getElementById("case-pdf-link").href = caseRecord.pdf;
  document.getElementById("case-pdf-download").href = caseRecord.pdf;
  document.getElementById("case-pdf-download").setAttribute("download", caseRecord.pdf);
  document.getElementById("case-pdf-open-secondary").href = caseRecord.pdf;
  document.getElementById("case-pdf-download-secondary").href = caseRecord.pdf;
  document.getElementById("case-pdf-download-secondary").setAttribute("download", caseRecord.pdf);
  document.getElementById("case-pdf-frame").src = `${caseRecord.pdf}#toolbar=1&navpanes=0`;
  renderCaseResources(caseRecord);
  document.getElementById("pdf-panel-title").textContent = `${caseRecord.title} · Original PDF`;
  document.getElementById("submit-case-btn").textContent = `Submit ${caseRecord.title} case`;
  document.getElementById("case-submit-help").textContent = `All ${caseRecord.questions.length} required responses are needed before submission.`;
  const questionNote = document.getElementById("official-question-note");
  if (questionNote) questionNote.textContent = caseRecord.questionSource || "The questions below are preserved from the provided teaching materials. Add specific evidence before explaining your reasoning.";

  const article = document.getElementById("official-case-text");
  article.innerHTML = "";
  const kicker = document.createElement("div");
  kicker.className = "case-kicker";
  kicker.textContent = `${caseRecord.topic} · Official case text`;
  article.appendChild(kicker);
  const heading = document.createElement("h1");
  heading.textContent = caseRecord.title;
  article.appendChild(heading);

  caseRecord.content.forEach((item, itemIndex) => {
    if (item.kind === "heading") {
      const sectionHeading = document.createElement("h2");
      sectionHeading.textContent = item.text;
      article.appendChild(sectionHeading);
      return;
    }
    const paragraph = document.createElement("p");
    paragraph.dataset.casePage = item.page;
    splitSentences(item.text).forEach((sentence, sentenceIndex, allSentences) => {
      paragraph.appendChild(makeSentenceSpan(caseRecord, itemIndex, sentenceIndex, sentence));
      if (sentenceIndex < allSentences.length - 1) paragraph.appendChild(document.createTextNode(" "));
    });
    article.appendChild(paragraph);
  });

  renderEvidenceNotebook();
  renderOfficialQuestions();
  renderCaseMap();
  renderExtensions();
  updateQuestionProgress();
  if (state.submitted) document.getElementById("case-submit-status").textContent = "Submitted";
}

function allHighlightedEvidence(caseRecord = currentCase()) {
  if (!caseRecord) return [];
  const state = caseStates[caseRecord.id];
  return Object.entries(state.highlights || {}).map(([id, category]) => ({
    id,
    category,
    text: sentenceText(caseRecord, id)
  })).filter(item => item.text);
}

function toggleHighlight(id) {
  const caseRecord = currentCase();
  const state = currentCaseState();
  if (activeHighlightCategory === "remove") {
    delete state.highlights[id];
  } else {
    state.highlights[id] = activeHighlightCategory;
  }
  state.updatedAt = new Date().toISOString();
  saveAll({caseId: caseRecord.id});
  renderCurrentCase();
}

function renderEvidenceNotebook() {
  const caseRecord = currentCase();
  const evidence = allHighlightedEvidence(caseRecord);
  const count = document.getElementById("evidence-count");
  const list = document.getElementById("evidence-list");
  if (count) count.textContent = evidence.length;
  if (!list) return;

  list.innerHTML = evidence.length
    ? evidence.map(item => `
        <article class="evidence-item">
          <span class="evidence-tag">${item.category}</span>
          <p>“${escapeHtml(item.text)}”</p>
          <button data-use-evidence="${item.id}">Use in an answer</button>
        </article>
      `).join("")
    : `<div class="empty-evidence">Optional: choose a color and click useful sentences when you want a digital evidence notebook.</div>`;

  list.querySelectorAll("[data-use-evidence]").forEach(button => {
    button.addEventListener("click", () => useEvidence(button.dataset.useEvidence));
  });
}

function useEvidence(id) {
  const caseRecord = currentCase();
  const quote = sentenceText(caseRecord, id);
  switchCaseTab("questions");
  const textarea = document.querySelector(`[data-question-index="${lastFocusedAnswer}"]`);
  if (!textarea) return;
  const prefix = textarea.value.trim() ? "\n\n" : "";
  textarea.value += `${prefix}Case evidence: “${quote}”\nReasoning: `;
  textarea.focus();
  currentCaseState().answers[lastFocusedAnswer] = textarea.value;
  currentCaseState().submitted = false;
  saveAll({caseId: caseRecord.id});
  updateQuestionProgress();
  showToast("Evidence added to the active response.");
}

function renderCaseMap() {
  const groups = Object.fromEntries(sectionOrder.map(key => [key, []]));
  allHighlightedEvidence().forEach(item => {
    if (groups[item.category]) groups[item.category].push(item.text);
  });
  const map = document.getElementById("case-canvas-map");
  if (!map) return;
  map.innerHTML = sectionOrder.map(key => `
    <article class="map-card ${key}">
      <h3>${sectionData[key].title}</h3>
      ${
        groups[key].length
          ? `<ul>${groups[key].map(text => `<li>${escapeHtml(text)}</li>`).join("")}</ul>`
          : `<p class="map-empty">No evidence highlighted for this section yet.</p>`
      }
    </article>
  `).join("");
}

function renderOfficialQuestions() {
  const caseRecord = currentCase();
  if (!caseRecord) return;
  const state = currentCaseState();
  const list = document.getElementById("official-question-list");
  if (!list) return;

  list.innerHTML = caseRecord.questions.map((question, index) => `
    <article class="question-card">
      <div class="question-card-header">
        <span class="question-number">${index + 1}</span>
        <div>
          <span class="question-type">${escapeHtml(question.type)}</span>
          <h3>${escapeHtml(question.text)}</h3>
        </div>
      </div>
      <textarea data-question-index="${index}" placeholder="Answer the question directly, add specific case evidence, and explain the connection.">${escapeHtml(state.answers[index] || "")}</textarea>
      <div class="answer-tools">
        <span class="question-word-count">${wordCount(state.answers[index] || "")} words</span>
        <button data-show-evidence="${index}">Use optional highlighted evidence ↑</button>
      </div>
    </article>
  `).join("");

  list.querySelectorAll("textarea").forEach(textarea => {
    textarea.addEventListener("focus", () => {
      lastFocusedAnswer = Number(textarea.dataset.questionIndex);
    });
    textarea.addEventListener("input", () => {
      const index = Number(textarea.dataset.questionIndex);
      state.answers[index] = textarea.value;
      state.submitted = false;
      state.updatedAt = new Date().toISOString();
      textarea.closest(".question-card").querySelector(".question-word-count").textContent = `${wordCount(textarea.value)} words`;
      saveAll({caseId: caseRecord.id});
      updateQuestionProgress();
    });
  });

  list.querySelectorAll("[data-show-evidence]").forEach(button => {
    button.addEventListener("click", () => {
      lastFocusedAnswer = Number(button.dataset.showEvidence);
      switchCaseTab("read");
      showToast("Optional tool: highlight a sentence, then click “Use in an answer” beside the saved quote.");
    });
  });
}

function updateQuestionProgress() {
  const caseRecord = currentCase();
  if (!caseRecord) return;
  const state = currentCaseState();
  const filled = state.answers.filter(answer => answer.trim()).length;
  document.getElementById("question-progress-chip").textContent = `${filled}/${caseRecord.questions.length}`;
  document.getElementById("case-submit-status").textContent =
    state.submitted ? "Submitted" : filled === caseRecord.questions.length ? "Ready to submit" : "Draft in progress";
}

function saveCaseDraft() {
  const caseRecord = currentCase();
  if (!caseRecord) return;
  const state = currentCaseState();
  document.querySelectorAll("[data-question-index]").forEach(textarea => {
    state.answers[Number(textarea.dataset.questionIndex)] = textarea.value;
  });
  state.updatedAt = new Date().toISOString();
  saveAll({caseId: caseRecord.id});
  updateQuestionProgress();
}

function submitCase() {
  const caseRecord = currentCase();
  const state = currentCaseState();
  saveCaseDraft();
  if (state.answers.filter(answer => answer.trim()).length < caseRecord.questions.length) {
    showToast(`Complete all ${caseRecord.questions.length} required questions before submitting.`);
    return;
  }
  state.submitted = true;
  state.submittedAt = new Date().toISOString();
  saveAll({caseId: caseRecord.id});
  updateQuestionProgress();
  renderProgress();
  renderCaseLibrary();
  showToast(`${caseRecord.title} case submitted.`);
}

function renderExtensions() {
  const caseRecord = currentCase();
  const state = currentCaseState();
  const grid = document.getElementById("case-extension-grid");
  if (!grid) return;
  grid.innerHTML = caseRecord.extensions.map((extension, index) => `
    <article>
      <span class="extension-type">${escapeHtml(extension.type)}</span>
      <h3>${escapeHtml(extension.title)}</h3>
      <p>${escapeHtml(extension.prompt)}</p>
      <textarea data-extension-index="${index}" placeholder="Claim + evidence + reasoning...">${escapeHtml(state.extensions[index] || "")}</textarea>
    </article>
  `).join("");

  grid.querySelectorAll("[data-extension-index]").forEach(textarea => {
    textarea.addEventListener("input", () => {
      state.extensions[textarea.dataset.extensionIndex] = textarea.value;
      state.updatedAt = new Date().toISOString();
      saveAll({caseId: caseRecord.id});
    });
  });
}

function switchCaseTab(tab) {
  document.querySelectorAll(".case-tab").forEach(button => {
    button.classList.toggle("active", button.dataset.caseTab === tab);
  });
  document.querySelectorAll(".case-panel").forEach(panel => panel.classList.remove("active"));
  document.getElementById(`case-${tab}`)?.classList.add("active");
  if (tab === "map") renderCaseMap();
}

function renderCaseAudit() {
  const summary = document.getElementById("case-audit-summary");
  const list = document.getElementById("case-audit-list");
  if (summary) {
    summary.innerHTML = `<span><strong>${CASE_AUDIT.includedCount}</strong> loaded</span><span><strong>${CASE_AUDIT.expectedCount}</strong> named in guidance</span><span class="${CASE_AUDIT.missingCount ? "audit-warning" : "audit-complete"}"><strong>${CASE_AUDIT.missingCount}</strong> files still needed</span>`;
  }
  if (list) {
    list.innerHTML = CASE_AUDIT.missingCount
      ? CASE_AUDIT.missing.map(item => `<div class="audit-missing-row"><div><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.project)} · ${escapeHtml(item.sequence)}</span></div><small>${escapeHtml(item.reason)}</small></div>`).join("")
      : `<div class="audit-complete-message">All named case files are loaded.</div>`;
  }
}

function renderTeacherControls() {
  const controls = document.getElementById("teacher-case-controls");
  renderCaseAudit();
  if (!controls) return;
  controls.innerHTML = getCaseLibrary().map(caseRecord => `
    <div class="teacher-case-row">
      <div>
        <strong>${caseRecord.title}</strong>
        <span>${caseRecord.topic} · ${caseRecord.days} · ${caseRecord.locked ? "Locked" : "Available"}</span>
      </div>
      <label class="switch">
        <input type="checkbox" data-teacher-lock="${caseRecord.id}" ${!caseRecord.locked ? "checked" : ""}>
        <span></span>
      </label>
    </div>
  `).join("");

  controls.querySelectorAll("[data-teacher-lock]").forEach(input => {
    input.addEventListener("change", () => {
      settings.locks[input.dataset.teacherLock] = !input.checked;
      settingsDirty = true;
      saveAll();
      renderTeacherControls();
      renderCaseLibrary();
    });
  });
}

function renderProgress() {
  const canvasList = document.getElementById("canvas-progress-list");
  if (canvasList) {
    canvasList.innerHTML = sectionOrder.map(key => {
      const state = canvasState[key];
      return `
        <div class="progress-row ${state.status === "complete" ? "complete" : ""}">
          <span class="progress-dot">${state.status === "complete" ? "✓" : state.status === "draft" ? "½" : "○"}</span>
          <div><strong>${sectionData[key].title}</strong><span>${state.status === "empty" ? "Not started" : state.status === "draft" ? "Draft saved" : "Marked complete"}</span></div>
        </div>
      `;
    }).join("");
  }

  const caseList = document.getElementById("case-progress-list");
  if (caseList) {
    caseList.innerHTML = getCaseLibrary().map(caseRecord => {
      const state = caseStates[caseRecord.id];
      const label = caseProgressLabel(caseRecord);
      return `
        <div class="progress-row ${state.submitted ? "complete" : ""}">
          <span class="progress-dot">${state.submitted ? "✓" : label === "In progress" ? "½" : caseRecord.locked ? "🔒" : "○"}</span>
          <div><strong>${caseRecord.title}</strong><span>${caseRecord.topic} · ${caseRecord.days} · ${caseRecord.locked ? "Locked" : label}</span></div>
        </div>
      `;
    }).join("");
  }

  updateDashboardProgress();
}

function switchView(view) {
  document.querySelectorAll(".view").forEach(element => element.classList.remove("active"));
  const target = document.getElementById(`${view}-view`);
  if (!target) return;
  target.classList.add("active");

  document.querySelectorAll(".nav-item[data-view]").forEach(item => {
    item.classList.toggle("active", item.dataset.view === view);
  });

  const caseRecord = currentCase();
  const titles = {
    dashboard: "Business Canvas Dashboard",
    canvas: "My Business Canvas",
    canvas101: "Business Canvas 101",
    caseguide: "Case Study Guide",
    hypothesisguide: "Hypothesis Testing Guide",
    library: "Case Library",
    case: caseRecord ? `${caseRecord.title} Case Workspace` : "Case Workspace",
    progress: "Progress",
    teacher: "Teacher Tools"
  };
  document.getElementById("page-title").textContent = titles[view] || "Business Canvas Studio";

  if (view === "case") renderCurrentCase();
  if (view === "library") renderCaseLibrary();
  if (view === "progress") renderProgress();
  if (view === "teacher") renderTeacherControls();

  window.scrollTo({top: 0, behavior: "smooth"});
}

function refreshAll() {
  renderCanvas("canvas-mini", true);
  renderCanvas("canvas-full", false);
  renderCanvasGuide();
  renderUnitDeliverables(Number(document.querySelector(".unit-tab.active")?.dataset.unit || 1));
  renderCaseLibrary();
  renderTeacherControls();
  renderProgress();
  updateDashboardProgress();
  if (document.getElementById("case-view")?.classList.contains("active")) renderCurrentCase();
}

document.querySelectorAll(".nav-item[data-view]").forEach(button => {
  button.addEventListener("click", () => switchView(button.dataset.view));
});

document.querySelectorAll("[data-open-view]").forEach(button => {
  button.addEventListener("click", () => switchView(button.dataset.openView));
});

document.getElementById("preview-btn")?.addEventListener("click", () => switchView("canvas"));

document.getElementById("save-all-btn")?.addEventListener("click", () => {
  saveCaseDraft();
  saveAll({allCases: true});
  showToast(cloud.enabled && cloud.user ? "Saving all progress to your Google account." : "All progress saved on this device.");
});

document.getElementById("close-modal")?.addEventListener("click", closeWorkspace);
document.getElementById("workspace-modal")?.addEventListener("click", event => {
  if (event.target.id === "workspace-modal") closeWorkspace();
});
document.getElementById("save-draft-btn")?.addEventListener("click", () => saveWorkspace("draft"));
document.getElementById("mark-complete-btn")?.addEventListener("click", () => saveWorkspace("complete"));
document.getElementById("guided-response")?.addEventListener("input", updateGuidedWordCount);

document.querySelectorAll(".unit-tab").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".unit-tab").forEach(item => item.classList.remove("active"));
    button.classList.add("active");
    renderUnitDeliverables(Number(button.dataset.unit));
  });
});

document.getElementById("toggle-graphic-btn")?.addEventListener("click", () => {
  const image = document.getElementById("canvas-reference-image");
  image.classList.toggle("expanded");
  document.getElementById("toggle-graphic-btn").textContent = image.classList.contains("expanded") ? "Collapse graphic" : "Expand graphic";
});

document.getElementById("case-search")?.addEventListener("input", renderCaseLibrary);
document.getElementById("case-filter")?.addEventListener("change", renderCaseLibrary);

document.querySelectorAll(".case-tab").forEach(button => {
  button.addEventListener("click", () => switchCaseTab(button.dataset.caseTab));
});

document.querySelectorAll(".highlight-tool").forEach(button => {
  button.addEventListener("click", () => {
    activeHighlightCategory = button.dataset.highlightCategory;
    document.querySelectorAll(".highlight-tool").forEach(item => item.classList.remove("active"));
    button.classList.add("active");
  });
});

document.getElementById("save-case-draft-btn")?.addEventListener("click", () => {
  saveCaseDraft();
  showToast("Case draft saved.");
});

document.getElementById("submit-case-btn")?.addEventListener("click", submitCase);

document.getElementById("save-extensions-btn")?.addEventListener("click", () => {
  const caseRecord = currentCase();
  const state = currentCaseState();
  document.querySelectorAll("[data-extension-index]").forEach(textarea => {
    state.extensions[textarea.dataset.extensionIndex] = textarea.value;
  });
  saveAll({caseId: caseRecord.id});
  showToast("Extension responses saved.");
});

document.getElementById("reset-demo-btn")?.addEventListener("click", () => {
  if (!confirm("Reset all local demo progress?")) return;
  [STORAGE.profile, STORAGE.canvas, STORAGE.cases, STORAGE.settings].forEach(key => localStorage.removeItem(key));
  location.reload();
});

document.getElementById("demo-login-btn")?.addEventListener("click", () => {
  profile = {
    name: document.getElementById("demo-name").value.trim() || "Student",
    period: document.getElementById("demo-period").value.trim() || "AP Business"
  };
  saveLocal();
  applyProfile(profile);
  closeAuth();
  setSaveStatus("Saved on this device");
  showToast("Signed in to the demo workspace.");
});

document.getElementById("google-login-btn")?.addEventListener("click", async () => {
  if (!cloud.enabled || !cloud.auth) {
    showToast("Add your Firebase configuration to activate Google sign-in.");
    return;
  }
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({prompt: "select_account"});
    await cloud.auth.signInWithPopup(provider);
  } catch (error) {
    console.error("Google sign-in failed:", error);
    showToast("Google sign-in did not complete.");
  }
});

document.getElementById("logout-btn")?.addEventListener("click", async () => {
  if (cloud.enabled && cloud.auth && cloud.user) {
    await cloud.auth.signOut();
  }
  profile = null;
  localStorage.removeItem(STORAGE.profile);
  openAuth();
});

const mobileNavToggle = document.getElementById("mobile-nav-toggle");
mobileNavToggle?.addEventListener("click", () => {
  const sidebar = document.querySelector(".sidebar");
  const isOpen = sidebar.classList.toggle("mobile-open");
  mobileNavToggle.setAttribute("aria-expanded", String(isOpen));
  mobileNavToggle.textContent = isOpen ? "Close" : "Menu";
});

document.querySelectorAll(".nav-item[data-view], .brand-home").forEach(item => {
  item.addEventListener("click", () => {
    const sidebar = document.querySelector(".sidebar");
    if (window.innerWidth <= 900 && sidebar.classList.contains("mobile-open")) {
      sidebar.classList.remove("mobile-open");
      mobileNavToggle?.setAttribute("aria-expanded", "false");
      if (mobileNavToggle) mobileNavToggle.textContent = "Menu";
    }
  });
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeWorkspace();
});

window.addEventListener("beforeunload", () => {
  saveLocal();
});

applyProfile(profile);
refreshAll();
if (!profile) openAuth();
initializeFirebase();

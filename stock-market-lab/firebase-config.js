/*
  Stock Market Lab intentionally uses its OWN Firebase project.
  Do not point this file at mrdhq-business-canvas.
  Canvas Studio and Stock Market Lab must not share Authentication, Firestore,
  Storage, Functions, rules, or student records.
*/
window.STOCK_LAB_FIREBASE_CONFIG = {
  apiKey: "REPLACE_WITH_STOCK_LAB_API_KEY",
  authDomain: "REPLACE_WITH_STOCK_LAB_AUTH_DOMAIN",
  projectId: "REPLACE_WITH_STOCK_LAB_PROJECT_ID",
  storageBucket: "REPLACE_WITH_STOCK_LAB_STORAGE_BUCKET",
  messagingSenderId: "REPLACE_WITH_STOCK_LAB_SENDER_ID",
  appId: "REPLACE_WITH_STOCK_LAB_APP_ID"
};

window.STOCK_LAB_SETTINGS = {
  startingCapital: 15000,
  allocationPerIndustry: 1500,
  teacherEmails: ["skyler.dipasquale@casdonline.org"],
  classOptions: ["AP Business 1","AP Business 4","Personal Finance","Business 101"]
};
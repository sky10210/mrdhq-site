/*
  MRDHQ Business Canvas Studio — Firebase setup

  1. Create a Firebase web app.
  2. Enable Authentication > Google.
  3. Create a Firestore database.
  4. Add mrdhq.com and www.mrdhq.com to Authentication > Settings > Authorized domains.
  5. Replace the values below with the web-app configuration Firebase provides.

  Firebase's web configuration is designed to be included in client code. Security comes from
  Authentication and Firestore Security Rules, not from hiding this file.
*/
window.MRDHQ_FIREBASE_CONFIG = {
  apiKey: "REPLACE_WITH_FIREBASE_API_KEY",
  authDomain: "REPLACE_WITH_PROJECT_ID.firebaseapp.com",
  projectId: "REPLACE_WITH_PROJECT_ID",
  appId: "REPLACE_WITH_FIREBASE_APP_ID"
};

window.MRDHQ_APP_SETTINGS = {
  classId: "ap-business-main",
  teacherEmails: [
    "skyler.dipasquale@casdonline.org"
  ]
};

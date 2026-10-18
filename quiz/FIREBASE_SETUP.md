# Quiz Studio backend — deployment checklist

The website already has Firebase config for the **stock-market-lab** Google-authenticated
Firestore project. The Quiz Studio MVP is isolated in /quiz and may use a DIFFERENT
Firebase project. Recommended: separate Quiz Studio Firebase project for isolation.

## Provisioning steps requiring Firebase console access
1. Create project `mrdhq-quiz-studio` in Firebase Console (recommended).
2. Add a Web App, copy its public config values into `quiz/firebase-config.js`.
3. Enable Authentication → Sign-in methods: Google (hosts), Anonymous (guests).
4. Add `mrdhq.com` and any active preview host to authorized domains.
5. Create Firestore database in a region near the users.
6. MERGE the rule blocks in `firebase-rules.example.txt` into
   `firestore.rules` **inside** `service cloud.firestore { match /databases/{database}/documents { ... } }`.
   Do not replace existing rules in the Stock Market Lab project.
7. Test on staging: teacher Google sign-in; anonymous student devices; create lobby,
   join, start question, submit, refresh, reconnect; verify isolation from Stock Lab.
8. Before public release, deploy trusted server-side timer/scoring, room expiry and
   rate limiting, stronger query and field validation, quiz editor, and image audits.

## What exists now
- Standalone self-paced venue quiz, entry code VENUES, QR direct link.
- Firebase connection configuration placeholder and Firestore rules scaffold.
- NOT a verified Firebase deployment. No backend has been provisioned from GitHub.
- Do not promise actual multiplayer until live-room implementation and security testing.

## Security
Firebase web API keys are client-visible identifiers, not secret credentials.
Never commit service account keys, admin SDK private keys or Firebase refresh tokens.
Anonymous auth prevents requiring Google accounts for students but still has access rules.

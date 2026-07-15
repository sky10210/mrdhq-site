# MRDHQ Business Canvas Studio — Step 5

This build includes the yearlong master Business Canvas, Canvas 101, the Case Study Guide,
the Hypothesis Testing Guide, Google/Firebase-ready saving, and a sequenced case library with
17 uploaded case PDFs.

## Loaded case sequence

### Project 1 — Foundations of Market Entry
1. Bombas — Task 1, Days 1–7

### Project 2 — Marketing
2. Token of Trust — Task 1, Days 1–5
3. Gong cha — Task 2, Days 6–9
4. New Coke — Task 3, Days 10–16
5. siggi’s Icelandic Skyr — Task 4, Days 17–21
6. Sega of America — Task 5, Days 22–24
7. Stanley — Task 6, Days 25–27
8. Hestia Construction — Task 7, Days 28–31

### Project 3 — Business and Personal Finance Management
9. DK Coffee Lab, Part 1 — Task 4 / Topic 3.4, Days 10–12
10. DK Coffee Lab, Part 2 — Task 5 / Topic 3.5, Days 13–16
11. DK Coffee Lab, Part 3 — Task 7 / Topic 3.7, Days 23–26

The DK Part 3 workspace includes local downloads for:

- `dk-coffee-part-3-transactions-student.xlsx`
- `dk-coffee-part-3-transactions.pdf`

The spreadsheet is included unchanged from the uploaded student version.

### Project 4 — Leading and Measuring Success
12. Assort Health — Topic 4.1 / Task 1, Days 1–4
13. Canva — Topic 4.1 / Task 1, Days 1–4
14. BREAUX Capital — Topic 4.2 / Task 2, Days 5–7
15. ExpressionMed — Topic 4.3 / Task 3, Days 8–11
16. Crepes & Waffles — Topic 4.4 / Task 4, Days 12–17
17. Square Meal Feeds — Topic 4.4 / Task 4, Days 12–17

The Unit 4 order follows the Unit-at-a-Glance listing: Assort Health before Canva, and Crepes &
Waffles before Square Meal Feeds. Both pairs share a topic and suggested topic period range.

Bombas is unlocked by default. Teacher controls can lock or unlock every case. An unlocked case
can be opened online or downloaded as a local PDF.

## Case-sequence audit

The available Unit 1, Unit 2, Project 3, and Unit 4 guidance names 26 case files. Seventeen are
currently loaded. The following nine case PDFs and teaching notes have not yet been provided:

### Unit 1
- Incredible Health — Topic 1.2
- Corley Plumbing — Topic 1.3
- Malama ia Floral Design — Topic 1.4
- Beekeeper’s Daughter — Topic 1.5
- Pearson 1860 — Topic 1.8

### Project 3
- Hershey — Task 6 / Topic 3.6
- DCH Construction and Hauling — Task 7 / Topic 3.7
- AANE — Task 8 / Topic 3.8
- Yardley — Task 9 / Topic 3.9

Unit 2 and Unit 4 are complete based on the guidance available. Project 3 contains every uploaded
DK Coffee case, but it is not yet a complete Project 3 case set because the four cases above are
still missing.

The Teacher Tools page displays this same audit inside the site.

## Questions and source labeling

- Unit 1 Bombas, Unit 2, and Unit 4 cases use the six reading/practice questions from the
  provided teaching notes.
- The DK Coffee teaching notes/student-question files were not uploaded. The DK workspaces
  therefore use clearly labeled **MRDHQ guided questions**, not questions presented as official
  College Board wording.

## What saves for each student

Once Firebase is configured and the student signs in with Google, the app stores:

- Student profile and class period
- All six master-canvas sections
- Draft, complete, and revision states
- Every case response
- Sentence highlights and Canvas evidence categories
- MRDHQ extension responses
- Case submission status and timestamps

A browser copy is also kept as a temporary offline/fallback copy. Case data is keyed by case ID,
so the 17 cases remain separate within the same Google account.

## Firebase setup

1. Open the Firebase Console and create or select a project.
2. Add a **Web App**.
3. Open **Authentication → Sign-in method** and enable **Google**.
4. Open **Authentication → Settings → Authorized domains** and add:
   - `mrdhq.com`
   - `www.mrdhq.com`
   - your Cloudflare Pages preview domain, if used during testing
5. Create a **Cloud Firestore** database.
6. Copy the Firebase web configuration into `firebase-config.js`.
7. Deploy all files in this folder to the same MRDHQ route.

## Recommended Firestore rules

Replace the teacher email below if needed.

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() {
      return request.auth != null;
    }

    function isTeacher() {
      return signedIn()
        && request.auth.token.email == "skyler.dipasquale@casdonline.org";
    }

    match /businessCanvasUsers/{userId} {
      allow read: if signedIn() && (request.auth.uid == userId || isTeacher());
      allow create, update: if signedIn() && request.auth.uid == userId;

      match /{document=**} {
        allow read: if signedIn() && (request.auth.uid == userId || isTeacher());
        allow create, update: if signedIn() && request.auth.uid == userId;
      }
    }

    match /classes/{classId}/settings/{document} {
      allow read: if signedIn();
      allow write: if isTeacher();
    }
  }
}
```

## Data paths

```text
businessCanvasUsers/{googleUid}
businessCanvasUsers/{googleUid}/projects/master
businessCanvasUsers/{googleUid}/cases/{caseId}
classes/ap-business-main/settings/caseAccess
```

## Important deployment note

Opening `index.html` directly from the downloaded folder is appropriate for the local demo.
Google sign-in should be tested from an authorized HTTPS domain such as MRDHQ.com, not from a
`file://` address.

## Files

- `index.html` — interface and page structure
- `styles.css` — responsive MRDHQ design
- `app.js` — Canvas, case workflow, downloads, local save, Google auth, and Firestore sync
- `cases-data.js` — case sequence, questions, extracted case text, MRDHQ extensions, and audit
- `firebase-config.js` — Firebase and teacher/class configuration
- Official case PDFs — original page layouts, figures, tables, and references
- DK Coffee Part 3 spreadsheet and transactions handout — downloadable working files


# Step 6 additions

- Added five completed Canvas references to the bottom of the Case Study Guide. Each has a PDF preview and original DOCX/PPTX download.
- Added Incredible Health, Corley Plumbing, and Malama ia Floral Design in the Unit 1 instructional sequence.
- Added downloadable student handouts and PESTEL working files where supplied.
- Added Project 1 portfolio rubric and pitch self-reflection downloads.
- Reworked each case workspace so Digital Questions open first. Reading, sentence highlighting, Evidence Notebook, Canvas Map, and extensions are explicitly optional unless assigned.
- Firebase saving remains organized under the signed-in Google user and separate case IDs. Optional highlights save when used but are not required for submission.


# Step 7 additions

- Completed the full 26-case library named in the available Unit 1, Unit 2, Project 3, and Unit 4 guidance.
- Added The Beekeeper’s Daughter, Pearson 1860, Hershey, DCH Construction & Hauling, AANE, and Yardley in course order.
- Added a printable AP Business Annotation Guide to the Case Study Guide.
- Every case has a local PDF download. Beekeeper’s Daughter and Pearson 1860 also include their uploaded student handouts.
- Digital reading, highlighting, Evidence Notebook, Canvas Map, and extensions remain optional unless assigned.
- Firebase saving automatically supports the new cases because records are stored under `businessCanvasUsers/{googleUid}/cases/{caseId}`.

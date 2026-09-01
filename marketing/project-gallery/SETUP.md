# Marketing Project Gallery setup

This Project Gallery is intentionally separate from the Opening Bell / response backend.

## Existing resources
- Data spreadsheet ID: `1K2oqK982q5TgR07AGjQ_GP3UQB5pvjmQEPBrvtymF7Y`
- Gallery root Drive folder ID: `1IamflFbg7PijoznNNqeumD3hdsd8fZ4V`
- Backend source: `/apps-script/marketing-project-gallery-backend.gs`
- Student page: `/marketing/project-gallery/`
- Teacher page: `/marketing/project-gallery/teacher.html`

## Deploy the separate Apps Script backend
1. Create a new standalone Apps Script project named `MRDHQ Marketing Project Gallery Backend`.
2. Paste the contents of `/apps-script/marketing-project-gallery-backend.gs` into `Code.gs`.
3. In Apps Script, open Project Settings > Script Properties.
4. Add `TEACHER_KEY` with a private teacher-only value. Do not put this value in GitHub.
5. Optional: add `COMMENTS_REQUIRE_APPROVAL` with value `false` if comments should post immediately. If omitted, comments require teacher approval.
6. Deploy > New deployment > Web app.
7. Execute as: Me.
8. Who has access: Anyone.
9. Copy the `/exec` deployment URL.
10. Replace the empty URL in `/marketing/project-gallery/config.js` with that deployment URL.

## Intended workflow
`submissions` -> `closed` -> `voting` -> `results` -> `archived`

Late submissions remain available when `Allow Late Submissions` is enabled. By default late entries are not voting-eligible and therefore cannot change a completed ranking unless the teacher explicitly marks the entry eligible and reopens voting.

The backend blocks self-voting by matching normalized first name + last name + block. It also prevents duplicate votes for the same entry and enforces the teacher-selected maximum number of votes per student.

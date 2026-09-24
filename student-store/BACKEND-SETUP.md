# Student Store attendance backend — deployment checklist

The page at /student-store/ calls /api/student-store. Until this Worker is deployed, its forms deliberately show an error rather than saving locally.

1. Obtain district approval for collecting and retaining student identifiers and attendance information. Confirm permitted users, retention, access, and security requirements.
2. Create a Cloudflare D1 database, e.g. mrdhq-student-store, and bind it to this Worker as STORE_DB. Apply db/schema.sql to the database.
3. Deploy worker/student-store.js as a separate Worker. Set *secrets* TEACHER_PASSWORD to a strong, unique password (NOT cashs26), and LUNCH_PEPPER to a long random secret. Do not place either in GitHub or client-side source.
4. Assign the proxied route mrdhq.com/api/student-store* to the Worker. Keep the /student-store/ static site on GitHub Pages.
5. Open /student-store/, unlock its general classroom gate with cashs26, then unlock Teacher Controls with TEACHER_PASSWORD.
6. Add roster entries and dates/times, then verify published schedule in a separate browser. Test a supervised sign-in/sign-out with a test account.
7. Configure backups, teacher account lifecycle, monitoring, and retention before entering real student data.

Security notes:
- A lunch number is an identifier, not strong authentication. This implementation offers rate limiting and secret-peppered hashes, but shared/known lunch numbers can still be misused. For production, school Google login or a separate student PIN plus lunch number is strongly recommended.
- The shared schedule intentionally shows employee names and duties to anyone who knows the classroom portal password. Obtain school approval for this visibility.
- Teacher password is transmitted only over HTTPS and held in page memory, not browser storage. This is a starter backend; school SSO and an audit log are preferable.
- Attendance uses server UTC timestamps, and the shift date is interpreted in America/New_York. Teacher corrections and edits are not yet implemented; do not rely on this for payroll or official attendance.
- Rate limit rows need routine cleanup, e.g. delete old bucket keys in scheduled maintenance.

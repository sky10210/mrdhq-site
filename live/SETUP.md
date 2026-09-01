# Classroom Live deployment

This implementation uses **Cloudflare Pages Functions**, not the similarly named
standalone Workers. The existing Pages Git integration deploys `functions/api/live/[[path]].js`.
All browser requests use the current site's `/api/live/` endpoints. Static class
pages remain outside the Functions route.

## Pages settings

Encrypted secrets (already selected by the owner):

- `CF_REALTIME_APP_ID`: Realtime SFU application ID.
- `CF_REALTIME_APP_SECRET`: that application's API token.
- `LIVE_TEACHER_PASSCODE`: teacher unlock passcode.

Create a Cloudflare D1 database named `mrdhq-classroom-live`. In **Pages project
mrdhub-site → Settings → Bindings → Add → D1 database**, use variable name
**`LIVE_DB`** and select that database. Add the binding in Production. Preview may
use a separate database, or the same one: non-main branches get separate room keys.
Redeploy after adding bindings. No manual SQL is needed; the Functions create two
small tables on first use. No student names, media, or recordings are stored.

## Verify the actual hostname

The owner confirmed that mrdhub.com is attached to the Pages project, but HTTP
inspection found that it redirects to mrdhq.com. Do not assume that mrdhq.com is
served by this Pages project just because the static pages look the same.

First check `https://mrdhub-site.pages.dev/api/live/health`. It should report
`configured: true` and an empty `missing` list. Then check
`https://mrdhq.com/api/live/health`. If that returns a static page or 404, its
backend is a different deployment. Use the Pages hostname for initial tests and
resolve the domain routing before distributing the permanent classroom link.
Do not copy secrets blindly to the duplicate Workers.

## Classroom check

1. Open `/live/teacher/`, unlock, select the USB document camera, and Start Camera.
2. Confirm the private preview is correct, then select Go Live.
3. Open `/live/` on a separate student iPad on the school network.
4. Confirm video appears, no student camera/mic prompt is requested, and fullscreen works.
5. Stop Broadcast. The viewer should return to Offline within the next five-second poll.

The sender uses one video upload to Cloudflare, with audio disabled. Students only
receive that video. Anyone with the viewer link can watch while the teacher is live.
Closing the teacher tab stops local capture and sends a stop request; if that
request cannot reach the server, the room expires within 90 seconds. Connection
failure and reconnect paths show status messages rather than claiming to be live.

This initial configuration uses Cloudflare STUN. Actual camera/iPad testing is
required. If a school firewall blocks the media connection, configure a TURN relay
or request the appropriate school allowlist; do not promise all school networks work.

## Validation

`node --test tests/classroom-live.test.mjs` (Node 24) checks real SQLite state
transitions with a mocked SFU API: authentication, wrong-role rejection, preview
isolation, duplicate starts, expired broadcasts, stop races, and failure recovery.
`npx wrangler pages functions build` validates Pages bundling. Neither proves the
live credentials, camera hardware, or school network connection.

References:
- https://developers.cloudflare.com/realtime/sfu/https-api/
- https://developers.cloudflare.com/pages/functions/bindings/
- https://github.com/cloudflare/realtime-examples/tree/main/echo

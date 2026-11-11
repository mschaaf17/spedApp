# Chromebook support requests

This Manifest V3 extension connects to the same Inclusion v2 API as the mobile app. It lets an authenticated student select one of their assigned accommodations, choose an assigned teacher, submit a private support request, and refresh its status.

## Development installation

1. Start the connected app and API with `npm run dev` (demo-only browser data is not an extension backend).
2. In Chrome, open `chrome://extensions`, enable Developer mode, and choose **Load unpacked** → this `extension` folder.
3. Copy the extension ID into `CHROME_EXTENSION_IDS` in the server environment and restart the API.
4. Open the extension, enter the school app origin (for development, `http://localhost:5173`), and sign in with a student account assigned to an educator.
5. Grant access to that specific school origin when Chrome prompts.

For school rollout, use the district’s extension management process or Chrome Web Store distribution. This version has not been submitted to the store or installed on any student device.

## Data and permissions

- `storage` is the only required permission. Host access is optional and requested only for the origin entered by the user.
- No page content, browsing history, active tabs, microphone, or camera is accessed. There are no content scripts.
- The school origin is retained in local extension storage. The two-hour session token is retained in `chrome.storage.session`, not synced to another device. Passwords are not stored.
- Requests use server authorization and idempotency identifiers; only supports and teachers assigned to the signed-in student can be selected.
- Student requests are classroom support requests, not an emergency communication channel.

References: [Manifest V3](https://developer.chrome.com/docs/extensions/reference/manifest), [optional host permissions](https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions).

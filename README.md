# Inclusion

Classroom support, student self-advocacy, and visible progress. This modernization adds a mobile workspace to the original `spedApp` repository. The original `client/` and `server/` source is retained. The new app lives in `mobile/`, with an authenticated API in `api/`.

## Included in this update

- Responsive teacher, student, and administrator workspaces with mobile navigation, touch controls, safe-area spacing, and an iOS/Android home-screen manifest.
- **Picture-first student support requests:** large concrete illustrations, pictures as touch targets, optional spoken captions, and a large visual confirmation. Teachers choose a picture and short label for each accommodation. Audio never plays automatically.
- A support inbox with separate requested → acknowledged → offered → provided timestamps and student cancellation.
- Frequency logging and undo, elapsed-time duration timers, and paired student/anonymous-peer observations every 10 seconds. No unobserved interval is automatically recorded.
- Progress measurements, private student reflections, graphs, accessible measurement tables, and CSV export.
- Revocable, seven-day family links containing only measurements explicitly marked for sharing. Reflections, behavior logs, account IDs, and full names are excluded.
- School-day, time-zone, and quiet-hour settings with optional generic Web Push notifications.
- Guided IEP-goal, BIP, and operational-definition drafts, editable review history, and an optional AI adapter. Drafts never automatically change supports or the school's official plan.
- A Chromebook extension connecting to the same authenticated request API and using the same support pictures.

## Explore the demo

Use Node **22.16 or later**. Validation used Node 24.

```sh
npm ci
npm run dev:demo
```

Open the URL printed by Vite. The demo contains six fictional students and can switch between teacher, student, and administrator roles. Demo changes persist only in the current browser-tab session. No real student records are loaded.

## Connect a school workspace

1. Copy `.env.example` to `.env`. Set `MONGODB_URI`, a random `JWT_SECRET` of at least 32 characters, and the exact app origin in `APP_ORIGINS`.
2. Set the bootstrap account variables and run `npm run bootstrap`. Choose `BOOTSTRAP_ROLE=admin` or `teacher`. When assigning a role to an existing account, its password is preserved.
3. To import an existing roster, back up the database and run `npm run migrate:legacy`. It creates missing classroom profiles from existing student accounts, accommodation cards, and teacher/student assignments. It does not delete original records or overwrite existing classroom profiles. Review grades, plan types, goals, assignments, and pictures after import.
4. Run `npm run dev` for the API and app together. Use **Sign in to your school**. The role switcher appears only in the fictional demo; live roles are assigned on the server.

For production:

```sh
npm run build
NODE_ENV=production npm start
```

The API serves `mobile/dist` on `PORT` (default 3001). Use HTTPS and configure `APP_ORIGINS` and reverse-proxy trust for the deployment. The service worker does not cache authenticated pages or student records. Changes are not silently queued offline. The new app does not expose the old GraphQL API.

### Existing accounts and data

The modern API reuses the original `users` collection and bcrypt password hashes. Legacy `isAdmin: true` educators map to **teacher**, not school administrator. Administrator elevation requires the explicit bootstrap command.

New feature records use separate collections: `classroomprofiles`, `classroomevents`, `supportrequests`, `classroomsettings`, and `familyshares`. Historical frequency/duration records remain in their original collections; they are not silently converted into new measurements. New event history starts when the modern workspace is connected. Original client/server source remains available for historical reporting using its original setup.

### Optional push notifications

Generate VAPID keys with the official `web-push` package and set `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT` server-side. Enable notifications from Settings in the connected app. Push messages are generic and sent only during the receiving educator's school hours. Requests received during quiet hours remain in the inbox without a deferred push.

Device notifications require HTTPS and a supported browser. Test iPhone notifications in the installed home-screen app. This update does not create App Store or Play Store packages. See [web-app installation](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Installing).

### Optional AI drafting

The default is an explicitly labeled **guided template** with no external call. To enable the Responses API adapter, configure `AI_DRAFTS_ENABLED=true`, `OPENAI_API_KEY`, and `OPENAI_MODEL` using the school's approved service configuration. Keys remain server-side. Explicit name/account/ID fields and student reflection notes are omitted from requests; educator-entered plan text may still contain identifying information. Review that text and the school's approved data-handling arrangement before enabling the service.

The adapter uses current plan context and up to 30 recent measurements, returns a reviewable draft, and cannot apply a plan change. Failed or incomplete responses surface as errors. No fine-tuning or model training is performed. See the [official Responses API reference](https://developers.openai.com/api/reference/resources/responses/methods/create).

### Chromebook extension

See [extension/README.md](extension/README.md) for local loading, allowed origins/extension IDs, and school distribution. It has not been published to the store or installed on a student device.

## Validation

```sh
npm test
npm run build
```

Tests cover scoped access, request transitions, quiet hours and daylight saving time, event validation, family-share exclusions, legacy-role mapping, support-picture availability, and optional AI behavior. Browser checks cover teacher/student requests, progress entry, picture loading, responsive layout, and tracking controls. These checks do not certify physical iOS/Android devices. MongoDB persistence, push delivery, and live AI generation require configured services for end-to-end testing.

| Folder               | Purpose                                                         |
| -------------------- | --------------------------------------------------------------- |
| `mobile/`            | React 19 + Vite workspace and home-screen assets                |
| `api/`               | Authenticated Express/MongoDB API and optional integrations     |
| `shared/`            | Shared tracking rules, school hours, picture mapping, and tests |
| `extension/`         | Chromebook accommodation request popup                          |
| `client/`, `server/` | Preserved original source                                       |

This is a reviewable modernization foundation with one active measurable goal per student. Multiple simultaneous goals, team-approved intervention phase scheduling, district SSO, roster synchronization, and physical-device testing are subsequent enhancements.

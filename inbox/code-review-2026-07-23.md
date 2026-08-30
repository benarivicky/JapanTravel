# Code Review — 2026-07-23

Scope: current working tree, including the uncommitted proxy/SSRF changes. This review did not modify application code.

## Findings

### CR-01 — Blocker: current Firestore rules deny all normal trip-plan access

**Location:** `firestore.rules:12-27`

The only general access rule expired on **2026-07-15**. The remaining special-case rule grants access only to the account whose email matches `firebase@flutterflow.io`; regular signed-in users have no `tripPlans` rule. Consequently, `getTripPlans()` and `getTripCustomerName()` issue client Firestore reads that are denied for every normal customer, making the trip experience unavailable.

Define explicit rules for `tripPlans` that authorize a user only for the trip ID assigned in their `/Users/{uid}` document (and separate, durable admin authorization). Deploy and test the rules with the Firebase Emulator before release.

### CR-02 — Blocker: admin server actions have no server-side authorization

**Locations:** `src/app/admin/upload/actions.ts:6-23`; `src/app/admin/new-user/actions.ts:22-41`

Both `'use server'` actions trust that the caller was admitted by the client-side `useAuth()` check. Server Actions are callable directly; a browser redirect and a hard-coded client email list are not an authorization boundary. Any caller that obtains the action endpoint can attempt to upload/replace a plan or create accounts and choose their trip IDs.

Authenticate the request in each action, verify an admin custom claim/role on the server, and reject unauthorized calls before parsing input or performing Firebase operations. Use the Firebase Admin SDK for privileged writes rather than the browser Firebase SDK.

### CR-03 — High: user creation can leave an orphaned Firebase Auth account

**Location:** `src/app/admin/new-user/actions.ts:33-41`

`createUserWithEmailAndPassword` creates the Auth account in the temporary app, but `setDoc` uses the separate `mainApp` Firestore instance, which has no authenticated user in this server process. Under the current rules this write is denied. The catch returns a failure response, but the newly created Auth user remains and has no `/Users/{uid}` assignment. Retrying then reports `auth/email-already-in-use`.

Use a server-side transactional/provisioning workflow backed by Firebase Admin SDK, or compensate by deleting the Auth account if the profile write fails. Do not return success until both records are committed.

### CR-04 — High: trip HTML is rendered without sanitization

**Locations:** `src/app/trip/page.tsx:183-186`; `src/app/trip/[date]/page.tsx:189-192`; `src/app/trip/[date]/[segment]/page.tsx:151-159`

`summary` and `detailedContent` are loaded from Firestore/uploaded JSON then inserted with `dangerouslySetInnerHTML`. A malicious or compromised plan can execute script through event-handler attributes, dangerous URLs, or malicious markup in every visitor's session.

Sanitize the fields with a strict HTML allowlist at ingestion and ideally again immediately before rendering. Prefer structured rich-text data or plain text where formatting is not required. Add tests that verify script, event-handler, SVG, and `javascript:` payloads are removed.

### CR-05 — High: unvalidated external links can execute dangerous schemes

**Locations:** `src/components/link-preview.tsx:35,49`; `src/app/trip/[date]/[segment]/page.tsx:168`

Trip data supplies `href` directly to an anchor. The preview endpoint rejects non-HTTP URLs, but that does not change the anchor's `href`; a `javascript:` (or other unsafe) URL can still be followed when a visitor clicks the link.

Validate and normalize every stored/rendered link to `http:` or `https:`. Render invalid links as text or omit them, and enforce the same rule on uploads.

### CR-06 — Medium: SSRF protection has a DNS-rebinding time-of-check/time-of-use gap

**Location:** `src/lib/net-guard.ts:31-36,59-62`

`isPublicHost()` resolves the hostname, then `fetch()` resolves the hostname again. An attacker-controlled DNS name can return a public address for the check and a private address for the fetch, bypassing the intended SSRF protection. This affects both public proxy routes.

Connect to the validated resolved address while preserving the original Host/SNI, or use an HTTP client/egress layer that enforces IP-range policy at connection time. Keep redirect validation as well.

### CR-07 — Medium: public proxy routes are unthrottled and link preview does not enforce its claimed 50 KB cap

**Locations:** `src/app/api/image-proxy/route.ts:32`; `src/app/api/link-preview/route.ts:4,91-101`

Anyone can use these endpoints to make the server fetch arbitrary public hosts. There is no rate limit, cache bound, or per-client quota. In the HTML reader, a single response chunk larger than 50 KB is appended in full before the loop condition is checked, so the advertised 50 KB maximum is not actually enforced. This permits resource abuse and increases exposure to large/chunked responses.

Add IP/user rate limiting, an eviction/size policy for the image cache, `Content-Length` checks, and slice/cancel a chunk at the remaining byte limit. Ensure response bodies are cancelled on every early return.

### CR-08 — Medium: production builds deliberately ignore static failures

**Location:** `next.config.ts:6-10`

`ignoreBuildErrors` and `ignoreDuringBuilds` allow deployment despite TypeScript and ESLint failures. This conceals regressions that CI should stop, particularly in routes and authorization code.

Remove both bypasses and run type checking/linting as required CI gates. If there is a temporary known failure, suppress it narrowly with a tracked issue rather than disabling the whole gate.

### CR-09 — Low: duplicated upload action invites divergence

**Locations:** `src/app/admin/actions.ts:1-40`; `src/app/admin/upload/actions.ts:1-40`

Two independent copies of `uploadTripPlan` now exist. They can drift, and a future security fix may be applied to only one copy.

Keep one implementation in a shared, authenticated server module and import it where needed.

## Verification

- `node_modules/.bin/tsc.cmd --noEmit` — passed.
- `npm run typecheck` could not run because this machine blocks the unsigned `npm.ps1` PowerShell shim; invoking the underlying `tsc.cmd` verified the same TypeScript command.
- The combined Jest run produced no output and did not finish within 60 seconds, so it was stopped. Test status is therefore **not verified**.

## Suggested remediation order

1. Restore and deploy correct Firestore authorization rules (CR-01).
2. Replace client-gated admin operations with authenticated Admin SDK operations (CR-02, CR-03).
3. Sanitize trip content and validate links (CR-04, CR-05).
4. Harden and rate-limit the proxy endpoints (CR-06, CR-07).
5. Re-enable production build quality gates and remove duplicate code (CR-08, CR-09).

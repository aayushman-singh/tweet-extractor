# Tweet Extractor Archive Reliability and European Union Data Lifecycle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task by task. Each task must keep the failure rules in this document.

**Goal:** Give a user a trustworthy way to archive, export, and delete tweet data, with proof that the S3 object and database record reach the same declared operation state.

**Architecture:** The API owns an append-only operation ledger with explicit states for each storage step. S3 objects remain private and the authenticated API is the read and export boundary. The database stores the archive relation and lifecycle state, while tests exercise every dependency failure path with no fabricated success response.

**Tech Stack:** Node.js 18+, Express, AWS S3 SDK, MongoDB through Mongoose, JWT authentication, React 18, TypeScript, Vite, and Node's built-in test runner.

**Spec:** `C:/Repo/portfolio/.superpowers/sdd/2026-08-23-project-investment-review/task-4-brief.md` and `C:/Repo/portfolio/docs/project-review/owned-repository-gaps.md`

## Global Constraints

- Keep the user-visible archive, export, and delete operations explicit.
- Return success only after every required storage step completes.
- When a storage step fails, return an error with the operation identifier and record the input, step, error, traceback, and related state.
- Do not use silent retries, default data, cached data, or silent continuation after a failure.
- Keep S3 and database disagreement visible as a failed or repair-required operation.
- Keep user archive objects private. Do not treat public S3 URLs as a privacy control.
- Use authenticated ownership checks for every archive and account operation.
- Preserve existing user changes and do not change unrelated repositories.
- Judge the project with local files and local Git state. Do not require a remote Git command or publication for this plan.
- Do not claim European Union (EU) data lifecycle compliance from policy text alone. Require executable evidence.

## User Outcome

### Why

The user needs to save a tweet archive and later know that the archive exists as one usable item. The current service can report upload success when S3 has the object but MongoDB has no archive record. It can report delete success after S3 deletion fails. The user then sees a record or URL that does not match the stored data.

The privacy page states that users can access, export, and delete their data. The product has an archive download and archive delete button, but it has no account export or account deletion operation. The service also describes reports as public S3 objects. That conflicts with a defensible EU data lifecycle proof for private user archives.

### Observable Success Criteria

1. A user uploads an archive and receives success only when the operation ledger says `completed`, the S3 object is readable, and the database archive record points to that exact object.
2. If S3 upload, S3 verification, or database write fails, the user receives a non-success response with an operation identifier. The response does not claim that the archive is available.
3. A user exports an archive or the complete account record through an authenticated control. The result contains only stored data, has a declared format, and fails loudly when a source object or schema is invalid.
4. A user deletes an archive or the account. Success requires the required S3 objects and database records to be removed or to reach the declared deletion state. A partial result is an error with repair evidence, never a success toast.
5. The dashboard removes an archive from its local view only after the API confirms completed deletion. It shows the operation identifier when deletion or export fails.
6. A local failure matrix proves upload, export, archive delete, and account delete behavior for each S3 and database failure point.
7. A local evidence bundle records the test command, commit, data fixture identifiers, operation states, and final storage checks. It contains no credentials or tweet content from a real person.
8. The README and privacy page describe only operations that the code and evidence implement. They state that private archive reads use the authenticated API.

## Non-Goals

- Do not add new tweet extraction methods or extend X/Twitter scraping coverage.
- Do not add social sharing, public report links, analytics, recommendation features, or a new deployment provider.
- Do not create a new repository or duplicate the lifecycle feature in another project.
- Do not claim a formal legal certification. The project supplies technical evidence for a review of EU data lifecycle controls.
- Do not silently repair a failed operation in a background process. Any repair action must be explicit, authenticated, logged, and visible as a state change.
- Do not rewrite the whole API file. Extract only the operation and storage boundaries needed for this proof.

## Verified Baseline and Evidence Gaps

The worktree is on `master` at `1ae2412`, which matches the selection evidence. Local `git status --short --branch` shows only the existing untracked `AGENT_STATUS.md`. No remote Git command was used. The local history and current code support the following findings.

| Area | Current evidence | Exact gap |
| --- | --- | --- |
| Upload | `api/s3-upload-api.js:410-427` writes S3, catches `ArchiveDB.create`, logs the error, and still returns `success: true` at `:429-436`. `git blame` maps the masking behavior to `61875a6`. | No operation identifier, no durable step state, no S3 verification, no compensating action record, and no error response when the database write fails. |
| Archive delete | `api/s3-upload-api.js:492-502` catches S3 failure and continues to `ArchiveDB.deleteById` at `:504-511`; the route returns success at `:513-516`. `git blame` maps the behavior to `3a6ba44`. | S3 and MongoDB can disagree while the API reports success. There is no deletion ledger, tombstone, repair state, or proof that both stores are clear. |
| Archive export | `api/s3-upload-api.js:761-781` reads the database record and S3 object. `:785-810` tries JSON and then extracts JSON from HTML. `:857-915` creates missing arrays and timestamps. | The format is not declared in the archive relation. Parse compatibility is implicit. Missing data can be replaced by generated values. There is no export operation record or account-level export. |
| Fabricated data path | `api/s3-upload-api.js:927-969` defines `generateDefaultReportData` with sample tweet content and current timestamps. It is not referenced by a route in the current file, but it remains a prohibited source of evidence. | Remove or isolate this path before reliability evidence. A failed read must not produce sample data. |
| Database model | `api/database.js:87-145` stores `user_id`, S3 fields, metadata, and tweet count. `:447-469` deletes the row by ID. | No operation ID, content digest, format version, lifecycle state, retention date, deletion timestamp, or account export relation. |
| HTTP surface | `api/s3-upload-api.js` has archive upload, list, report, download, and archive delete routes. The route list has no account export or account delete endpoint. | The privacy claims cannot be verified for complete account data access or erasure. |
| Frontend behavior | `frontend/src/pages/Dashboard.tsx:118-148` shows a success toast and filters local state after any successful HTTP response. `:180-214` downloads JSON. `:395-421` exposes archive download, view, and delete controls. | The UI has no operation status, no account export/delete control, and no explicit partial-failure state. It trusts the current false-success contract. |
| Privacy statement | `frontend/public/privacy.html:182-205` claims account deletion, data access, and archive export. `:136-145` describes cloud storage, and `:224-233` claims General Data Protection Regulation (GDPR) compliance. | The stated rights exceed the implemented API. Public S3 wording and a compliance claim are not supported by executable evidence. |
| Test proof | `api/package.json` has ad hoc registration and performance scripts, but no failure-injection suite. `api/node_modules` and `frontend/node_modules` are absent in the current workspace. | No repeatable local operation matrix, no storage consistency assertion, and no frontend type or build result is present in the current state. |
| Historical proof | `git log --all -- api/s3-upload-api.js` shows archive behavior was added in August 2025. The current head is a README-only rewrite. | Recent documentation changes did not change the storage contract. The plan must add new evidence instead of treating README claims as proof. |

## Hard Decisions

1. The ledger is the operation contract. `completed` is the only state that permits a success response.
2. S3 objects for authenticated archives are private. The database stores the bucket key and a stable object digest, not a public access promise. Any future sharing feature requires a separate, expiring access grant and is out of scope here.
3. An S3 and database mismatch is a first-class `repair_required` failure. The API returns an explicit error and operation identifier. It does not hide the mismatch with a retry or a default response.
4. Export uses a declared archive format and schema version. A source format mismatch is an error. The implementation must remove sample/default report output from the proof path.
5. Lifecycle audit records retain only the minimum identifiers and failure context needed for proof. They must not retain tweet content, passwords, tokens, or S3 credentials. The retention period and purge evidence must be written as an explicit project decision before account deletion is marked complete.

## Ordered Investment Task Groups

### Task Group 1: Define the Operation Contract and Ledger

**Purpose:** Establish one explicit state machine before changing upload or delete behavior.

**Files:**

- Create: `api/operation-ledger.js`
- Modify: `api/database.js`
- Create: `api/test/operation-ledger.test.js`
- Modify: `api/package.json`

**Required contract:**

- `beginOperation({ operationType, userId, archiveId, requestId, resource })` returns `{ operationId, state: 'started' }` and writes before any S3 side effect.
- `recordStep(operationId, step, inputSummary)` records `started`, `completed`, or `failed` with timestamps and sanitized context.
- `completeOperation(operationId, resultSummary)` is valid only when every required step is complete.
- `failOperation(operationId, errorContext)` records the failing step, error name, message, stack, request identifiers, and related state. It returns an explicit failure object.
- Allowed terminal states are `completed`, `failed`, and `repair_required`. No function may convert a terminal failure to success.

**Bounded first implementation task:** Add the pure transition validator and its Node built-in tests. Test valid upload and delete transitions, rejection of completion after a failed step, rejection of unknown steps, and preservation of the operation identifier in failure output. This task does not change an HTTP route.

**Verification:** `node --test api/test/operation-ledger.test.js` passes. A test that attempts an invalid transition fails with a named `OperationStateError`. `git diff --check` reports no whitespace errors.

### Task Group 2: Make Archive Upload Consistent

**Purpose:** Make upload success mean that S3 and MongoDB describe the same archive.

**Files:**

- Modify: `api/s3-upload-api.js:332-445`
- Modify: `api/database.js:87-145,286-323`
- Create: `api/storage-adapters.js`
- Create: `api/test/archive-upload.test.js`

**Required behavior:**

1. Authenticate and validate content, format, size, and a client request identifier.
2. Start the ledger before calling S3.
3. Upload with an operation ID in object metadata, then verify the object with a read or head check and a content digest.
4. Create the database archive relation with the operation ID, digest, format, schema version, and private object key.
5. Mark the ledger `completed` only after both writes and checks pass. Return the operation ID and archive ID.
6. If the database write fails after S3 succeeds, record the full failure and perform one explicit compensating delete. If that delete fails, record `repair_required` with both errors. Return an error in both cases.
7. Do not return an archive URL that bypasses authenticated ownership checks.

**Verification:** Use dependency fakes to prove S3 failure, S3 verification failure, database failure, and compensating-delete failure. Assert that no case returns `success: true` unless the ledger is `completed`. Assert that the database record and S3 metadata contain the same operation ID and digest on the success path.

### Task Group 3: Make Archive and Account Delete Explicit

**Purpose:** Give the user a deletion operation with an auditable result for every storage relation.

**Files:**

- Modify: `api/s3-upload-api.js:470-522`
- Modify: `api/database.js:87-145,373-469`
- Create: `api/test/archive-delete.test.js`
- Create: `api/test/account-lifecycle.test.js`

**Required behavior:**

- Archive delete checks ownership, starts a ledger operation, deletes the private S3 object, verifies the object is absent, deletes the database relation, and completes only after both checks pass.
- If any step fails, return an explicit non-success response with the operation ID. Record all completed and failed steps. Do not delete the database row after an S3 failure.
- Add an authenticated account export and account delete operation. Account delete enumerates all owned archives, records each object operation, removes the objects, then removes account-owned database data. It does not claim completion when any object or record remains.
- Keep minimal deletion evidence after data removal. Remove content and authentication secrets from the retained operation record.
- Make repeated requests explicit. A completed delete returns a documented idempotent result. A failed or repair-required operation returns its current state and does not silently restart.

**Verification:** Run a fixture account through archive delete and account delete. Assert S3 absence, database absence, and the final ledger state. Inject failure at each object and database step. Assert the response is an error with the exact operation ID and that the ledger contains the failure context.

### Task Group 4: Make Export Complete and Source-Exact

**Purpose:** Let a user obtain their data without fabricated values or an implicit parser fallback.

**Files:**

- Modify: `api/s3-upload-api.js:581-758,760-925`
- Modify: `api/database.js:286-469`
- Create: `api/export-format.js`
- Create: `api/test/archive-export.test.js`

**Required behavior:**

- Store a declared format and schema version at upload time.
- Export an archive only after ownership lookup, object retrieval, digest verification, and schema validation succeed.
- Accept an explicit `format` value. Convert only from a format that the stored schema declares. A parse or digest failure returns an error with an operation ID.
- Add account export with account identity, archive metadata, and each archive's source data in a documented machine-readable structure. Do not include passwords, JWT tokens, or internal credentials.
- Remove the current implicit JSON-to-HTML parser fallback and the sample/default report path from the evidence path. Do not add current timestamps or placeholder tweets when source data is absent.

**Verification:** Export a known fixture and compare the result with the stored digest and expected fields. Test unknown format, invalid schema, missing S3 object, digest mismatch, and unauthorized archive access. Assert no result contains generated sample content.

### Task Group 5: Align the User Workflow and Privacy Text

**Purpose:** Make the visible product state match the backend operation state and the actual data lifecycle.

**Files:**

- Modify: `frontend/src/pages/Dashboard.tsx:118-214,333-421`
- Modify: `frontend/src/pages/ReportViewer.tsx:328-358,431-434`
- Modify: `frontend/src/pages/Privacy.tsx`
- Modify: `frontend/public/privacy.html`
- Modify: `README.md`
- Create: `frontend/src/lib/operation-errors.ts`

**Required behavior:**

- Keep the archive in the dashboard until the delete response reports `completed`.
- Display the operation identifier and server error state for failed upload, export, and delete requests. Do not show a success toast for a partial result.
- Add clear authenticated controls for account export and account deletion. Require a deliberate confirmation for account deletion.
- Make the export format visible and stable. The downloaded file name must match the server format.
- Replace public S3 access claims with the private API boundary. Remove the GDPR compliance claim unless the evidence bundle supports the exact technical statements made.

**Verification:** Run the frontend type check and build. Exercise the dashboard with mocked completed, failed, and repair-required responses. Confirm the local archive list changes only after completed delete.

### Task Group 6: Produce Deployment and Portfolio Proof

**Purpose:** Turn the implementation into reviewable evidence for product-minded backend roles in EU companies and startups.

**Files:**

- Create: `docs/evidence/archive-operation-matrix.md`
- Create: `docs/evidence/eu-data-lifecycle-proof.md`
- Modify: `api/README.md`
- Modify: `frontend/README.md`

**Required evidence:**

- A local test transcript for every operation and injected failure point.
- A fixture report showing matching operation ID and digest in S3 metadata, MongoDB, export output, and the ledger.
- A deletion transcript showing object absence, database absence, retained minimal lifecycle evidence, and purge verification for retained data.
- A clear list of environment requirements and commands. The transcript must not print secrets or real tweet content.
- A short architecture note that explains the S3 and MongoDB distributed-write limit and the explicit `repair_required` behavior.

**Verification commands:**

```powershell
cd C:/Repo/tweet-extractor/api
npm ci
npm test
node --test test/*.test.js

cd C:/Repo/tweet-extractor/frontend
npm ci
npm run type-check
npm run build

cd C:/Repo/tweet-extractor
git diff --check
git status --short --branch
```

The first four commands require the test scripts and fixture harness from the earlier groups. A successful portfolio review also requires the evidence files, a clean local checkout, and a redacted operation matrix. Do not treat a remote deployment or a public URL as a substitute for this local proof.

## Portfolio Proof

This project supplies one visible product workflow and three strong backend signals:

- Product ownership: an authenticated user can archive, inspect, export, and delete data through controls that reflect the server operation state.
- Reliable backend processing: a durable ledger, content digest, explicit transitions, and failure injection show how the service behaves when S3 and MongoDB disagree.
- EU data lifecycle: account export and deletion cover identity, archive metadata, private objects, database relations, and minimal retained audit evidence.
- Engineering judgment: the plan rejects public-by-default storage and silent recovery because those choices weaken the user outcome and the evidence claim.

The proof is portfolio-ready only when the operation matrix and lifecycle transcript are reproducible from local files, contain no secrets, and show both success and failure paths.

## Risks and Controls

| Risk | Control |
| --- | --- |
| S3 and MongoDB do not provide one distributed transaction. | Use a durable ledger, verify each step, expose `repair_required`, and never return success for a partial relation. |
| A failed delete can remove S3 before MongoDB or leave an object after database cleanup. | Preserve the ledger and explicit repair state. Test each ordering and require a visible repair command. |
| Existing public S3 links can bypass ownership and deletion controls. | Make archive objects private and remove public URLs from the normal authenticated archive contract. |
| Legacy HTML and JSON files have different shapes. | Store format and schema version. Convert only through an explicit requested format and fail on unknown source data. |
| Lifecycle audit records can retain personal data. | Store minimal identifiers and error context. Define and verify a retention purge before claiming lifecycle proof. |
| The current API file is large and has old debug/default paths. | Add focused operation, storage, and export modules. Remove only paths that can falsify operation evidence. |
| Local dependencies are not installed now. | Treat package installation and test output as a later verification gate. Do not claim tests passed from the current workspace. |

## First Bounded Implementation Task

Implement Task Group 1's pure operation transition validator and its tests. The first review must answer only these questions:

1. Does every operation have a stable identifier before an external storage side effect?
2. Can the state machine reject completion after any failed required step?
3. Does every failure result preserve the operation identifier and full sanitized context?
4. Do the tests cover valid upload and delete paths plus invalid transitions?

Do not change the HTTP routes, S3 calls, MongoDB writes, frontend controls, or privacy text in this first task. After the validator passes, use it as the contract for the upload ledger in Task Group 2.

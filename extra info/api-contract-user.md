# API Contract — User / Client App

**Scope:** Every API call the user-facing frontend (`src/pages/*` and `src/pages/dashboard/*`) makes against the backend. Admin endpoints (`src/pages/admin/*`) are deliberately out of scope.

**Source of truth for entities:** [`system-design-v2.md`](./system-design-v2.md). Field names below mirror the data model entities and enums verbatim wherever possible — the goal is that the FE devs can stub responses today and the BE team can wire each route to the same shape later without renegotiation.

---

## Conventions

- **Base URL:** `/api/v1`
- **Auth:** Bearer JWT in `Authorization: Authorization: Bearer <token>`. Tokens are issued by `POST /auth/login` (and the post-registration flow).
- **Tenancy:** organization is resolved from the JWT (`organization_id`) — never sent by the client. Cohort context is resolved from the user's active `Application` (pre-enrolment) or `Enrollment` (post-acceptance) and likewise never sent by the client.
- **Datetime:** ISO-8601 strings, UTC, with `Z` suffix.
- **IDs:** UUID strings.
- **Pagination:** `?page=<n>&page_size=<n>` returning `{ data: [...], page, page_size, total }`.
- **Errors:** standard envelope `{ error: { code: "string", message: "string", details?: {...} } }`. HTTP status reflects category (400/401/403/404/409/422/429/500).
- **File uploads:** `multipart/form-data` for direct uploads, OR a 2-step `POST .../upload-url` → returns presigned S3 URL → frontend `PUT`s the file → frontend confirms with `PATCH .../{id}` carrying `file_url`. The contract below assumes the **2-step flow** (recommended); switch the relevant endpoints to multipart if simpler.
- **Polling vs sockets:** every "live" surface (notifications, community feed, raid activity, audit assignment, leaderboard) should ultimately come over a websocket channel `wss://.../realtime?token=...`, but a REST fallback exists for every value. Section 14 documents the socket events; everything else is REST.
- **Soft state:** flags like `is_activated`, `dashboard_state`, `status` come straight from the entities — frontend should never compute "is this quest open?" — the backend tells it.

---

## 0. Authentication & Session

### Update (May 2026): Account-First Registration

The active flow is now:
1. `POST /auth/signup` creates the user account from email/password and returns `token + refresh_token`.
2. The user is already signed in and is redirected to `/register`.
3. `POST /auth/register-applicant` is called with Bearer auth and creates the `StudentProfile + Application` for that signed-in user.

### `POST /auth/signup`
Used by **Signup page**. Creates a user account and signs the user in immediately.

Request:
```jsonc
{
  "email": "ao@example.com",
  "password": "Password123!"
}
```

Response `201`:
```jsonc
{
  "token": "jwt...",
  "refresh_token": "jwt...",
  "user": { "id": "uuid", "first_name": "Pending", "last_name": "Applicant", "email": "ao@example.com" },
  "application": null,
  "selection_game": null
}
```

The frontend currently bounces from `/register` → `/assessment/play` → `/assessment/result` → `/dashboard` without explicit login screens, but every real call needs a token. The contract below assumes the registration response **issues** a JWT, and a subsequent login endpoint exists for return visits.

### `POST /auth/register-applicant`
Used by **Register page**, after the 4-step wizard collects everything. Requires Bearer auth, updates the signed-in user profile, creates `StudentProfile`, creates `Application` (status `registered`), and uploads the three `RegistrationDocument` rows.

Request (multipart, since file uploads are bundled):
```jsonc
{
  "first_name": "Adaeze",
  "last_name": "Okonkwo",
  "phone": "+2348012345678",
  "address": "12 Akoka Road, Yaba, Lagos",
  "date_of_birth": "2003-05-12",          // optional in current FE; reserved
  "nin": "12345678901",
  "institution_name": "University of Lagos",
  "matric_number": "CSC/20/1032",
  "department": "Computer Science",        // FE doesn't collect today; default ""
  "level": "300L",
  "campus_id": "uuid",                     // resolved from Code Zone selection — see GET /campuses
  "siwes_duration_months": 6,              // 3 | 4 | 6 — stored on Application.metadata
  "consents": {
    "phone_linked_to_nin": true,
    "duplicate_understanding": true,
    "truth_attestation": true
  },
  // Files attached as multipart parts:
  "school_id_card_file":   "<binary>",     // -> RegistrationDocument(document_type=school_id_card)
  "profile_picture_file":  "<binary>",     // -> RegistrationDocument(document_type=profile_picture)
  "government_id_file":    "<binary>"      // -> RegistrationDocument(document_type=nin_scan|government_id)
}
```

Response `201`:
```jsonc
{
  "token": "jwt...",
  "user": { "id": "uuid", "first_name": "Adaeze", "last_name": "Okonkwo", "email": "..." },
  "application": {
    "id": "uuid",
    "cohort_id": "uuid",
    "campus_id": "uuid",
    "status": "registered",
    "dashboard_state": "status_only",
    "registered_at": "..."
  },
  "selection_game": {                      // surfaced so /assessment can render the countdown
    "id": "uuid",
    "scheduled_at": "...",
    "duration_minutes": 30,
    "status": "upcoming"
  }
}
```

Errors: `401 unauthorized`, `409 application_exists | profile_exists | duplicate_nin | duplicate_matric`, `422 validation_failed`.

### `POST /auth/login`
For returning users. Email + password (or magic link — TBD). Returns same shape as register response, minus document uploads.

### `POST /auth/logout`
Invalidates the token server-side.

### `GET /auth/session`
Cheap probe used by the SPA shell to decide which routes to render. Returns the active `User`, the latest `Application` (if pre-enrolment) and/or `Enrollment` (if learning), and the `dashboard_state` enum so the FE can pick `Status` vs `Onboarding` vs `Dashboard*` without guessing.

```jsonc
{
  "user": { "id": "uuid", "first_name": "...", "last_name": "...", "email": "...", "avatar_url": null },
  "application": {
    "id": "uuid",
    "status": "registered|game_pending|game_completed|review|verification_pending|verified|onboarding|accepted|rejected",
    "campus_id": "uuid",
    "passed_game": null,
    "game_score": null
  },
  "enrollment": null,                       // populated once status=accepted
  "progression_stage": {
    "name": "Game",
    "dashboard_state": "game_access"        // status_only|countdown|game_access|onboarding_form|full_learning
  }
}
```

---

## 1. Landing page (`/`)

**File:** `src/pages/Landing.tsx`

Mostly static marketing content. The only dynamic surface is the cohort countdown chip ("Cohort 03 · 3/4/6-month tracks open · Applications close in 14 days").

### `GET /public/active-cohort`
Anonymous. No auth required.

```jsonc
{
  "application_cohort": {
    "id": "uuid",
    "name": "October 2026 Intake",
    "status": "open",                      // open | in_review | closed
    "opens_at": "...",
    "closes_at": "...",                    // drives the "applications close in N days" copy
    "max_applicants": 1500,
    "registered_count": 932                // optional, drives the live counter
  },
  "program": {
    "id": "uuid",
    "name": "SIWES 6-Month Software Engineering",
    "duration_options_months": [3, 4, 6]
  }
}
```

If no cohort is open: `404 no_active_cohort` and the FE hides the countdown, leaves the rest of the page intact.

---

## 2. Registration flow (`/register`)

**File:** `src/pages/Register.tsx`

### `GET /campuses`
Drives the **Code Zone** picker (step 4). Returns campuses for the active cohort, with capacity info so the UI can show "42 seats / High demand / Open".

```jsonc
{
  "data": [
    {
      "id": "uuid",
      "name": "Lagos (Ikeja)",
      "location": { "city": "Ikeja", "state": "Lagos", "address": "..." },
    }
  ]
}
```

### `POST /auth/register-applicant`
Already documented in §0. This is the submit at the end of step 4.

### `POST /applications/{application_id}/registration-documents`
Optional — only used if you want to split the upload from the register call (e.g., to allow re-uploads if a doc was rejected). Same body as the document parts above.

```jsonc
// request
{
  "document_type": "school_id_card|nin_scan|profile_picture|government_id|other",
  "file_url": "https://s3.../xyz.jpg",     // produced by the presigned upload step
  "original_filename": "school-id.jpg"
}
// response — RegistrationDocument
{
  "id": "uuid",
  "application_id": "uuid",
  "document_type": "school_id_card",
  "file_url": "...",
  "status": "pending_review",
  "uploaded_at": "..."
}
```

### `POST /uploads/presign`
Helper for the 2-step upload. Returns an S3 presigned `PUT` URL.

```jsonc
// request
{ "purpose": "registration_document|onboarding_document|profile_picture|logbook_attachment", "filename": "school-id.jpg", "mime_type": "image/jpeg" }
// response
{ "upload_url": "https://s3.../signed", "file_url": "https://cdn.../xyz.jpg", "expires_at": "..." }
```

---

## 3. Assessment intro (`/assessment`)

**File:** `src/pages/Assessment.tsx`

Mostly static, but the FE should fetch the actual `SelectionGame` so it can show the right number of mini-games, durations, and scheduling.

### `GET /me/selection-game`
Returns the current applicant's `SelectionGame` and the most recent `GameAttempt` (if any). Drives both `/assessment` and `/assessment/play`.

```jsonc
{
  "selection_game": {
    "id": "uuid",
    "name": "Cohort 03 Selection",
    "description": "...",
    "scheduled_at": "...",
    "duration_minutes": 30,
    "access_method": "dashboard_link",
    "status": "upcoming|active|completed",
    "configuration": {
      "rounds": [                           // shape is opaque to the FE today since the FE renders fixed mini-games — keeping it open ended for v2 admin authoring
        { "key": "memory",  "max_score": 100, "round_count": 5 },
        { "key": "logic",   "max_score": 100, "question_count": 4 },
        { "key": "speed",   "max_score": 100, "question_count": 5, "seconds_per_question": 8 }
      ]
    }
  },
  "latest_attempt": null                    // or a GameAttempt object if the user has played
}
```

---

## 4. Game play (`/assessment/play`)

**File:** `src/pages/GamePlay.tsx`

Three back-to-back mini-games (memory / logic / speed). The FE today fakes the questions client-side; the contract supports either:
- **(a) FE-rendered, BE-graded**: FE assembles answers into `attempt_data` JSON and submits at the end → **simplest, recommended for v1**.
- **(b) BE-served**: BE issues per-round questions over polling/socket. (Not needed for current FE.)

### `POST /me/selection-game/attempts/start`
Marks the attempt as started. Returns the `attempt_id` to attach to the final submission, plus a server `started_at` so the FE clock can sync.

```jsonc
// response — GameAttempt
{
  "id": "uuid",
  "game_id": "uuid",
  "user_id": "uuid",
  "application_id": "uuid",
  "started_at": "...",
  "deadline_at": "...",                    // started_at + duration_minutes
  "score": null,
  "passed": null
}
```

### `POST /me/selection-game/attempts/{attempt_id}/complete`
Final submit. Sends per-game breakdown and overall computed score. The BE re-validates the score against the attempt log before storing.

```jsonc
// request
{
  "score": 78,
  "timeElapsed": 3040, //in seconds
  "breakdown": { "memory": 70, "logic": 80, "speed": 84 },
  "attempt_data": {
    "game1":  { "rounds_played": 5, "max_round_reached": 5 },
    "game2":   { "answers": ["32","I","▲","8"], "correct_count": 4 },
    "speed":   { "answers": [2,2,1,2,1], "timed_out_count": 0 }
  }
}
// response — GameAttempt + derived application status change
{
  "attempt": {
    "id": "uuid",
    "score": 78,
    "passed": true,
    "completed_at": "..."
  },
  "application": {
    "id": "uuid",
    "status": "game_completed",            // server may already have advanced it
    "passed_game": true,
    "game_score": 78
  },
  "next_route_hint": "review|onboarding|dashboard"   // optional convenience for FE routing
}
```

> **Note:** the FE today shows a `Result` page that branches at `≥70%` between "demo dashboard" and "submit for admin verification". The real flow has the BE drive that decision via `application.status` and `next_route_hint` — the FE should not hardcode `70`.

---

## 5. Result page (`/assessment/result`)

**File:** `src/pages/Result.tsx`

No dedicated endpoint beyond the response from `/attempts/{id}/complete`. If the page is reloaded the FE refetches with:

### `GET /me/selection-game/attempts/latest`
Returns the most recent `GameAttempt` plus the current `Application.status`, so the FE can re-render the result and pick the right CTA without relying on `location.state`.

---

## 6. Status page (`/status`)

**File:** `src/pages/Status.tsx`

Pure read of the applicant's current state. The page already accepts a `?state=accepted|review|rejected` query string for the demo, but the production version should fetch:

### `GET /me/application`
```jsonc
{
  "application": {
    "id": "uuid",
    "status": "review",                    // drives the icon/title/copy
    "passed_game": true,
    "game_score": 78,
    "rejection_email_sent": false,
    "registered_at": "...",
    "dashboard_state": "countdown"
  },
  "verification_request": {                // populated once verification has begun
    "status": "pending|confirmed|denied|no_response",
    "follow_up_count": 0
  },
  "next_action": {
    "label": "Continue onboarding",
    "route": "/onboarding"
  }
}
```

---

## 7. Onboarding page (`/onboarding`)

**File:** `src/pages/Onboarding.tsx`

The applicant uploads SIWES paperwork (CYS form, logbook, acceptance letter, ID). Each row is an `OnboardingDocument`.

### `GET /me/onboarding-documents`
Returns the *list of required document slots* for this program/campus, with the user's current upload state for each.

```jsonc
{
  "required_documents": [
    {
      "document_type": "cys_form",
      "title": "CYS form",
      "description": "Company Year Schedule",
      "requires_physical_signature": false,
      "uploaded": null                     // or full OnboardingDocument
    },
    {
      "document_type": "logbook",
      "title": "SIWES logbook",
      "description": "Upload signed/stamped pages",
      "requires_physical_signature": true,
      "uploaded": { "id":"uuid", "status":"pending_review", "file_url":"...", "uploaded_at":"..." }
    },
    { "document_type": "acceptance_letter", "title": "Acceptance letter", "uploaded": null },
    { "document_type": "other",             "title": "Student ID card",   "uploaded": null }
  ],
  "campus_supervisor": {                   // shown to user so they know who signs the physical pages
    "name": "Mr. Chukwu",
    "email": "supervisor@..."
  }
}
```

### `POST /me/onboarding-documents`
Upload (or re-upload) an onboarding document. Same 2-step flow as registration documents.

```jsonc
// request
{
  "document_type": "cys_form|logbook|acceptance_letter|other",
  "file_url": "https://cdn...",
  "original_filename": "CYS.pdf",
  "metadata": { "school_format": "Unilag template B" }   // optional, free-form
}
// response — OnboardingDocument (full)
```

### `POST /me/onboarding/acknowledge`
Records the consent checkbox at the bottom of `/onboarding` and (if all required docs are uploaded + approved) advances the application toward `accepted`. The BE owns the gate; the FE just reads back the new `dashboard_state`.

```jsonc
{ "ack": true }
// response
{
  "application": { "status": "onboarding|accepted", "dashboard_state": "onboarding_form|full_learning" }
}
```

---

## 8. Dashboard shell (`/dashboard`)

**File:** `src/components/DashboardLayout.tsx`

The layout shows: **XP total**, **rank**, **streak**, **notifications badge**, **search**, **avatar**.

### `GET /me`
Cheap, cached aggregate the shell can read once on load and refresh on tab focus.

```jsonc
{
  "user": {
    "id": "uuid",
    "first_name": "Adaeze",
    "last_name": "Okonkwo",
    "email": "...",
    "avatar_url": "...",
    "initials": "AO"
  },
  "enrollment": {
    "id": "uuid",
    "cohort_id": "uuid",
    "program_id": "uuid",
    "campus_id": "uuid",
    "status": "active|away|restricted|blocked|graduated|withdrawn|expelled",
    "current_subject_id": "uuid",
    "current_course_id": "uuid",
    "xp_total": 2480,
    "level": 4,
    "level_title": "AI Engineer",
    "rank": 24,
    "rank_total": 150
  },
  "streak": {
    "current_streak": 7,
    "longest_streak": 12,
    "last_activity_date": "2026-04-25",
    "next_milestone_days": 30
  },
  "notifications_unread": 3,
  "active_record_notice": null              // populated when an active Record has dashboard_notice
}
```

### `GET /me/dashboard-search?q=...`
Powers the top-bar search ("Search quests, repos, students…"). Multi-entity search; debounce on the FE.

```jsonc
{
  "results": [
    { "type": "quest",    "id": "uuid", "title": "Build a top-k semantic search API",  "subtitle": "Embeddings & Vector Search" },
    { "type": "repo",     "id": "uuid", "title": "rag-pipeline-quest",                  "subtitle": "Quest repo · 24 commits" },
    { "type": "student",  "id": "uuid", "title": "Tunde Adeyemi",                       "subtitle": "Cohort 03 · #18" },
    { "type": "module",   "id": "uuid", "title": "Hybrid search: BM25 + vectors",       "subtitle": "Course: Embeddings" }
  ]
}
```

---

## 9. Dashboard Home (`/dashboard`)

**File:** `src/pages/dashboard/Home.tsx`

This is the most aggregated page in the app. To avoid 8 round trips, expose **one** dashboard endpoint that returns everything the home view renders, then let individual sub-pages fetch deeper detail.

### `GET /me/dashboard/home`

```jsonc
{
  "header": {
    "day_number": 14,                      // days since enrollment.enrolled_at
    "day_of_week": "Friday",
    "level": 4,
    "level_title": "AI Engineer",
    "day_deadline_at": "2026-04-25T23:59:00Z"   // drives the countdown chip
  },
  "stats": {
    "xp_total": 2480,
    "xp_delta_this_week": 340,
    "streak_days": 7,
    "weekly_completion_pct": 72,           // checkpoint readiness metric
    "rank": 24,
    "rank_delta_this_week": 6
  },
  "current_subject": {
    "id": "uuid",
    "name": "Embeddings & Vector Search",
    "description": "4 videos and 3 readings.",
    "learn_progress_pct": 65,
    "is_complete": false
  },
  "current_module": {                       // the "next module" card target on Learn
    "id": "uuid",
    "name": "Building your first vector index with pgvector",
    "estimated_duration_minutes": 13
  },
  "active_quest": {                         // null if locked / none active
    "id": "uuid",
    "name": "Build a top-k semantic search API",
    "description": "FastAPI + pgvector. Return top 5 matches for a query.",
    "is_activated": true,
    "is_locked": true,                      // computed: e.g. learn_progress_pct < 100
    "lock_reason": "module_required",
    "xp_reward": 180,
    "xp_after_deadline": 0,
    "early_bird_bonus_xp": 60,
    "early_bird_deadline_at": "2026-04-25T18:00:00Z",
    "deadline_at": "2026-04-25T23:59:00Z",
    "attempts_used": 0,
    "max_attempts": 3
  },
  "checkpoint_readiness": {
    "id": "uuid",
    "name": "Checkpoint #3",
    "scheduled_at": "2026-04-26T10:00:00Z",
    "is_activated": false,
    "current_completion_pct": 72,
    "required_completion_pct": 80,
    "is_eligible": false
  },
  "active_raid": {                          // null if no active raid
    "id": "uuid",
    "name": "Multi-agent customer support bot",
    "is_activated": true,
    "deadline_at": "2026-04-27T23:59:00Z",
    "group": {
      "id": "uuid",
      "name": "Team #07",
      "members": [
        { "user_id": "uuid", "initials": "AO", "is_me": true },
        { "user_id": "uuid", "initials": "TK" },
        { "user_id": "uuid", "initials": "KE" }
      ]
    }
  },
  "quick_links": {
    "workspace_repo_count": 3,
    "logbook_pending_today": true,
    "leaderboard_rank": 24,
    "alerts_unread": 3
  }
}
```

> Implementation tip: this is fully derivable from `Enrollment`, `Quest`, `Checkpoint`, `Raid`, `XPTransaction`, `Streak`, and `StudentProgressSnapshot`. Cache for 30s.

---

## 10. Learn page (`/dashboard/learn`)

**File:** `src/pages/dashboard/Learn.tsx`

### `GET /me/learn/current`
Returns the user's current `Subject` with its Courses → Topics → Modules tree, plus the user's progress on each item.

```jsonc
{
  "subject": {
    "id": "uuid",
    "name": "Embeddings & Vector Search",
    "description": "...",
    "learn_progress_pct": 65,
    "estimated_remaining_minutes": 38,
    "xp_on_completion": 60
  },
  "courses": [
    {
      "id": "uuid",
      "name": "Intro to Embeddings",
      "order": 1,
      "topics": [
        {
          "id": "uuid",
          "name": "Vector basics",
          "modules": [
            {
              "id": "uuid",
              "name": "What are vector embeddings?",
              "kind": "video",                   // video | reading | exercise — derived from content_html / metadata
              "duration_label": "08:24",
              "estimated_duration_minutes": 8,
              "status": "done|current|locked",
              "xp_reward": 10,
              "is_required": true
            }
          ]
        }
      ]
    }
  ],
  "quest_gate": {
    "is_unlocked": false,
    "next_quest_id": "uuid",
    "blocking_module_id": "uuid"
  }
}
```

### `GET /modules/{module_id}`
The "now playing" detail panel pulls the full HTML body when the user clicks an item.

```jsonc
{
  "id": "uuid",
  "name": "Building your first vector index with pgvector",
  "description": "...",
  "content_html": "<...>",
  "kind": "video",
  "media": { "video_url": "...", "duration_seconds": 767 },
  "estimated_duration_minutes": 13,
  "xp_reward": 15,
  "user_progress": {
    "status": "current",
    "watched_seconds": 252,
    "marked_complete": false
  }
}
```

### `POST /modules/{module_id}/progress`
Heartbeat from the player ("watched 12s more") and / or the explicit "mark complete" toggle. Server is the source of truth for completion → quest unlock chain.

```jsonc
// request
{ "watched_seconds": 264, "mark_complete": false }
// response
{
  "status": "current|done",
  "subject_progress_pct": 67,
  "xp_awarded": 0,                          // > 0 only on the call that flips status to "done"
  "unlocks": [                              // server tells the FE about chain reactions
    { "type": "quest", "id": "uuid", "name": "Build a top-k semantic search API" }
  ]
}
```

---

## 11. Quests (`/dashboard/quests`)

**File:** `src/pages/dashboard/Quests.tsx`

### `GET /me/quests/active`
Returns the user's currently active quest (the one the page renders).

```jsonc
{
  "quest": {
    "id": "uuid",
    "name": "Build a top-k semantic search API",
    "description": "Use FastAPI and pgvector...",
    "parent_type": "module|topic|course",
    "parent_id": "uuid",
    "is_activated": true,
    "is_locked": false,
    "lock_reason": null,                    // module_required | quest_sequence | cooldown | max_attempts
    "submission_type": "git_repository|file_upload|in_platform|auto_graded",
    "language_required": "python",
    "allowed_packages": ["fastapi","pgvector","..."],
    "repository_naming_convention": "topk-search-{matric}",
    "evaluation_criteria": "<rendered html>",
    "learning_materials_html": "<rendered html>",
    "xp_reward": 180,
    "xp_after_deadline": 0,
    "xp_deadline_at": "2026-04-25T18:00:00Z",
    "deadline_at": "2026-04-25T23:59:00Z",
    "time_limit_minutes": null,
    "cooldown_minutes": 30,
    "allows_peer_audit": true,
    "max_attempts": 3,
    "attempts_used": 0,
    "tasks": [
      {
        "id": "uuid",
        "order": 1,
        "prompt": "<html>",
        "task_type": "code|multiple_choice|short_answer|file_submission|free_response",
        "points": 10,
        "hint": "...",
        "learning_material_html": "<html>",
        "options": ["A","B","C","D"]      // present for multiple_choice only
      }
    ]
  },
  "latest_submission": null                  // or a Submission summary
}
```

### `POST /quests/{quest_id}/attempts`
Starts an attempt. Server verifies the quest is unlocked, the cooldown has elapsed, and `attempts_used < max_attempts`. For git-backed quests this also lazily provisions the `GiteaRepository` (returning the clone URL).

```jsonc
// response
{
  "submission": {
    "id": "uuid",
    "status": "pending",
    "attempt_number": 1,
    "deadline_at": "...",
    "started_at": "..."
  },
  "repository": {                            // present only for submission_type=git_repository
    "id": "uuid",
    "gitea_repo_name": "topk-search-CSC201032",
    "gitea_clone_url": "https://gitea.../user/topk-search-CSC201032.git"
  }
}
```

### `POST /quests/{quest_id}/submissions`
Used for non-git submission types (in-platform answers, auto-graded multiple choice, etc.). For git, the equivalent is "push code to Gitea", which the platform detects via webhook — the FE just polls.

```jsonc
// request — task answers
{
  "submission_id": "uuid",
  "responses": {
    "task_id_1": { "answer": "B" },
    "task_id_2": { "answer": "...code..." },
    "task_id_3": { "file_url": "https://cdn..." }
  }
}
// response — Submission with system check kicked off
{
  "id": "uuid",
  "status": "system_checking|awaiting_audit|passed|failed",
  "submitted_at": "...",
  "system_check_passed": null,
  "system_check_result": null
}
```

### `GET /me/submissions/{submission_id}`
Polled by the FE while a submission is being graded.

```jsonc
{
  "id": "uuid",
  "submittable_type": "quest",
  "submittable_id": "uuid",
  "status": "pending|system_checking|awaiting_audit|in_review|passed|failed|cooldown",
  "system_check_passed": true,
  "system_check_result": { "tests_run": 12, "tests_passed": 12, "log": "..." },
  "cooldown_until": null,
  "attempt_number": 1,
  "xp_awarded": null
}
```

### `GET /quests/{quest_id}/help`
Optional. Returns the same `learning_materials_html` plus task-level hints; powers the "Need help?" button.

---

## 12. Raid (`/dashboard/raid`)

**File:** `src/pages/dashboard/Raid.tsx`

### `GET /me/raids/active`
The user's currently active raid + group + per-member status.

```jsonc
{
  "raid": {
    "id": "uuid",
    "name": "Multi-agent customer support bot",
    "description": "Build a system that answers customer tickets from a docs corpus.",
    "is_activated": true,
    "activated_at": "...",
    "deadline_at": "2026-04-27T23:59:00Z",
    "duration_days": 7,
    "submission_type": "git_repository",
    "repository_naming_convention": "raid-07-multi-agent",
    "language_required": "python",
    "xp_reward": 1200,
    "requires_code_explanation": true
  },
  "group": {
    "id": "uuid",
    "name": "Team #07",
    "max_size": 3,
    "members": [
      {
        "user_id": "uuid",
        "first_name": "Adaeze",
        "last_name": "Okafor",
        "initials": "AO",
        "is_me": true,
        "commits_count": 12,
        "explanation_status": "ready|needs_explanation|could_not_explain|pending"
      }
    ],
    "community_post_channel_id": "uuid"     // group chat channel; opens via /community
  },
  "repository": {
    "id": "uuid",
    "gitea_clone_url": "https://gitea.../org/team-07.git",
    "last_push_detected_at": "...",
    "recent_commits": [
      { "hash":"abc1234","author":"TK","message":"evaluator fixtures","time":"..." }
    ]
  },
  "submission": null                          // or current Submission
}
```

### `POST /raids/{raid_id}/submissions`
Marks the group's repo as submitted. Body is minimal because the actual code is in Gitea.

```jsonc
// request
{ "commit_hash": "abc1234", "notes": "Final submit" }
// response — Submission
{ "id": "uuid", "status": "system_checking|awaiting_audit", "submitted_at": "..." }
```

### `GET /me/raids/{raid_id}/audit-status`
Polled while the group is awaiting their raid audit (so each member can see "K. Eze still needs to explain her code").

```jsonc
{
  "audit": {
    "id": "uuid",
    "status": "assigned|awaiting_explanation|in_progress|completed",
    "conference_link": "https://meet.google.com/...",
    "conference_held_at": null,
    "code_explanation_results": {
      "user_id_42": "explained",
      "user_id_43": "could_not_explain"
    },
    "result": null
  }
}
```

---

## 13. Audits (`/dashboard/audits`)

**File:** `src/pages/dashboard/Audits.tsx`

The student is acting **as auditor** here (peer auditing other students' work).

### `GET /me/audits`
Lists audits assigned to the current user.

```jsonc
{
  "stats": { "assigned": 3, "completed": 18, "categories": 5 },
  "data": [
    {
      "id": "uuid",
      "submission_id": "uuid",
      "submittable_type": "quest|raid",
      "auditee": { "first_name": "Tunde", "last_name": "Kazeem", "initials": "TK" },
      "title": "Tunde's RAG pipeline",
      "description": "Score code quality...",
      "status": "assigned|awaiting_explanation|in_progress|completed",
      "due_at": "2026-04-25T18:00:00Z",
      "xp_reward": 40,
      "risk_flags": ["ai-check"],            // optional surfacing of suspect submissions
      "repository": { "gitea_clone_url": "https://gitea..." }
    }
  ]
}
```

### `GET /audits/{audit_id}`
Detail for the audit drawer / page when the student clicks "Start audit".

```jsonc
{
  "audit": { ...Audit fields... },
  "submission": { ...Submission fields... },
  "verification_code": "X4F-7Q2",            // generated; shown to both parties
  "checklist": [
    {
      "id": "uuid",
      "category": "requirement|functional|compliance|bonus|social",
      "question_text": "Did the repo clone successfully?",
      "question_type": "yes_no|scale|text|multiple_choice",
      "options": ["yes","no"],
      "has_consequence": true,
      "order": 1
    }
  ]
}
```

### `POST /audits/{audit_id}/verify`
Both parties enter the verification code. The endpoint is idempotent and tracks who has confirmed.

```jsonc
// request
{ "code": "X4F-7Q2" }
// response
{ "auditor_verified": true, "auditee_verified": true, "audit_status": "in_progress" }
```

### `POST /audits/{audit_id}/submit`
Final audit submission.

```jsonc
// request
{
  "clone_successful": true,
  "is_functional": true,
  "meets_requirements": true,
  "compliance_checks": {
    "correct_language": true,
    "allowed_packages": true,
    "no_hardcoded_answers": true
  },
  "checklist_responses": [
    { "question_id": "uuid", "value": "yes" },
    { "question_id": "uuid", "value": 4 }
  ],
  "bonus_responses": { "code_efficient": true, "best_practices": true },
  "feedback": "Solid work. Hybrid retrieval edge cases need handling.",
  "result": "pass|fail"
}
// response — Audit + xp awarded to auditor
{
  "audit": { "id":"uuid","status":"completed","result":"pass","completed_at":"...","xp_modifier":40 },
  "auditor_xp_awarded": 40
}
```

### `GET /audits/rubric`
Returns the standard 5-category rubric (Requirement / Functional / Compliance / Bonus / Social) shown in the right-rail of `/audits`. Could also be hardcoded; making it an endpoint lets admins tweak per-program copy.

---

## 14. Checkpoints (`/dashboard/checkpoints`)

**File:** `src/pages/dashboard/Checkpoints.tsx`

### `GET /me/checkpoints/current`
The active or upcoming checkpoint plus readiness data.

```jsonc
{
  "checkpoint": {
    "id": "uuid",
    "name": "Embeddings & Retrieval Checkpoint",
    "description": "...",
    "parent_type": "subject",
    "parent_id": "uuid",
    "duration_minutes": 240,
    "format": "online|in_person|hybrid",
    "passing_score": 70,
    "max_attempts": 2,
    "attempts_used": 0,
    "requires_device": "laptop",
    "scheduled_at": "2026-04-26T10:00:00Z",
    "is_activated": false,
    "activation_lead_minutes": 10
  },
  "readiness": {
    "current_completion_pct": 72,
    "required_completion_pct": 80,
    "is_eligible": false,
    "remaining_quests": 3
  },
  "prep_materials": {
    "video_url": "...",
    "title": "Subject recap: Embeddings and retrieval"
  }
}
```

### `GET /me/curriculum-path`
Drives the bottom "curriculum path" grid. Each item is a Subject with completion state.

```jsonc
{
  "data": [
    { "id":"uuid","order":1,"name":"Python Foundations",   "status":"done","score":92,"xp_reward":200 },
    { "id":"uuid","order":2,"name":"Data and Linear Algebra","status":"done","score":88,"xp_reward":220 },
    { "id":"uuid","order":3,"name":"Embeddings and Vector Search","status":"current","xp_reward":250 },
    { "id":"uuid","order":4,"name":"Prompt Engineering","status":"locked","xp_reward":270 }
  ]
}
```

### `POST /checkpoints/{checkpoint_id}/start`
Starts an attempt. Returns the question set (drawn from the bank if `question_pool_size` is set).

```jsonc
{
  "attempt_id": "uuid",
  "deadline_at": "2026-04-26T14:00:00Z",
  "questions": [
    {
      "id": "uuid",
      "question_text": "<html>",
      "question_type": "multiple_choice|code|short_answer|free_response",
      "options": ["A","B","C","D"],
      "points": 10
    }
  ]
}
```

### `POST /checkpoints/attempts/{attempt_id}/submit`
Answers + final submit.

```jsonc
// request
{
  "responses": [
    { "question_id":"uuid", "answer":"A" },
    { "question_id":"uuid", "answer":"...code..." }
  ]
}
// response
{ "score": 76, "passed": true, "xp_awarded": 250, "unlocks_next_subject": true }
```

### `POST /me/checkpoints/{checkpoint_id}/reflection`
Stores the free-text "What did you learn in this subject?" reflection. Persisted on `Submission.response_data` or a `reflection` JSON column on `Enrollment` — pick one in BE; FE just sends the text.

```jsonc
// request
{ "text": "I learned how vector similarity works..." }
// response
{ "saved_at": "..." }
```

---

## 15. Leaderboard (`/dashboard/leaderboard`)

**File:** `src/pages/dashboard/Leaderboard.tsx`

### `GET /leaderboards?scope=cohort|campus|course|program&metric=xp_total|quests_completed|raids_passed&page=1&page_size=50`

```jsonc
{
  "scope": { "type": "cohort", "id": "uuid", "label": "October 2026 Cohort" },
  "metric": "xp_total",
  "me": {
    "rank": 13,
    "rank_total": 150,
    "xp_total": 2480,
    "level": 2,
    "rank_delta_this_week": 6
  },
  "next_above_me": {
    "user_id": "uuid",
    "name": "Halima Sani",
    "xp_total": 6280,
    "xp_gap": 3800
  },
  "data": [
    {
      "user_id": "uuid",
      "rank": 1,
      "name": "Ibrahim Musa",
      "initials": "IM",
      "level": 4,
      "level_title": "Architect",
      "xp_total": 9820,
      "quests_completed": 28,
      "raids_passed": 6,
      "rank_change": 0,
      "current_badge": "Architect",
      "is_me": false
    }
  ],
  "page": 1, "page_size": 50, "total": 150
}
```

---

## 16. Community (`/dashboard/community`)

**File:** `src/pages/dashboard/Community.tsx`

A channels + DM UI.

### `GET /me/community/channels`
Returns the user's accessible community groups (channel shapes), the announcement channel, plus the program-wide global feed and the user's current raid group channel.

```jsonc
{
  "data": [
    { "id": "global",         "kind": "global_feed",      "name": "general",           "topic": "Global feed for everyone",       "is_locked": false },
    { "id": "announcements",  "kind": "announcements",    "name": "announcements",     "topic": "Admin-controlled information",   "is_locked": true },
    { "id": "uuid",           "kind": "raid_team",        "name": "weekly-raid-group", "topic": "Your raid group",                "is_locked": false, "group_id": "uuid" },
    { "id": "uuid",           "kind": "community_group",  "name": "lagos-cohort-03",   "topic": "Auto-assigned community group",  "is_locked": false, "group_id": "uuid", "lifespan_ends_at": "..." }
  ]
}
```

### `GET /community/channels/{channel_id}/posts?cursor=...&limit=50`
Paginated, reverse-chronological. The `channel_id` corresponds to `Group.id` (or a sentinel `global`/`announcements`).

```jsonc
{
  "data": [
    {
      "id": "uuid",
      "author": { "user_id":"uuid","name":"Ibrahim Musa","initials":"IM","role":"mentor|admin|student" },
      "content": "<text or light html>",
      "created_at": "...",
      "updated_at": null,
      "is_pinned": false,
      "parent_post_id": null,
      "reply_count": 0
    }
  ],
  "next_cursor": "opaque"
}
```

### `POST /community/channels/{channel_id}/posts`

```jsonc
// request
{ "content": "I just finished the embeddings module.", "parent_post_id": null }
// response — Post
```

### `PATCH /community/posts/{post_id}` / `DELETE /community/posts/{post_id}`
Edit / soft-delete the user's own post.

### `GET /me/dms`
List of DM threads (one row per other party).

```jsonc
{
  "data": [
    { "user_id":"uuid","name":"Ibrahim Musa","initials":"IM","last_message":"...","last_at":"...","unread":2 }
  ]
}
```

### `GET /me/dms/{user_id}/messages?cursor=...&limit=50`

```jsonc
{
  "data": [
    { "id":"uuid","sender_user_id":"uuid","content":"...","sent_at":"...","read_at":"..." }
  ],
  "next_cursor": "opaque"
}
```

### `POST /me/dms/{user_id}/messages`

```jsonc
{ "content": "hey, ready for the audit?" }
// response — DirectMessage
```

### `POST /me/dms/{user_id}/read`
Marks the thread as read.

### `GET /me/friends?status=accepted|pending|incoming`
Lists friendships in a given state.

### `POST /me/friends/{user_id}` / `DELETE /me/friends/{user_id}`
Send / cancel a friend request, or remove an accepted friendship.

### `POST /me/friends/{user_id}/respond`
```jsonc
{ "action": "accept|decline|block" }
```

---

## 17. Achievements (`/dashboard/achievements`)

**File:** `src/pages/dashboard/Achievements.tsx`

### `GET /me/achievements`
Returns every achievement available to the user's program/org plus the user's `UserAchievement` progress for each. Hidden achievements that haven't been unlocked are omitted.

```jsonc
{
  "stats": { "earned": 4, "total": 12 },
  "data": [
    {
      "id": "uuid",
      "name": "Vector Initiate",
      "description": "Completed embeddings checkpoint.",
      "icon_url": "...",
      "rarity": "common|rare|epic|legendary",
      "criteria_type": "quest_count|raid_count|...",
      "criteria_config": { "count": 10 },
      "xp_bonus": 50,
      "unlocked": true,
      "unlocked_at": "2026-04-14T...",
      "progress": { "current": 10, "target": 10 }
    },
    {
      "id": "uuid",
      "name": "Logbook Loyalist",
      "rarity": "rare",
      "unlocked": false,
      "progress": { "current": 18, "target": 30 }
    }
  ]
}
```

---

## 18. Workspace (`/dashboard/workspace`)

**File:** `src/pages/dashboard/Workspace.tsx`

The platform owns thin mappings (`GiteaRepository`); Gitea owns the actual repo data. The FE should not call Gitea directly — the platform proxies.

### `GET /me/repositories`
Lists the user's repos (quest + raid). Mirrors `GiteaRepository`.

```jsonc
{
  "data": [
    {
      "id": "uuid",
      "gitea_repo_id": 1234,
      "gitea_repo_name": "rag-pipeline-quest",
      "gitea_clone_url": "https://gitea.../adaeze/rag-pipeline-quest.git",
      "purpose": "quest|raid",
      "quest_id": "uuid",
      "raid_id": null,
      "group_id": null,
      "default_branch": "main",
      "primary_language": "Python",
      "commits_count": 24,
      "last_push_detected_at": "2026-04-25T...",
      "description": "RAG quest submission"
    }
  ]
}
```

### `GET /repositories/{repo_id}`
Detail of one repo (header card + branch + language + commits count).

### `GET /repositories/{repo_id}/tree?path=&ref=main`
File tree for the file explorer. Proxies Gitea's contents API.

```jsonc
{
  "ref": "main",
  "path": "",
  "entries": [
    { "name": "src",            "type": "folder" },
    { "name": "README.md",      "type": "file", "size": 1320 },
    { "name": "ingest.py",      "type": "file", "size": 1840 }
  ]
}
```

### `GET /repositories/{repo_id}/file?path=src/ingest.py&ref=main`
File content for the viewer.

```jsonc
{
  "path": "src/ingest.py",
  "ref": "main",
  "language": "python",
  "size_bytes": 1840,
  "line_count": 42,
  "content": "from pinecone import Pinecone\n..."
}
```

### `GET /repositories/{repo_id}/commits?limit=20&ref=main`

```jsonc
{
  "data": [
    {
      "hash": "a3f9b2c",
      "short_hash": "a3f9b2c",
      "message": "feat: add hybrid retrieval scorer",
      "author": { "name": "you", "email": "...", "avatar_url": "..." },
      "committed_at": "2026-04-25T..."
    }
  ]
}
```

### `POST /repositories`
"New repo" button. Provisions a new GiteaRepository under the user's GiteaAccount. (May be admin-restricted; safe to expose to students for personal scratch repos.)

```jsonc
// request
{ "name": "experiment-1", "description": "scratch space", "private": true }
// response — full GiteaRepository
```

### `POST /repositories/{repo_id}/star` / `DELETE /repositories/{repo_id}/star`
Optional. The "Star" button is currently decorative; if the BE wants it functional, proxy Gitea's stars API.

> The "Push work" button on the page is a UI affordance pointing the user to the Gitea web UI / their local clone — there is no platform endpoint for pushing.

---

## 19. Logbook (`/dashboard/logbook`)

**File:** `src/pages/dashboard/Logbook.tsx`

### `GET /me/logbook`
Returns the user's `Logbook` shell + the current week's entries + the latest weekly report.

```jsonc
{
  "logbook": {
    "id": "uuid",
    "status": "in_progress|pending_signature|signed|completed",
    "campus_supervisor": { "name": "Mr. Chukwu", "email": "..." }
  },
  "current_week": {
    "week_number": 4,
    "total_weeks": 24,
    "start_date": "2026-04-21",
    "end_date": "2026-04-25",
    "entries": [
      {
        "id": "uuid",
        "entry_date": "2026-04-21",
        "day_label": "Mon",
        "content": "Built RAG ingest script...",
        "hours_worked": 6,
        "supervisor_name": "Mr. Chukwu",
        "supervisor_signed": true,
        "submitted_at": "..."
      },
      { "entry_date": "2026-04-25", "day_label": "Fri", "content": null }   // today, unfilled
    ]
  },
  "weekly_report": null                       // or a WeeklyReport object
}
```

### `POST /me/logbook/entries`
Save / upsert today's entry.

```jsonc
// request
{
  "entry_date": "2026-04-25",
  "content": "Implemented hybrid BM25 + vector reranker. Ran eval...",
  "hours_worked": 6,
  "supervisor_name": "Mr. Chukwu"
}
// response — LogbookEntry
```

### `PATCH /me/logbook/entries/{entry_id}`
Edit a previously saved (but unsigned) entry.

### `POST /me/logbook/weekly-reports/generate`
Calls the AI summarizer over this week's entries. Returns a draft.

```jsonc
// request
{ "week_number": 4 }
// response — WeeklyReport
{
  "id": "uuid",
  "week_number": 4,
  "start_date": "2026-04-21",
  "end_date": "2026-04-25",
  "generated_content": "This week the student built and deployed...",
  "generated_by": "system_ai",
  "final_content": "This week the student built and deployed...",
  "status": "draft"
}
```

### `PATCH /me/logbook/weekly-reports/{report_id}`
User edits the final text before submitting.

```jsonc
{ "final_content": "..." }
```

### `POST /me/logbook/weekly-reports/{report_id}/submit`
Submits the report for supervisor signing.

```jsonc
// response
{ "status": "submitted|signed", "submitted_at": "..." }
```

---

## 20. Profile (`/dashboard/profile`)

**File:** `src/pages/dashboard/Profile.tsx`

### `GET /me/profile`

```jsonc
{
  "user": {
    "id": "uuid",
    "first_name": "Adaeze",
    "last_name": "Okonkwo",
    "email": "...",
    "phone": "...",
    "avatar_url": "...",
    "bio": "...",
    "location": "Lagos, Nigeria",
    "joined_at": "2026-03-04",
    "github_handle": "adaeze-dev"           // optional, denormalized from GiteaAccount mapping or user metadata
  },
  "enrollment": {
    "rank": 24,
    "xp_total": 2480,
    "quests_completed": 12,
    "raids_completed": 2,
    "streak_days": 7,
    "level": 2,
    "level_title": "AI Engineering"
  },
  "submissions": [
    { "id": "uuid", "name": "rag-pipeline-quest", "type": "Quest repo", "status": "passed" },
    { "id": "uuid", "name": "vector-bench",       "type": "Raid repo",  "status": "validated" }
  ],
  "badges": [
    { "id":"uuid","name":"Vector Initiate","icon_url":"...","rarity":"rare" }
  ]
}
```

### `PATCH /me/profile`
"Edit profile" button.

```jsonc
{
  "first_name": "Adaeze",
  "last_name": "Okonkwo",
  "phone": "...",
  "bio": "...",
  "avatar_url": "https://cdn..."           // already uploaded via /uploads/presign
}
```

### `POST /me/password`
Self-serve password change.

```jsonc
{ "current_password": "...", "new_password": "..." }
```

---

## 21. Notifications (`/dashboard/notifications`)

**File:** `src/pages/dashboard/Notifications.tsx`

Notifications are emitted via `NotificationTemplate` + system events (`application_accepted`, `quest_unlocked`, `submission_graded`, …). Persisted as a `Notification` row per user (the data model implies this implicitly — flag for BE to add the entity if missing).

### `GET /me/notifications?unread_only=false&page=1&page_size=50`

```jsonc
{
  "unread_count": 3,
  "data": [
    {
      "id": "uuid",
      "event_trigger": "quest_unlocked",
      "title": "Complete your learning to unlock today's quest",
      "body": "You're 65% through the Learn phase. Quest closes at 11:59 PM.",
      "icon_hint": "play_circle",
      "tone": "primary|accent|warning|destructive|violet",
      "created_at": "2026-04-25T...",
      "read_at": null,
      "deep_link": "/dashboard/learn",     // FE uses for click navigation
      "context": {                          // optional structured payload tied to event
        "quest_id": "uuid",
        "deadline_at": "..."
      }
    }
  ]
}
```

### `POST /me/notifications/{notification_id}/read`
Mark one as read.

### `POST /me/notifications/read-all`
"Mark all read" button.

### `GET /me/notification-preferences` / `PATCH /me/notification-preferences`
Optional. Per-channel (in-app / email / sms) opt-outs per `event_trigger`.

---

## 22. Realtime channel

A single websocket connection at `wss://api/.../realtime?token=...` carrying server-pushed events. The FE subscribes once and dispatches into local stores; every event has a REST equivalent above so the UI degrades gracefully.

Event payloads:

```jsonc
// notification.created
{ "type":"notification.created", "payload": { ...Notification object... } }

// xp.changed   — drives the topbar XP counter and rank chip animations
{ "type":"xp.changed", "payload": { "xp_total": 2520, "delta": 40, "source": "quest_completion", "source_id":"uuid" } }

// rank.changed
{ "type":"rank.changed", "payload": { "rank": 23, "previous_rank": 24 } }

// streak.updated
{ "type":"streak.updated", "payload": { "current_streak": 8, "milestone_unlocked": null } }

// quest.unlocked  /  quest.deadline_warning
{ "type":"quest.unlocked", "payload": { "quest_id":"uuid", "name":"..." } }

// submission.graded
{ "type":"submission.graded", "payload": { "submission_id":"uuid", "status":"passed|failed", "xp_awarded": 180 } }

// audit.assigned
{ "type":"audit.assigned", "payload": { "audit_id":"uuid", "due_at":"..." } }

// audit.verification_code_entered  — both parties type the code
{ "type":"audit.verification_code_entered", "payload": { "audit_id":"uuid", "by":"auditor|auditee" } }

// raid.member_explanation_status
{ "type":"raid.member_explanation_status", "payload": { "raid_id":"uuid","group_id":"uuid","user_id":"uuid","status":"ready|could_not_explain" } }

// community.post.created   /  community.post.deleted
{ "type":"community.post.created", "payload": { "channel_id":"uuid", "post": { ...Post... } } }

// dm.received
{ "type":"dm.received", "payload": { "from_user_id":"uuid","message": { ...DirectMessage... } } }

// achievement.unlocked
{ "type":"achievement.unlocked", "payload": { "achievement_id":"uuid","name":"Vector Initiate","xp_bonus":50 } }

// record.applied   — admin-imposed Record / RecordEffect
{ "type":"record.applied", "payload": { "record_id":"uuid","type":"restriction","dashboard_notice":"..." } }
```

---

## Endpoint summary table

| Page                          | Endpoint                                                            | Method | Backing entities                                              |
|-------------------------------|---------------------------------------------------------------------|--------|---------------------------------------------------------------|
| Landing                       | `/public/active-cohort`                                             | GET    | ApplicationCohort, Program                                    |
| Register                      | `/auth/register-applicant` (Bearer auth)                            | POST   | User, StudentProfile, Application, RegistrationDocument       |
| Register                      | `/campuses`                                                         | GET    | Campus                                                        |
| Register                      | `/uploads/presign`                                                  | POST   | (S3)                                                          |
| Register                      | `/applications/{id}/registration-documents`                         | POST   | RegistrationDocument                                          |
| Auth (shared)                 | `/auth/signup`, `/auth/login`, `/auth/logout`, `/auth/session`      | POST/GET | User, Application, Enrollment, ProgressionStage             |
| Assessment                    | `/me/selection-game`                                                | GET    | SelectionGame, GameAttempt                                    |
| GamePlay                      | `/me/selection-game/attempts/start`                                 | POST   | GameAttempt                                                   |
| GamePlay                      | `/me/selection-game/attempts/{id}/complete`                         | POST   | GameAttempt, Application                                      |
| Result                        | `/me/selection-game/attempts/latest`                                | GET    | GameAttempt, Application                                      |
| Status                        | `/me/application`                                                   | GET    | Application, VerificationRequest                              |
| Onboarding                    | `/me/onboarding-documents`                                          | GET    | OnboardingDocument                                            |
| Onboarding                    | `/me/onboarding-documents`                                          | POST   | OnboardingDocument                                            |
| Onboarding                    | `/me/onboarding/acknowledge`                                        | POST   | Application                                                   |
| Dashboard shell               | `/me`                                                               | GET    | User, Enrollment, Streak, Notification (count)                |
| Dashboard shell               | `/me/dashboard-search`                                              | GET    | Quest, GiteaRepository, User, Module                          |
| Home                          | `/me/dashboard/home`                                                | GET    | Enrollment, Quest, Checkpoint, Raid, XPTransaction, Streak    |
| Learn                         | `/me/learn/current`                                                 | GET    | Subject, Course, Topic, Module                                |
| Learn                         | `/modules/{id}`                                                     | GET    | Module                                                        |
| Learn                         | `/modules/{id}/progress`                                            | POST   | Module, XPTransaction, Quest (unlocks)                        |
| Quests                        | `/me/quests/active`                                                 | GET    | Quest, QuestTask, Submission                                  |
| Quests                        | `/quests/{id}/attempts`                                             | POST   | Submission, GiteaRepository                                   |
| Quests                        | `/quests/{id}/submissions`                                          | POST   | Submission                                                    |
| Quests                        | `/me/submissions/{id}`                                              | GET    | Submission                                                    |
| Quests                        | `/quests/{id}/help`                                                 | GET    | Quest, QuestTask                                              |
| Raid                          | `/me/raids/active`                                                  | GET    | Raid, Group, GroupMember, GiteaRepository                     |
| Raid                          | `/raids/{id}/submissions`                                           | POST   | Submission                                                    |
| Raid                          | `/me/raids/{id}/audit-status`                                       | GET    | Audit                                                         |
| Audits                        | `/me/audits`                                                        | GET    | Audit, Submission                                             |
| Audits                        | `/audits/{id}`                                                      | GET    | Audit, Submission, AuditQuestion                              |
| Audits                        | `/audits/{id}/verify`                                               | POST   | Audit                                                         |
| Audits                        | `/audits/{id}/submit`                                               | POST   | Audit, XPTransaction                                          |
| Audits                        | `/audits/rubric`                                                    | GET    | AuditQuestion (template)                                      |
| Checkpoints                   | `/me/checkpoints/current`                                           | GET    | Checkpoint                                                    |
| Checkpoints                   | `/me/curriculum-path`                                               | GET    | Subject, Enrollment                                           |
| Checkpoints                   | `/checkpoints/{id}/start`                                           | POST   | Checkpoint, CheckpointQuestion, Submission                    |
| Checkpoints                   | `/checkpoints/attempts/{id}/submit`                                 | POST   | Submission, XPTransaction, Enrollment                         |
| Checkpoints                   | `/me/checkpoints/{id}/reflection`                                   | POST   | Submission (or Enrollment.metadata)                           |
| Leaderboard                   | `/leaderboards`                                                     | GET    | Leaderboard, Enrollment, XPTransaction                        |
| Community                     | `/me/community/channels`                                            | GET    | Group                                                         |
| Community                     | `/community/channels/{id}/posts`                                    | GET    | Post                                                          |
| Community                     | `/community/channels/{id}/posts`                                    | POST   | Post                                                          |
| Community                     | `/community/posts/{id}`                                             | PATCH  | Post                                                          |
| Community                     | `/community/posts/{id}`                                             | DELETE | Post                                                          |
| Community                     | `/me/dms`                                                           | GET    | DirectMessage                                                 |
| Community                     | `/me/dms/{user_id}/messages`                                        | GET    | DirectMessage                                                 |
| Community                     | `/me/dms/{user_id}/messages`                                        | POST   | DirectMessage                                                 |
| Community                     | `/me/dms/{user_id}/read`                                            | POST   | DirectMessage                                                 |
| Community                     | `/me/friends`                                                       | GET    | Friendship                                                    |
| Community                     | `/me/friends/{user_id}`                                             | POST/DELETE | Friendship                                               |
| Community                     | `/me/friends/{user_id}/respond`                                     | POST   | Friendship                                                    |
| Achievements                  | `/me/achievements`                                                  | GET    | Achievement, UserAchievement                                  |
| Workspace                     | `/me/repositories`                                                  | GET    | GiteaRepository                                               |
| Workspace                     | `/repositories/{id}`                                                | GET    | GiteaRepository                                               |
| Workspace                     | `/repositories/{id}/tree`                                           | GET    | (Gitea proxy)                                                 |
| Workspace                     | `/repositories/{id}/file`                                           | GET    | (Gitea proxy)                                                 |
| Workspace                     | `/repositories/{id}/commits`                                        | GET    | (Gitea proxy)                                                 |
| Workspace                     | `/repositories`                                                     | POST   | GiteaRepository, GiteaAccount                                 |
| Logbook                       | `/me/logbook`                                                       | GET    | Logbook, LogbookEntry, WeeklyReport                           |
| Logbook                       | `/me/logbook/entries`                                               | POST/PATCH | LogbookEntry                                              |
| Logbook                       | `/me/logbook/weekly-reports/generate`                               | POST   | WeeklyReport                                                  |
| Logbook                       | `/me/logbook/weekly-reports/{id}`                                   | PATCH  | WeeklyReport                                                  |
| Logbook                       | `/me/logbook/weekly-reports/{id}/submit`                            | POST   | WeeklyReport                                                  |
| Profile                       | `/me/profile`                                                       | GET    | User, Enrollment, Submission, UserAchievement                 |
| Profile                       | `/me/profile`                                                       | PATCH  | User                                                          |
| Profile                       | `/me/password`                                                      | POST   | User                                                          |
| Notifications                 | `/me/notifications`                                                 | GET    | Notification                                                  |
| Notifications                 | `/me/notifications/{id}/read`                                       | POST   | Notification                                                  |
| Notifications                 | `/me/notifications/read-all`                                        | POST   | Notification                                                  |
| Notifications                 | `/me/notification-preferences`                                      | GET/PATCH | NotificationTemplate (per-user prefs)                      |
| Realtime                      | `wss:/realtime?token=...`                                           | WS     | (all of the above)                                            |

---

## Open questions / FE-BE alignment notes

1. **Authentication boundary.** Updated flow is account-first: `/auth/signup` issues JWTs immediately, then authenticated `/auth/register-applicant` creates the application profile.
2. **Selection game shape.** The FE today renders fixed mini-games (memory/logic/speed) entirely client-side. The contract treats this as `attempt_data: JSON`. If admins start authoring real game content, the BE will need to serve questions per round — expand `SelectionGame.configuration` and add `GET /me/selection-game/attempts/{id}/next-round`.
3. **Checkpoint reflection.** The system-design doc has no `Reflection` entity. Two options: (a) store on `Submission.response_data` for the checkpoint's first task, (b) add a `reflection_text` JSON key on `Enrollment.metadata`. I picked (a) implicitly above — confirm with BE.
4. **Notification entity.** `NotificationTemplate` is in the data model but a per-user `Notification` row isn't. The BE will need to add it (or we can compute it on the fly from event logs — likely too expensive). Treat the table as required.
5. **Workspace "Push work" / "Star".** Currently UI affordances. If the BE wants real implementations, document them; otherwise mark as cosmetic in the FE.
6. **GitHub handle on Profile.** The FE shows `@adaeze-dev` — the data model has `GiteaAccount.gitea_username`, not GitHub. Likely a UI label drift; surface `gitea_username` as `workspace_handle` and let the FE relabel.
7. **DM between any two users.** The data model allows this, but the community wiki implies "no group DMs — multi-person convos happen in groups." That's fine; the contract above only documents 1:1 DMs.
8. **File upload flow.** The contract assumes presigned S3. If BE prefers multipart-direct, swap `POST /me/onboarding-documents` and `POST /applications/{id}/registration-documents` to accept `multipart/form-data` and drop `/uploads/presign`.


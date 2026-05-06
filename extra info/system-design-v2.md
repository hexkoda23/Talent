# Learning Platform — System Design: Data Entities (v2)

## Overview

This document defines the data entities for a configurable online learning platform built for **Nigerian SIWES (Students Industrial Work Experience Scheme) students**. The program is primarily online and structured into **four tracks**: Track A (experienced backend/fullstack developers) and Track B (zero coding background), each available in 3-month and 6-month variants. Participants are recruited through a gamified selection process, verified against their institutions, onboarded with official SIWES documentation (CYS forms, logbooks), and then progress through a structured curriculum of subjects, courses, quests, and group challenges.

The platform handles the full lifecycle: **application → game-based selection → institutional verification → onboarding → learning → graduation**, with gamification (XP, rankings, achievements, streaks), peer auditing, Git-integrated code submission, and a community layer.

Every major behavior — notifications, progression rules, evaluation criteria, group sizes, content rendering — should be **configurable per program, per campus, and per cohort**, not hardcoded.

---

## 1. Organization & Infrastructure

### 1.1 `Organization`
The top-level tenant. Everything belongs to an organization.

- `id`
- `name`
- `slug`
- `logo_url`
- `created_at`
- `settings` — JSON, global defaults (timezone, locale, branding, theme, etc.)

### 1.2 `Campus`
A physical location tied to SIWES administration. Even though the program is online, campus selection is required because SIWES involves physical documentation — logbook signing, CYS form stamping, and periodic campus admin interactions. A campus represents the physical office or center a student is assigned to for these purposes.

- `id`
- `organization_id`
- `name`
- `location` — city, state, address
- `timezone`
- `capacity`
- `signing_contact` — JSON (name, email, phone of the campus admin responsible for signing)
- `settings_overrides` — JSON, campus-level overrides to org defaults

### 1.3 `NotificationTemplate`
Configurable notification content. Every system event that triggers a notification references a template, and templates are editable per program or campus.

- `id`
- `organization_id`
- `event_trigger` — enum/string (e.g., `application_accepted`, `verification_passed`, `verification_rejected`, `onboarding_reminder`, `quest_unlocked`, `checkpoint_reminder`, `group_assigned`, `cohort_closed`, `restriction_applied`, `submission_graded`)
- `channel` — enum: `in_app`, `email`, `sms`, `push`
- `subject_template` — string with variable placeholders (e.g., `"Congratulations, {{first_name}}!"`)
- `body_template` — string with variable placeholders
- `is_active` — boolean
- `scope` — polymorphic: can be scoped to a specific `program_id`, `campus_id`, or left global
- `locale` — language code

---

## 2. Users & Roles

### 2.1 `User`
A single identity in the system. A user can hold multiple roles across programs.

- `id`
- `organization_id`
- `first_name`
- `last_name`
- `email`
- `phone`
- `avatar_url`
- `date_of_birth`
- `nin` — National Identification Number, used for identity verification and preventing duplicate registrations
- `bio`
- `location` — nullable; may be inferred from IP at registration
- `created_at`
- `is_active` — boolean
- `metadata` — JSON, extensible fields

### 2.2 `StudentProfile`
SIWES-specific information attached to a user who is a student. Separated from `User` because not all users are students (admins, mentors, campus admins are not), and because this data is only collected after game selection.

- `id`
- `user_id`
- `institution_name` — university or polytechnic
- `institution_email` — the school's contact email (for verification outreach)
- `matric_number`
- `department`
- `level` — e.g., 300-level, 400-level
- `campus_id` — the physical campus the student selected
- `verification_status` — enum: `pending`, `verified`, `rejected`
- `verified_at` — nullable
- `verified_by` — nullable, user ID of admin who verified
- `rejection_reason` — nullable, internal-only (not shown to student to avoid disputes)
- `metadata` — JSON

### 2.3 `Role`
Named roles that govern permissions.

- `id`
- `name` — e.g., `superadmin`, `campus_admin`, `coding_mentor`, `student`, `candidate`, `campus admin`
- `description`
- `permissions` — list of permission keys or reference to `PermissionSet`

### 2.4 `UserRole`
Assigns a role to a user within a specific scope (org, campus, or program).

- `id`
- `user_id`
- `role_id`
- `scope_type` — enum: `organization`, `campus`, `program`
- `scope_id`
- `assigned_at`
- `assigned_by` — user ID

### 2.5 `PermissionSet`
Fine-grained permissions attached to roles.

- `id`
- `role_id`
- `permissions` — list of permission strings (e.g., `records.create`, `audits.reassign`, `groups.manage`, `curriculum.edit`, `users.expel`, `cohort.close`, `verification.approve`)

---

## 3. Application & Selection Pipeline

This section covers the flow from initial registration through game-based selection, institutional verification, and onboarding — before a user ever enters the learning platform.

**Document collection happens in two stages.** At **registration**, applicants upload **basic documents** (school ID card, NIN scan, profile picture) — captured as `RegistrationDocument` records. These are needed to evaluate identity even before the game. At **onboarding** (after the game has been passed and the institution has confirmed the student), the candidate attends a physical or online onboarding session at their selected campus and submits **SIWES documents** (CYS form, logbook, acceptance letter) — captured as `OnboardingDocument` records. This split avoids putting every applicant through full SIWES paperwork before they even know whether they passed the game.

**Verification only runs for applicants who passed the game.** Immediately after the game window closes, the platform produces a **scoreboard** of every applicant and their score, filterable by `game_score ≥ ApplicationCohort.game_cutoff_score`. Admins begin institutional verification only on the filtered set of passers. Applicants below the cutoff are not subjected to the manual verification stress and are eventually rejected at cohort close.

### 3.1 `ApplicationCohort`
A time-bound application cycle. When admins "close" a cohort, all remaining unaccepted applicants are rejected, rejection emails are sent, and their accounts/data are purged from the database.

- `id`
- `program_id`
- `name` — e.g., "October 2026 Intake"
- `opens_at` — when applications open
- `closes_at` — hard deadline, or nullable if closed manually
- `status` — enum: `open`, `in_review`, `closed`
- `closed_at` — nullable, when the admin pressed the close button
- `closed_by` — nullable, user ID
- `game_cutoff_score` — the minimum game score for automatic advancement to review
- `max_applicants` — nullable
- `purge_rejected_data` — boolean, default true (delete rejected applicant data after cohort closes)
- `metadata` — JSON

### 3.2 `Application`
An individual's application to a cohort. Created when the user registers. A dashboard is created for them immediately upon registration.

- `id`
- `user_id`
- `cohort_id`
- `campus_id` — selected by the applicant (before or during registration, since SIWES requires it)
- `status` — enum: `registered`, `game_pending`, `game_completed`, `review`, `verification_pending`, `verified`, `onboarding`, `accepted`, `rejected`
- `registered_at`
- `dashboard_created_at` — timestamp; dashboard exists from registration onward
- `game_score` — nullable, populated after game
- `passed_game` — boolean, nullable
- `payment_status` — enum: `pending`, `paid`, `waived`, `not_required`
- `rejection_email_sent` — boolean
- `metadata` — JSON

### 3.3 `SelectionGame`
The gamified assessment used to filter applicants. Each cohort has one game event.

- `id`
- `cohort_id`
- `name`
- `description`
- `scheduled_at` — datetime when the game becomes available
- `duration_minutes` — how long the game lasts once started
- `access_method` — enum: `dashboard_link`, `direct_url` (from transcript: "no need to send a separate link; they access it from the dashboard")
- `status` — enum: `upcoming`, `active`, `completed`
- `configuration` — JSON (question count, scoring rules, time penalties, etc.)

### 3.4 `GameAttempt`
A user's play-through of the selection game.

- `id`
- `user_id`
- `application_id`
- `started_at`
- `completed_at`
- `score`
- `passed` — boolean, determined by comparing score to `ApplicationCohort.game_cutoff_score`
- `attempt_data` — JSON (answers, timing, etc.)

### 3.5 `VerificationRequest`
A request sent to a student's institution to confirm their enrollment. The process is manual for now: bulk emails are sent to schools with the student's matric number and name, and the school responds to confirm or deny.

- `id`
- `application_id`
- `student_profile_id`
- `institution_email` — where the verification email was sent
- `sent_at`
- `status` — enum: `pending`, `confirmed`, `denied`, `no_response`
- `responded_at` — nullable
- `response_notes` — nullable, any notes from the institution
- `follow_up_count` — integer, how many reminder emails have been sent
- `verified_by` — nullable, admin who processed the response

### 3.6 `RegistrationDocument`
Basic identity documents uploaded **at registration time**, before the selection game. These are minimum-friction items needed to evaluate the applicant's identity without committing them to the full SIWES paperwork. Reviewed by admins as part of the verification stage (only for applicants who pass the game cutoff).

- `id`
- `application_id`
- `document_type` — enum: `school_id_card`, `nin_scan`, `profile_picture`, `government_id`, `other`
- `file_url` — uploaded scan/image
- `original_filename`
- `uploaded_at`
- `status` — enum: `pending_review`, `approved`, `rejected`, `needs_reupload`
- `reviewed_by` — nullable, admin user ID
- `reviewed_at` — nullable
- `rejection_reason` — nullable
- `metadata` — JSON

### 3.7 `OnboardingDocument`
Official **SIWES documents** required during the onboarding stage — CYS forms, logbooks, acceptance letters, and any school-specific items. Collected only after the applicant has passed the game and the institution has confirmed enrollment. The candidate attends a physical (or online, where regulations permit) onboarding session at their selected campus to submit and sign these documents.

- `id`
- `application_id`
- `document_type` — enum: `cys_form`, `logbook`, `acceptance_letter`, `other`
- `file_url` — uploaded scan/PDF
- `original_filename`
- `uploaded_at`
- `status` — enum: `pending_review`, `approved`, `rejected`, `needs_reupload`
- `reviewed_by` — nullable, admin user ID
- `reviewed_at` — nullable
- `rejection_reason` — nullable
- `requires_physical_signature` — boolean
- `physical_signature_status` — enum: `not_required`, `pending`, `signed`, nullable
- `signed_by` — nullable, name or user ID of the campus admin
- `signed_at` — nullable
- `onboarding_session_mode` — enum: `physical`, `online`, `hybrid`
- `onboarding_session_at` — nullable, datetime of the campus session where the document was submitted/signed
- `metadata` — JSON (school-specific requirements, format variations)

---

## 4. Programs & Curriculum Structure

The curriculum is organized as a **hierarchy of distinct entities**, not a single polymorphic type. This allows each level to carry its own fields, relationships, and behaviors, and to be extended independently as the platform evolves.

**Hierarchy: Program → Subject → Course → Topic → Module**
**Assessment layer: Quest, Checkpoint, Raid** (can attach at various levels of the hierarchy)

### Activation pattern

Each assessment entity (`Quest`, `Raid`, `Checkpoint`) carries an `is_activated` boolean. An item is **inert** until activated — its timers do not run, and on the student's frontend it appears greyed-out / read-only. Activation triggers depend on the entity:

- **Quest**: activated when the student reaches it in their sequential progression (or, for cohort-wide releases, at a scheduled time). Once activated, `time_limit_minutes` and the `xp_deadline` countdown begin.
- **Raid**: activated when groups have been formed and the shared Gitea repository is provisioned. The `duration_days` window starts from `activated_at`.
- **Checkpoint**: for scheduled checkpoints (with `start_date`, `start_time`), activation happens automatically `activation_lead_minutes` (default 10) before the scheduled time. For on-demand checkpoints it activates when the student reaches the curriculum gate.

A future extension can add the same `is_activated` pattern to `Module`/`Topic`/`Course` if cohort-wide content drops are needed; the field is intentionally local to each entity rather than polymorphic.

### 4.1 `Program`
The top-level training program. Programs come in multiple **tracks** and **durations**: Track A (students with prior backend/fullstack experience) and Track B (zero coding background), each available in 3-month and 6-month variants. A program entity represents one specific track-duration combination (e.g., "Track A — 6 Months"). This means the platform may run up to four distinct programs simultaneously under the same cohort cycle.

- `id`
- `organization_id`
- `name`
- `slug`
- `description`
- `track` — enum: `a_experienced`, `b_no_experience`; which entry-level track this program is
- `duration_months` — 3 or 6
- `max_cohort_size`
- `is_active`
- `created_at`
- `configuration` — JSON, holds program-level settings:
  - `requires_campus_selection` — boolean
  - `requires_institutional_verification` — boolean
  - `auto_accept_after_verification` — boolean
  - `max_group_size` — integer
  - `allows_peer_auditing` — boolean
  - `quest_submission_deadline_enforcement` — boolean
  - `cooldown_after_failed_submission` — duration
  - `default_checkpoint_duration_minutes`
  - `progression_mode` — enum: `sequential`, `flexible`
  - `purge_rejected_applicants` — boolean
  - `notification_overrides` — map of event_trigger → on/off or template_id

### 4.2 `Subject`
The broadest curriculum division. A subject groups related courses under a discipline.

Examples: "Web Development", "Data Structures & Algorithms", "DevOps Fundamentals", "Professional Readiness"

- `id`
- `program_id`
- `name`
- `slug`
- `description`
- `order` — integer, sequence within the program
- `icon_url` — nullable, for UI display
- `is_required` — boolean
- `is_sequential` — boolean; if true, must be completed before the next subject unlocks
- `estimated_duration_weeks`
- `metadata` — JSON

### 4.3 `Course`
A course within a subject. Courses are the main unit students "take" — they have a clear start/end and contain ordered topics.

Examples: "Intro to HTML & CSS", "Golang Fundamentals", "REST API Design"

- `id`
- `subject_id`
- `name`
- `slug`
- `description`
- `order` — integer, sequence within the subject
- `cover_image_url` — nullable
- `is_required` — boolean
- `is_sequential` — boolean
- `estimated_duration_hours`
- `language_focus` — nullable (e.g., `golang`, `javascript`, `python`)
- `xp_reward` — XP granted on course completion (in addition to XP from individual quests/modules within)
- `metadata` — JSON

### 4.4 `Topic`
A topic within a course. Topics group closely related modules and provide a conceptual boundary.

Examples: "CSS Flexbox", "Goroutines & Channels", "HTTP Methods"

- `id`
- `course_id`
- `name`
- `slug`
- `description`
- `order` — integer, sequence within the course
- `is_required` — boolean
- `is_sequential` — boolean
- `estimated_duration_minutes`
- `metadata` — JSON

### 4.5 `Module`
The atomic learning content unit. A module is what a student actually reads, watches, or works through. Content is stored as rich HTML (from a backend editor like TinyMCE), so it can contain text, embedded videos, images, code snippets, or any other media without the frontend needing specialized components per content type.

Examples: "What is Flexbox?", "Writing Your First Goroutine", "Setting Up a REST Server"

- `id`
- `topic_id`
- `name`
- `slug`
- `description` — short summary shown on cards
- `content_html` — the full module content, rendered directly by the frontend
- `order` — integer, sequence within the topic
- `is_required` — boolean
- `estimated_duration_minutes`
- `xp_reward` — XP granted on completion/read-through
- `has_attached_quest` — boolean (convenience flag; the actual link is on the Quest entity)
- `metadata` — JSON

### 4.6 `Quest`
A challenge or exercise consisting of one or more tasks/questions. Quests are the primary assessment and engagement mechanic. They are **sequential** — a student must complete earlier quests before accessing later ones. Quests can be attached to a module, topic, or course.

Each quest can have attached learning materials (targeted explanations, not full lectures) to help users solve its tasks. Quests may have timed XP windows: completing within the window earns full XP, completing after earns reduced or no XP.

- `id`
- `name`
- `slug`
- `description`
- `parent_type` — enum: `module`, `topic`, `course` (what this quest is attached to)
- `parent_id` — ID of the module/topic/course
- `order` — integer, sequence among quests in the same parent
- `is_required` — boolean
- `is_sequential` — boolean; if true, previous quest must be passed first
- `xp_reward` — base XP
- `xp_deadline` — nullable datetime; after this, XP is reduced or zero
- `xp_after_deadline` — nullable integer; XP awarded if completed after deadline
- `time_limit_minutes` — nullable, for timed quests
- `cooldown_minutes` — wait time after a failed attempt before retry
- `max_attempts` — nullable; null means unlimited
- `allows_peer_audit` — boolean
- `quest_category` — enum: `code`, `notebook`, `mcq`, `essay_design`; determines the audit tier pipeline applied to this quest. `code` uses Gitea submission + automated tests + AI review. `notebook` uses Jupyter notebook via Gitea + structural validation + AI output review. `mcq` uses fully automated scoring + behavioral analytics. `essay_design` uses AI rubric scoring + blind peer review + AI content detection.
- `submission_type` — enum: `git_repository`, `notebook_gitea`, `file_upload`, `in_platform`, `auto_graded`; `notebook_gitea` is used for Jupyter notebook quests where the `.ipynb` file is committed to a Gitea repo
- `is_activated` — boolean; once true, the quest is open and any timer (`time_limit_minutes`, `xp_deadline` countdown) starts running for the student. Activation is triggered by the platform when the student reaches this quest in their progression (or, for cohort-wide unlocks, at a scheduled time)
- `activated_at` — nullable datetime; when `is_activated` flipped to true
- `repository_naming_convention` — nullable, string template for required repo/file names (e.g., `printnmvrbs.go`)
- `language_required` — nullable (e.g., `golang`)
- `allowed_packages` — JSON list of permitted libraries, nullable
- `evaluation_criteria` — JSON (rubric, functional requirements, compliance checks)
- `bonus_criteria` — JSON (efficiency, best practices)
- `learning_materials_html` — nullable, targeted explanatory content for this quest (not a full lecture)
- `metadata` — JSON

### 4.7 `QuestTask`
An individual question or sub-task within a quest. Quests are bundles of related tasks.

- `id`
- `quest_id`
- `order` — integer, sequence within the quest
- `prompt` — the question/task description (can be HTML)
- `task_type` — enum: `code`, `multiple_choice`, `short_answer`, `file_submission`, `free_response`
- `expected_output` — nullable, for auto-graded tasks
- `test_cases` — JSON, for code tasks (input/output pairs)
- `points` — integer, weight of this task within the quest
- `hint` — nullable
- `learning_material_html` — nullable, task-specific explanatory content
- `metadata` — JSON

### 4.8 `Checkpoint`
A timed exam or assessment. Checkpoints are gatekeepers — passing is required to advance. They can be online or in-person (the transcript mentions periodic physical checkpoints where students gather with laptops). Checkpoints exist at the course or subject level.

- `id`
- `name`
- `description`
- `parent_type` — enum: `course`, `subject`, `program`
- `parent_id`
- `order` — integer, position in the progression
- `is_required` — boolean (almost always true; checkpoints are gatekeepers)
- `duration_minutes` — e.g., 240 for standard, 480 for final
- `is_final` — boolean; final checkpoints may have different durations and rules
- `format` — enum: `online`, `in_person`, `hybrid`
- `passing_score` — minimum score to pass (percentage or points)
- `max_attempts` — integer
- `question_pool_size` — nullable, number of questions drawn from a larger bank
- `requires_device` — enum: `laptop`, `phone`, `either`, `none` (logistical constraint flagging)
- `start_date` — nullable date; for scheduled checkpoints (e.g., "Saturday, 2026-10-24")
- `start_time` — nullable time; for scheduled checkpoints (e.g., "10:00 AM" in the cohort/campus timezone)
- `scheduled_at` — nullable datetime; derived from `start_date` + `start_time` + the relevant timezone for backend convenience
- `activation_lead_minutes` — integer, default 10; how many minutes before `scheduled_at` the checkpoint flips `is_activated = true`. Until then, the entry is shown to students as greyed-out / read-only
- `is_activated` — boolean; once true, students can enter the exam. For scheduled checkpoints this flips automatically `activation_lead_minutes` before `scheduled_at`. For unscheduled checkpoints (e.g., on-demand), it flips when the student reaches the gate in their progression
- `activated_at` — nullable datetime
- `configuration` — JSON (randomization, proctoring settings, etc.)
- `metadata` — JSON

### 4.9 `CheckpointQuestion`
Questions within a checkpoint, potentially drawn from a configurable bank.

- `id`
- `checkpoint_id` — nullable if part of a question bank
- `question_bank_id` — nullable
- `question_text` — HTML
- `question_type` — enum: `multiple_choice`, `code`, `short_answer`, `free_response`
- `options` — JSON, for multiple choice
- `correct_answer` — nullable
- `test_cases` — JSON, for code questions
- `points`
- `difficulty` — enum: `easy`, `medium`, `hard`
- `metadata` — JSON

### 4.10 `Raid`
A group challenge or collaborative project. Raids require students to work together in assigned or self-formed groups. Unlike quests (individual) and checkpoints (exam), raids test collaboration, code review, and joint delivery. Four raid types exist with different scopes, group sizes, and submission requirements.

- `id`
- `name`
- `slug`
- `description`
- `parent_type` — enum: `course`, `subject`, `program`
- `parent_id`
- `order` — integer
- `is_required` — boolean
- `raid_type` — enum: `mini_pair`, `standard`, `deployment`, `extended_capstone`; determines scope and oral audit requirements. `mini_pair` (2 students, 3–4 days, Gitea + notebook, written explanation per member). `standard` (3–4 students, 5–7 days, Gitea + README + demo, verbal or written explanation required). `deployment` (3–4 students, 5–7 days, Gitea + deployed URL + monitoring dashboard, explanation required). `extended_capstone` (4–5 students, 14–21 days, Gitea + deployed product + docs + oral defence, any member can be asked about any part).
- `group_size_min` — integer
- `group_size_max` — integer
- `distribution_method` — enum: `automatic`, `manual`, `student_formed`
- `duration_days` — how long groups have to complete the raid
- `xp_reward` — per member on pass
- `submission_type` — enum: `git_repository`, `file_upload`, `presentation`
- `repository_naming_convention` — nullable
- `language_required` — nullable
- `allowed_packages` — JSON, nullable
- `evaluation_criteria` — JSON
- `requires_code_explanation` — boolean (from transcript: students failed because a member "was unable to explain the code")
- `peer_audit_required` — boolean
- `is_activated` — boolean; once true, the raid is open to its assigned groups and the `duration_days` countdown begins. Activation typically happens when groups have been formed and the shared Gitea repository is provisioned
- `activated_at` — nullable datetime; when `is_activated` flipped to true. Used to compute the raid deadline as `activated_at + duration_days`
- `metadata` — JSON

### 4.11 `CurriculumDependency`
Explicit unlock/prerequisite relationships between any curriculum entities, beyond simple sequential ordering within a parent. This allows cross-entity dependencies (e.g., "Quest 5 in Course A requires passing Checkpoint 1 in Course A").

- `id`
- `item_type` — enum: `subject`, `course`, `topic`, `module`, `quest`, `checkpoint`, `raid`
- `item_id` — the entity that is locked
- `depends_on_type` — enum: same as above
- `depends_on_id` — the entity that must be completed first
- `dependency_type` — enum: `completion`, `pass`, `min_score`
- `min_score` — nullable

---

## 5. Cohorts & Enrollment

### 5.1 `Cohort`
A batch of accepted students going through a program together. Created after the application pipeline completes. Tied to a program (and implicitly to campuses through individual enrollments).

- `id`
- `program_id`
- `application_cohort_id` — links back to the application cycle that fed this cohort
- `name` — e.g., "October 2026 Cohort"
- `start_date`
- `expected_end_date`
- `status` — enum: `upcoming`, `active`, `completed`, `archived`
- `configuration` — JSON, cohort-level overrides

### 5.2 `Enrollment`
Links an accepted user to a cohort and tracks their journey through the program. Created when a user's application reaches `accepted` status. At this point, the dashboard transforms from a status page into the full learning interface.

- `id`
- `user_id`
- `cohort_id`
- `program_id`
- `campus_id` — carried from the application
- `enrolled_at`
- `status` — enum: `active`, `away`, `restricted`, `blocked`, `expelled`, `graduated`, `withdrawn`
- `current_subject_id` — nullable
- `current_course_id` — nullable
- `xp_total` — accumulated experience points
- `rank` — nullable, computed (e.g., "51 out of 150")
- `level` — nullable, derived from XP thresholds
- `completed_at` — nullable

### 5.3 `Label`
A tagging entity for organizing and filtering data. Used for cohort batches (quads: January, June, October), content categories, or any other classification.

- `id`
- `organization_id`
- `category` — e.g., `quad`, `batch`, `tag`, `content_tag`
- `name` — e.g., "January 2026", "Backend", "Beginner"
- `color` — nullable
- `metadata` — JSON

### 5.4 `LabelAssignment`
Polymorphic join: attaches a label to any entity.

- `id`
- `label_id`
- `target_type` — enum: `cohort`, `course`, `quest`, `user`, `group`, etc.
- `target_id`

---

## 6. Progression & Events

### 6.1 `ProgressionStage`
Defines the stages an applicant/student moves through across the full lifecycle. Configurable per program.

- `id`
- `program_id`
- `name` — e.g., "Registration", "Game", "Review", "Verification", "Onboarding", "Active Learning", "Graduation"
- `order` — integer
- `auto_advance` — boolean; if true, users advance automatically when conditions are met
- `requires_admin_action` — boolean (e.g., verification requires manual admin review)
- `entry_requirements` — JSON
- `description`
- `dashboard_state` — enum: `status_only`, `countdown`, `game_access`, `onboarding_form`, `full_learning` (controls what the dashboard shows at this stage)

### 6.2 `Event`
A time-bound occurrence within a program — checkpoint sessions, workshops, raid deadlines, etc.

- `id`
- `program_id`
- `cohort_id` — nullable
- `campus_id` — nullable (for campus-specific events like physical checkpoints)
- `type` — enum: `checkpoint_session`, `raid_deadline`, `workshop`, `physical_meetup`, `logbook_signing`, `custom`
- `name`
- `description`
- `start_datetime`
- `end_datetime`
- `requires_registration` — boolean
- `registration_deadline` — nullable
- `max_participants` — nullable
- `status` — enum: `upcoming`, `active`, `completed`, `cancelled`
- `configuration` — JSON
- `metadata` — JSON

### 6.3 `EventRegistration`
Tracks who registered for and attended an event.

- `id`
- `event_id`
- `user_id`
- `registered_at`
- `attended` — boolean
- `result` — enum: `passed`, `failed`, `pending`, `absent`, nullable
- `score` — nullable

### 6.4 `StudentProgressSnapshot`
Captures a student's progress at a point in time. Powers the activity map (daily activity grid), progress graphs, and roadmap view on the dashboard.

- `id`
- `enrollment_id`
- `snapshot_date`
- `subjects_completed` — integer
- `courses_completed` — integer
- `quests_completed` — integer
- `checkpoints_passed` — integer
- `raids_completed` — integer
- `xp_earned` — for this period
- `activity_data` — JSON (daily activity map: `{ "2026-10-20": { "commits": 3, "quests_solved": 1, "modules_read": 2 } }`)

---

## 7. Submissions & Auditing

### 7.1 `Submission`
A student's submitted work for a quest, quest task, checkpoint, or raid.

- `id`
- `enrollment_id`
- `submittable_type` — enum: `quest`, `quest_task`, `checkpoint`, `raid`
- `submittable_id`
- `group_id` — nullable (for raid submissions)
- `submitted_at`
- `repository_url` — nullable, Gitea clone URL (copied from `GiteaRepository.gitea_clone_url`)
- `commit_hash` — nullable
- `file_path` — nullable, for file submissions (e.g., `printnmvrbs.go`)
- `file_url` — nullable, for uploaded files
- `response_data` — JSON, for in-platform answers (multiple choice, short answer, etc.)
- `status` — enum: `pending`, `system_checking`, `awaiting_audit`, `in_review`, `passed`, `failed`, `cooldown`
- `system_check_result` — JSON (automated test output)
- `system_check_passed` — boolean, nullable
- `cooldown_until` — nullable datetime
- `attempt_number` — integer
- `xp_awarded` — nullable
- `bonus_xp_awarded` — nullable

### 7.2 `Audit`
An evaluation of a submission. The audit pipeline applied depends on the quest category or assessment type — each follows a distinct set of tiers (T1–T4) as defined in the auditing system.

For **code quests**: T1 automated test cases → T2 AI-assisted code review → T3 peer audit (if `allows_peer_audit`) → T4 instructor review (flagged only).

For **notebook quests**: T1 structural validation → T2 AI output review → T3 instructor spot-check (15% random + all flagged).

For **MCQ quests/checkpoints**: T1 automated scoring → T2 behavioral analytics → T3 randomized re-sit under proctoring.

For **essay quests**: T1 AI rubric scoring → T2 blind peer review (2 peers) → T3 instructor adjudication → T4 AI content detection + verbal follow-up.

For **checkpoints**: T1 automated scoring (MCQ + code portions) → T2 instructor review (essay/short answer, within 48 hrs) → T3 oral component (final checkpoint only, scored live by 2 instructors).

For **raid audits**: T1 automated repo tests → T2 commit contribution analysis → T3 peer contribution rating (within group) → T4 oral code explanation (all Standard/Extended raids, via `conference_link`).

The verification code mechanic is preserved: both parties must enter a generated code to confirm identity before any human audit begins.

- `id`
- `submission_id`
- `auditor_user_id`
- `auditor_type` — enum: `coding_mentor`, `peer`, `system`, `ai`
- `assigned_by` — nullable, user ID
- `assigned_at`
- `started_at`
- `completed_at`
- `verification_code` — generated code both parties confirm
- `status` — enum: `assigned`, `awaiting_explanation`, `in_progress`, `completed`, `reassigned`, `cancelled`
- `current_tier` — integer (1–4); which audit tier is currently active or most recently completed for this submission
- `conference_link` — nullable URL; auto-generated Google Meet link for raid T4 oral audits and final checkpoint oral components. Null for individual quest audits
- `conference_held_at` — nullable datetime; recorded by the mentor once the explanation call has happened, gating the move from `awaiting_explanation` to `in_progress`
- `clone_successful` — boolean, nullable (was the repo cloned without errors?)
- `is_functional` — boolean, nullable
- `meets_requirements` — boolean, nullable
- `compliance_checks` — JSON (e.g., `{ "correct_language": true, "allowed_packages": true, "no_hardcoded_answers": true }`)
- `code_explanation_results` — JSON; for raid T4 oral audits, per-member outcomes (e.g., `{ "user_id_42": "explained", "user_id_43": "could_not_explain" }`). A `could_not_explain` for any member fails the whole group
- `ai_review_result` — JSON; output of T2 AI-assisted code review for code quests (similarity flags, hardcoding indicators, style notes)
- `behavioral_analytics_result` — JSON; for MCQ quests/checkpoints T2 (time-per-question data, answer pattern flags, IP/device anomalies)
- `ai_rubric_score` — nullable integer; T1 AI rubric score for essay quests, serves as the starting score before peer review
- `ai_rubric_breakdown` — JSON; criterion-level breakdown from AI rubric scoring
- `peer_review_scores` — JSON; T2 blind peer review scores for essay quests (e.g., `{ "peer_1": 78, "peer_2": 82 }`). Final score = weighted average of AI + both peers; outlier resolution triggers T3
- `ai_content_detection_result` — JSON; T4 AI-generated content detection result for essays (probability score, flagged indicators). High-probability submissions require verbal follow-up
- `commit_contribution_analysis` — JSON; T2 contribution analysis for raid audits (per-member commit ratio; flags if any member exceeds 80% of commits)
- `peer_contribution_ratings` — JSON; T3 within-group peer contribution ratings for raids (1–5 scale + short text per member, aggregated privately)
- `notebook_structure_check` — JSON; T1 structural validation for notebook quests (cells present, outputs not cleared, naming convention match)
- `notebook_ai_output_review` — JSON; T2 AI review of notebook output cells and narrative cells
- `functional_test_notes` — text
- `bonus_responses` — JSON
- `result` — enum: `pass`, `fail`
- `feedback` — text
- `xp_modifier` — nullable

### 7.3 `AuditQuestion`
Configurable questions that appear during an audit. Different quests, raids, or checkpoints can have different audit checklists.

- `id`
- `target_type` — enum: `quest`, `raid`, `checkpoint`, nullable (global if null)
- `target_id` — nullable
- `program_id` — nullable
- `question_text`
- `question_type` — enum: `yes_no`, `scale`, `text`, `multiple_choice`
- `category` — enum: `requirement`, `functional`, `compliance`, `bonus`, `social`
- `has_consequence` — boolean (requirement questions affect pass/fail; bonus questions do not)
- `order`
- `options` — JSON

---

## 8. Groups

### 8.1 `Group`
A collection of students. Groups serve multiple purposes: raid teams, peer audit pairs, and community chat groups. The type field distinguishes them.

- `id`
- `program_id`
- `cohort_id` — nullable
- `type` — enum: `raid_team`, `audit_pair`, `community_group`
- `raid_id` — nullable, for raid teams
- `name`
- `max_size` — configurable (e.g., 3 for small teams, 10 for community groups)
- `distribution_method` — enum: `automatic`, `manual`, `student_created`
- `lifespan_weeks` — nullable (community groups dissolve after a set period, e.g., 24 weeks)
- `created_at`
- `created_by` — user ID or `system`
- `dissolved_at` — nullable
- `status` — enum: `active`, `completed`, `disbanded`

### 8.2 `GroupMember`
Membership in a group.

- `id`
- `group_id`
- `user_id`
- `joined_at`
- `removed_at` — nullable
- `removed_by` — nullable
- `removal_reason` — nullable
- `is_active` — boolean

---

## 9. Community & Social

### 9.1 `Post`
A message in the community area — the "village square." Posts belong to a community group or a global feed.

- `id`
- `author_user_id`
- `group_id` — nullable (null = global/program-wide feed)
- `program_id`
- `content` — text/HTML
- `parent_post_id` — nullable, for threaded replies
- `created_at`
- `updated_at`
- `is_pinned` — boolean
- `is_deleted` — boolean (soft delete)

### 9.2 `DirectMessage`
Private messages between users.

- `id`
- `sender_user_id`
- `recipient_user_id`
- `content` — text
- `sent_at`
- `read_at` — nullable
- `is_deleted` — boolean

### 9.3 `Friendship`
A bidirectional relationship between two users, enabling the social layer.

- `id`
- `user_a_id`
- `user_b_id`
- `status` — enum: `pending`, `accepted`, `declined`, `blocked`
- `requested_at`
- `responded_at` — nullable
- `requested_by` — which of the two initiated

---

## 10. Records & Restrictions

### 10.1 `Record`
A documented entry on a student's profile by a mentor or admin. Can be purely observational or carry consequences.

- `id`
- `target_user_id`
- `author_user_id`
- `enrollment_id` — nullable
- `type` — enum: `observation`, `expulsion`, `restriction`, `block`, `away`, `notice`
- `comment` — text explanation
- `consequence` — enum: `none`, `expel`, `restrict`, `block`, `away`, `notice`
- `severity` — enum: `info`, `warning`, `critical`
- `created_at`
- `effective_immediately` — boolean
- `effective_at` — datetime
- `end_type` — enum: `automatic`, `manual`, `permanent`, nullable
- `auto_end_at` — nullable
- `ended_at` — nullable
- `ended_by` — nullable
- `is_active` — boolean
- `is_reversible` — boolean
- `dashboard_notice` — nullable text, shown on the student's dashboard while active
- `metadata` — JSON

### 10.2 `RecordEffect`
The concrete system effects of an active record.

- `id`
- `record_id`
- `effect_type` — enum: `revoke_platform_access`, `exclude_from_distribution`, `revoke_audit_access`, `dashboard_banner`, `restrict_submissions`
- `is_active` — boolean
- `started_at`
- `ended_at` — nullable

---

## 11. Git Integration (Gitea)

The platform uses a **self-hosted Gitea instance** as the Git backend. Gitea handles user accounts, repositories, access tokens, organizations, collaborators, and webhooks natively. The platform does not reimplement Git — it provisions and queries Gitea through its REST API.

The entities below are the **platform's side of the mapping**, not Gitea's own tables. They store just enough to link platform concepts (users, quests, raids) to their Gitea counterparts and to avoid redundant API calls.

### 11.1 `GiteaAccount`
A mapping between a platform user and their Gitea user account. Created automatically when a student is enrolled — the platform calls Gitea's admin API to provision the account.

- `id`
- `user_id` — platform user
- `gitea_user_id` — the user's ID in Gitea
- `gitea_username` — the Gitea username (may follow a convention, e.g., `siwes-{matric}`)
- `access_token_hash` — hashed API token generated via Gitea's API, used for programmatic operations (cloning, pushing) on behalf of the student
- `created_at`
- `is_active` — boolean; set to false on expulsion/withdrawal (platform calls Gitea to deactivate)

### 11.2 `GiteaRepository`
A mapping between a platform quest/raid and a Gitea repository. When a student starts a quest or a raid group is formed, the platform creates the repo in Gitea via API (enforcing the naming convention) and stores the reference here.

- `id`
- `gitea_account_id` — the owner's GiteaAccount
- `gitea_repo_id` — the repo's ID in Gitea
- `gitea_repo_name` — must follow `repository_naming_convention` from the quest/raid
- `gitea_clone_url` — full clone URL from Gitea
- `quest_id` — nullable
- `raid_id` — nullable
- `group_id` — nullable, for raid team repos (Gitea repo may have multiple collaborators added via API)
- `created_at`
- `last_push_detected_at` — nullable, updated via Gitea webhook
- `is_active`

### 11.3 `GiteaWebhook` (conceptual — may not need its own table)
Gitea webhooks are configured per-repo or per-organization to notify the platform of events like pushes, pull requests, or repository deletions. The platform listens on a webhook endpoint and uses incoming payloads to:
- Update `last_push_detected_at` on `GiteaRepository`
- Trigger automated system checks on new commits (populating `Submission.system_check_result`)
- Record activity data in `StudentProgressSnapshot`

Whether webhooks are stored as a platform entity or simply configured in Gitea and handled by the platform's webhook receiver is an implementation decision. If stored:

- `id`
- `gitea_repo_id`
- `gitea_webhook_id` — Gitea's ID for the webhook
- `event_type` — e.g., `push`, `pull_request`, `repository`
- `target_url` — the platform endpoint Gitea posts to
- `is_active`

---

## 12. Experience & Scoring

### 12.1 `XPTransaction`
An immutable ledger of all XP earned or deducted.

- `id`
- `enrollment_id`
- `amount` — positive or negative
- `source_type` — enum: `module_completion`, `quest_completion`, `quest_bonus`, `checkpoint_pass`, `raid_pass`, `achievement_unlock`, `streak_milestone`, `penalty`, `manual_adjustment`
- `source_id` — polymorphic reference to the submission, audit, achievement, streak, or record
- `description`
- `awarded_at`
- `awarded_by` — nullable

### 12.2 `Leaderboard`
Configurable ranking views. Displayed on the dashboard showing rank (e.g., "51 out of 150").

- `id`
- `scope_type` — enum: `cohort`, `program`, `campus`, `course`
- `scope_id`
- `ranking_metric` — enum: `xp_total`, `quests_completed`, `raids_passed`, `custom`
- `configuration` — JSON (visibility, anonymization, refresh interval, etc.)

### 12.3 `Achievement`
A named badge that students unlock by meeting defined criteria. Achievements are administrator-defined per organization (or program) and are surfaced on a "trophy hall" / achievements view on the dashboard.

- `id`
- `organization_id`
- `program_id` — nullable, scope an achievement to a single program
- `name` — e.g., "Quest Hunter", "Raid Captain"
- `slug`
- `description` — what the badge represents
- `icon_url`
- `rarity` — enum: `common`, `rare`, `epic`, `legendary` (drives display styling and signals difficulty)
- `criteria_type` — enum: `quest_count`, `raid_count`, `checkpoint_count`, `streak_days`, `xp_threshold`, `module_count`, `audit_count`, `composite`, `manual`
- `criteria_config` — JSON describing the threshold(s); e.g., `{ "count": 10 }` for `quest_count`, `{ "days": 7 }` for `streak_days`, `{ "rules": [...] }` for `composite`
- `xp_bonus` — nullable integer, optional XP awarded on unlock (recorded as an `XPTransaction` with `source_type = achievement_unlock`)
- `is_active` — boolean
- `is_hidden` — boolean; hidden achievements are revealed only when unlocked (surprise badges)
- `display_order` — integer
- `created_at`

### 12.4 `UserAchievement`
A record of a specific user unlocking a specific achievement. Allows progressive tracking even before the badge is earned.

- `id`
- `user_id`
- `enrollment_id` — nullable; ties the unlock to a specific cohort journey when relevant
- `achievement_id`
- `progress` — JSON, current state toward the criteria (e.g., `{ "current": 6, "target": 10 }`); updated by the platform as the user's activity advances
- `unlocked_at` — nullable; null while still in progress, set when criteria are met
- `unlocked_by` — nullable user_id; only set for `manual` criteria (admin-awarded badges)

### 12.5 `Streak`
Tracks daily activity streaks per enrollment. A "day of activity" is defined by the program's `streak_activity_rule` configuration setting (e.g., at least one commit OR one quest solved OR one module read on a given day, in the cohort's timezone). Streak milestones (e.g., 7-day, 30-day) can drive XP awards (`source_type = streak_milestone`) and unlock streak-based achievements.

- `id`
- `enrollment_id`
- `current_streak` — integer, days in the current uninterrupted run
- `longest_streak` — integer, all-time best for this enrollment
- `last_activity_date` — date; the most recent qualifying day
- `streak_started_at` — date; when the current streak began
- `last_milestone_awarded` — nullable integer; the highest milestone (in days) for which the user has already received the milestone reward, to avoid double-awarding
- `metadata` — JSON

---

## 13. SIWES Documentation

### 13.1 `Logbook`
Tracks the SIWES logbook lifecycle. Logbooks should ideally be filled daily and signed weekly by a campus admin, though formats vary by institution.

- `id`
- `enrollment_id`
- `campus_id`
- `institution_format` — nullable, notes on the school's specific logbook format
- `status` — enum: `not_started`, `in_progress`, `pending_signature`, `signed`, `completed`
- `created_at`
- `metadata` — JSON

### 13.2 `LogbookEntry`
An individual daily/weekly entry in the logbook.

- `id`
- `logbook_id`
- `entry_date`
- `week_number` — integer
- `content` — text, what the student did/learned
- `submitted_at`
- `campus_admin_signed` — boolean
- `campus_admin_signed_at` — nullable
- `campus_admin_comments` — nullable
- `metadata` — JSON

### 13.3 `WeeklyReport`
A weekly SIWES report compiled from the week's `LogbookEntry` records. The platform offers an optional **AI-assisted draft** — an LLM stitches the daily entries into a coherent weekly narrative — which the student then reviews, edits, and submits. The student is always the author of record; AI generation is a productivity aid, not a substitute for authentic SIWES documentation, and the original `LogbookEntry` rows remain the source of truth.

- `id`
- `logbook_id`
- `week_number` — integer
- `start_date` — date
- `end_date` — date
- `generated_content` — text; the AI-drafted summary (kept verbatim for audit)
- `generated_at` — nullable datetime
- `generated_by` — enum: `system_ai`, `student`, `none`; `none` for fully manual reports
- `final_content` — text; the student-edited version that is actually submitted
- `status` — enum: `draft`, `edited`, `submitted`, `signed`
- `submitted_at` — nullable
- `campus_admin_signed` — boolean
- `campus_admin_signed_at` — nullable
- `campus_admin_comments` — nullable
- `metadata` — JSON

---

## 14. Calendar & Scheduling

### 14.1 `CalendarEntry`
A unified calendar for all scheduled activities.

- `id`
- `program_id`
- `cohort_id` — nullable
- `event_id` — nullable
- `title`
- `description`
- `start_datetime`
- `end_datetime`
- `entry_type` — enum: `quest_deadline`, `checkpoint_session`, `raid_deadline`, `logbook_signing`, `event`, `registration_window`, `custom`
- `is_visible_to_students` — boolean
- `reminder_config` — JSON

---

## 15. Platform Configuration

### 15.1 `ConfigurationSetting`
A key-value store for all configurable behaviors, with cascading scope: **Organization → Campus → Program → Cohort**.

- `id`
- `key` — namespaced string (e.g., `progression.auto_advance`, `audit.cooldown_minutes`, `quest.max_attempts`, `group.max_size`, `notification.checkpoint_reminder_hours_before`, `dashboard.show_rank`, `dashboard.show_xp`)
- `value` — JSON
- `scope_type` — enum: `organization`, `campus`, `program`, `cohort`
- `scope_id`
- `description`
- `updated_at`
- `updated_by`

### 15.2 `AuditLog`
System-level audit trail for administrative actions (distinct from educational "audits").

- `id`
- `actor_user_id`
- `action` — string (e.g., `user.expelled`, `audit.reassigned`, `cohort.closed`, `verification.approved`, `application.rejected`, `config.updated`)
- `target_type` — entity type affected
- `target_id`
- `details` — JSON (before/after state, reason)
- `ip_address`
- `timestamp`

---

## Entity Summary Table

| #  | Entity                  | Domain                    | Purpose                                                           |
|----|-------------------------|---------------------------|-------------------------------------------------------------------|
| 1  | Organization            | Infrastructure            | Top-level tenant                                                  |
| 2  | Campus                  | Infrastructure            | Physical SIWES center for signing and admin                       |
| 3  | NotificationTemplate    | Infrastructure            | Configurable notification content per trigger and scope            |
| 4  | User                    | Users                     | Any person in the system                                          |
| 5  | StudentProfile          | Users                     | SIWES-specific student data (matric, institution, verification)    |
| 6  | Role                    | Users                     | Named permission group                                            |
| 7  | UserRole                | Users                     | Scoped role assignment                                            |
| 8  | PermissionSet           | Users                     | Granular permission list per role                                 |
| 9  | ApplicationCohort       | Application Pipeline      | A time-bound application cycle                                    |
| 10 | Application             | Application Pipeline      | An individual's application and status through the pipeline        |
| 11 | SelectionGame           | Application Pipeline      | The gamified assessment for filtering applicants                   |
| 12 | GameAttempt             | Application Pipeline      | A user's play-through of the selection game                        |
| 13 | VerificationRequest     | Application Pipeline      | Institutional verification of a student's enrollment               |
| 14 | RegistrationDocument    | Application Pipeline      | Basic identity docs uploaded at registration (school ID, NIN, photo)|
| 15 | OnboardingDocument      | Application Pipeline      | SIWES docs uploaded at the campus onboarding session (CYS, logbook) |
| 16 | Program                 | Curriculum                | The top-level training program                                     |
| 17 | Subject                 | Curriculum                | Broadest curriculum division (e.g., "Web Development")             |
| 18 | Course                  | Curriculum                | A course within a subject (e.g., "Intro to HTML")                  |
| 19 | Topic                   | Curriculum                | A topic within a course (e.g., "CSS Flexbox")                      |
| 20 | Module                  | Curriculum                | Atomic learning content — HTML-rendered text, video, media          |
| 21 | Quest                   | Curriculum (Assessment)   | Individual challenge; quest_category (code/notebook/mcq/essay_design) drives audit tier pipeline |
| 22 | QuestTask               | Curriculum (Assessment)   | A single question/sub-task within a quest                          |
| 23 | Checkpoint              | Curriculum (Assessment)   | Timed gatekeeper exam (online or in-person), with scheduled activation|
| 24 | CheckpointQuestion      | Curriculum (Assessment)   | Questions within a checkpoint                                      |
| 25 | Raid                    | Curriculum (Assessment)   | Group challenge; raid_type (mini_pair/standard/deployment/extended_capstone) determines scope and oral requirements |
| 26 | CurriculumDependency    | Curriculum                | Cross-entity prerequisite relationships                            |
| 27 | Cohort                  | Enrollment                | A batch of accepted students in a program                          |
| 28 | Enrollment              | Enrollment                | A user's active journey through a cohort                           |
| 29 | Label                   | Enrollment                | Tagging entity for filtering (quads, categories)                   |
| 30 | LabelAssignment         | Enrollment                | Polymorphic label-to-entity attachment                             |
| 31 | ProgressionStage        | Progression               | Lifecycle stage from registration to graduation                    |
| 32 | Event                   | Progression               | Time-bound occurrence (checkpoint session, meetup, etc.)           |
| 33 | EventRegistration       | Progression               | User signup and attendance for an event                            |
| 34 | StudentProgressSnapshot | Progression               | Point-in-time progress capture; powers activity maps               |
| 35 | Submission              | Submissions & Auditing    | Student's submitted work                                           |
| 36 | Audit                   | Submissions & Auditing    | Evaluation of a submission; tiered per assessment type (T1–T4); carries fields for AI review, behavioral analytics, peer review scores, contribution analysis, oral conference |
| 37 | AuditQuestion           | Submissions & Auditing    | Configurable checklist questions per audit context                  |
| 38 | Group                   | Groups                    | Student grouping for raids, audits, or community                   |
| 39 | GroupMember             | Groups                    | Membership lifecycle within a group                                |
| 40 | Post                    | Community                 | Discussion post in community groups or global feed                  |
| 41 | DirectMessage           | Community                 | Private messages between users                                     |
| 42 | Friendship              | Community                 | Bidirectional social relationship between users                     |
| 43 | Record                  | Records & Restrictions    | Mentor-authored profile entry with optional consequences            |
| 44 | RecordEffect            | Records & Restrictions    | Concrete system effects of an active record                        |
| 45 | GiteaAccount            | Git Integration (Gitea)   | Maps platform user to their Gitea user account                     |
| 46 | GiteaRepository         | Git Integration (Gitea)   | Maps quest/raid to a Gitea repo                                    |
| 47 | GiteaWebhook            | Git Integration (Gitea)   | Tracks Gitea webhook config for push/event notifications (optional)|
| 48 | XPTransaction           | Experience & Scoring      | Immutable XP ledger entry                                          |
| 49 | Leaderboard             | Experience & Scoring      | Configurable ranking view                                          |
| 50 | Achievement             | Experience & Scoring      | Admin-defined badge with criteria and rarity tier                  |
| 51 | UserAchievement         | Experience & Scoring      | A user's progress toward and unlock of a specific achievement       |
| 52 | Streak                  | Experience & Scoring      | Per-enrollment daily activity streak counter                       |
| 53 | Logbook                 | SIWES Documentation       | Tracks the SIWES logbook lifecycle                                 |
| 54 | LogbookEntry            | SIWES Documentation       | Individual daily/weekly logbook entry                              |
| 55 | WeeklyReport            | SIWES Documentation       | AI-assisted weekly summary compiled from logbook entries           |
| 56 | CalendarEntry           | Calendar                  | Unified schedule for students and staff                            |
| 57 | ConfigurationSetting    | Platform Configuration    | Cascading key-value config store                                   |
| 58 | AuditLog                | Platform Configuration    | System-level administrative action trail                           |

---

## Design Principles

1. **Cascading Configuration**: Settings flow from Organization → Campus → Program → Cohort. Any level can override the one above it.

2. **Distinct Curriculum Entities**: Instead of a single polymorphic `CurriculumItem`, each level of the curriculum hierarchy (Subject, Course, Topic, Module) and each assessment type (Quest, Checkpoint, Raid) is its own entity with its own fields. This allows each to evolve independently, carry type-specific properties, and be queried/administered without type-casting. `CurriculumDependency` handles cross-entity prerequisites.

3. **Full Lifecycle Coverage**: The data model spans from first registration through the selection game, institutional verification, document onboarding, active learning, and graduation — with explicit entities for each stage so nothing is handled "off-platform."

4. **Separation of Record and Effect**: A `Record` documents *what happened*. A `RecordEffect` documents *what the system did about it*. Same record type can have different effects in different programs.

5. **XP as a Ledger**: All XP changes are immutable `XPTransaction` entries. Current total is derived. Full audit trail built in.

6. **Content as HTML**: Module content, quest learning materials, and task prompts are stored as rich HTML produced by a backend editor (e.g., TinyMCE). The frontend renders without needing specialized components per content type, and admins can embed videos, code, images, or any media.

7. **SIWES-Aware**: Campus exists primarily for physical documentation (logbook signing, CYS stamping). `StudentProfile` carries institution-specific data. `VerificationRequest` models the manual school-confirmation process. `Logbook`, `LogbookEntry`, and `WeeklyReport` handle the daily/weekly documentation requirement, with the weekly report optionally AI-drafted from the daily entries while preserving the student as author of record.

8. **Two-Stage Document Collection**: Basic identity documents (`RegistrationDocument`: school ID, NIN, profile picture) are uploaded at registration. Heavyweight SIWES paperwork (`OnboardingDocument`: CYS form, logbook, acceptance letter) is collected only after the candidate has passed the game and been verified, at a physical or online campus onboarding session. This avoids subjecting the full applicant pool to SIWES paperwork before the game cutoff is applied.

9. **Filtered Verification**: Manual institutional verification is a costly admin process. The platform produces a post-game scoreboard filterable by `game_score ≥ game_cutoff_score` so that verification effort is spent only on applicants who actually passed the game.

10. **Activation Pattern**: Quests, Raids, and Checkpoints carry an `is_activated` boolean. Items are inert (greyed-out, no countdowns running) until activated by the appropriate trigger — student progression, group formation, or scheduled time minus `activation_lead_minutes`. This lets students see what's coming without the system penalising them for not yet being "in" the assessment.

11. **Achievements & Streaks as First-Class**: Long-running engagement is supported by `Achievement` / `UserAchievement` (admin-defined badges with rarity tiers and progressive criteria) and `Streak` (daily activity counters with milestone XP). Both feed into the `XPTransaction` ledger via dedicated source types.

12. **Applicant Data Hygiene**: Rejected applicants' data is purged when a cohort closes (configurable via `purge_rejected_data`). Since NIN prevents re-registration within the same cycle, there is no reason to retain rejected data.

13. **Community as Infrastructure**: Groups, posts, DMs, and friendships are first-class entities, enabling the "village square" social experience described in the design sessions. Community groups have configurable lifespans and are system-created.

14. **Gitea as Git Backend**: Rather than building Git infrastructure, the platform delegates to a self-hosted Gitea instance and maintains thin mapping tables (`GiteaAccount`, `GiteaRepository`). The platform provisions accounts and repos via Gitea's REST API, enforces naming conventions at creation time, and listens for push events via Gitea webhooks to trigger automated checks. Quests and raids define naming conventions; submissions reference specific commits; auditors clone and review from the same Gitea repo.

15. **Raid Audit Conferences**: Because raids require every member to verbally explain the code they authored (`requires_code_explanation`), Standard and Extended Capstone raid audits auto-generate a Google Meet `conference_link` (created via the Calendar / Meet API on an organization service account). The mentor only opens the audit checklist after the explanation call has happened, capturing per-member outcomes in `Audit.code_explanation_results`. A single `could_not_explain` fails the whole group.

16. **Tiered Auditing Per Assessment Type**: Each assessment category has its own escalation pipeline rather than a single generic audit flow. Code quests use automated tests → AI code review → peer audit → instructor review. Notebook quests use structural validation → AI output review → instructor spot-check. MCQ quests/checkpoints use automated scoring → behavioral analytics → proctored re-sit. Essay quests use AI rubric scoring → blind peer review → instructor adjudication → AI content detection. Raids use automated repo tests → commit contribution analysis → peer contribution rating → oral code explanation. This is reflected in the `Quest.quest_category`, `Raid.raid_type`, and the family of `Audit` fields (`ai_review_result`, `behavioral_analytics_result`, `ai_rubric_score`, `peer_review_scores`, `ai_content_detection_result`, `commit_contribution_analysis`, `peer_contribution_ratings`, `notebook_structure_check`, `notebook_ai_output_review`, `current_tier`).

17. **Multi-Track, Multi-Duration Programs**: The curriculum supports four distinct tracks: Track A (experienced engineers) × 3-month and 6-month, and Track B (zero experience) × 3-month and 6-month. Each is a separate `Program` entity identified by its `track` and `duration_months` fields. This allows subjects, courses, and quests to be authored once and linked to the appropriate programs, while assessment counts, XP targets, and progression gates are configured per-program.


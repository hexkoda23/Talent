import { apiRequest, authToken } from "./client";
import type {
  ActiveCohortResponse,
  ApplicationResponse,
  AuthResponse,
  CampusesResponse,
  CompleteAttemptResponse,
  LatestAttemptResponse,
  OnboardingDocumentsResponse,
  SelectionGameResponse,
  SessionResponse,
} from "./types";

export const authApi = {
  async login(payload: { email: string; password: string }) {
    const response = await apiRequest<AuthResponse>("/auth/login", {
      method: "POST",
      body: payload,
      auth: false,
    });
    authToken.set(response.token);
    return response;
  },

  async signup(payload: { email: string; password: string }) {
    const response = await apiRequest<AuthResponse>("/auth/signup", {
      method: "POST",
      body: payload,
      auth: false,
    });
    authToken.set(response.token);
    return response;
  },

  async registerApplicant(formData: FormData) {
    return apiRequest<AuthResponse>("/auth/register-applicant", {
      method: "POST",
      body: formData,
    });
  },

  async logout() {
    try {
      await apiRequest<void>("/auth/logout", { method: "POST" });
    } catch {
      // Ignore errors, just clear token and redirect
    } finally {
      authToken.clear();
    }
  },

  session() {
    return apiRequest<SessionResponse>("/auth/session");
  },
};

export const publicApi = {
  activeCohort() {
    return apiRequest<ActiveCohortResponse>("/public/active-cohort", { auth: false });
  },
};

export const registrationApi = {
  campuses() {
    return apiRequest<CampusesResponse>("/campuses", { auth: false });
  },
};

export const selectionGameApi = {
  current() {
    return apiRequest<SelectionGameResponse>("/me/selection-game");
  },

  startAttempt() {
    return apiRequest<{ id: string; deadline_at?: string }>("/me/selection-game/attempts/start", {
      method: "POST",
    });
  },

  completeAttempt(
    attemptId: string,
    payload: {
      score: number;
      breakdown: Record<string, number>;
      attempt_data: Record<string, unknown>;
    },
  ) {
    return apiRequest<CompleteAttemptResponse>(`/me/selection-game/attempts/${attemptId}/complete`, {
      method: "POST",
      body: payload,
    });
  },

  latestAttempt() {
    return apiRequest<LatestAttemptResponse>("/me/selection-game/attempts/latest");
  },
};

export const applicationApi = {
  current() {
    return apiRequest<ApplicationResponse>("/me/application");
  },
};

export const onboardingApi = {
  documents() {
    return apiRequest<OnboardingDocumentsResponse>("/me/onboarding-documents");
  },

  submitDocument(payload: {
    document_type: string;
    file_url: string;
    original_filename: string;
    metadata?: Record<string, unknown>;
  }) {
    return apiRequest("/me/onboarding-documents", {
      method: "POST",
      body: payload,
    });
  },

  acknowledge() {
    return apiRequest<{ application: { status: string; dashboard_state: string } }>("/me/onboarding/acknowledge", {
      method: "POST",
      body: { ack: true },
    });
  },
};

export const uploadsApi = {
  presign(payload: { purpose: string; filename: string; mime_type: string }) {
    return apiRequest<{ upload_url: string; file_url: string; expires_at: string }>("/uploads/presign", {
      method: "POST",
      body: payload,
    });
  },

  async uploadToPresignedUrl(uploadUrl: string, file: File) {
    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    });

    if (!response.ok) {
      throw new Error("File upload failed.");
    }
  },
};

export const dashboardApi = {
  me() {
    return apiRequest<unknown>("/me");
  },
  search(q: string) {
    return apiRequest<unknown>(`/me/dashboard-search?q=${encodeURIComponent(q)}`);
  },
  home() {
    return apiRequest<unknown>("/me/dashboard/home");
  },
  currentLearn() {
    return apiRequest<unknown>("/me/learn/current");
  },
  module(moduleId: string) {
    return apiRequest<unknown>(`/modules/${moduleId}`);
  },
  updateModuleProgress(moduleId: string, payload: { watched_seconds: number; mark_complete: boolean }) {
    return apiRequest<unknown>(`/modules/${moduleId}/progress`, { method: "POST", body: payload });
  },
  activeQuest() {
    return apiRequest<unknown>("/me/quests/active");
  },
  startQuestAttempt(questId: string) {
    return apiRequest<unknown>(`/quests/${questId}/attempts`, { method: "POST" });
  },
  submitQuest(questId: string, payload: { submission_id: string; responses: Record<string, unknown> }) {
    return apiRequest<unknown>(`/quests/${questId}/submissions`, { method: "POST", body: payload });
  },
  submission(submissionId: string) {
    return apiRequest<unknown>(`/me/submissions/${submissionId}`);
  },
  activeRaid() {
    return apiRequest<unknown>("/me/raids/active");
  },
  submitRaid(raidId: string, payload: { commit_hash: string; notes?: string }) {
    return apiRequest<unknown>(`/raids/${raidId}/submissions`, { method: "POST", body: payload });
  },
  raidAuditStatus(raidId: string) {
    return apiRequest<unknown>(`/me/raids/${raidId}/audit-status`);
  },
  audits() {
    return apiRequest<unknown>("/me/audits");
  },
  audit(auditId: string) {
    return apiRequest<unknown>(`/audits/${auditId}`);
  },
  verifyAudit(auditId: string, code: string) {
    return apiRequest<unknown>(`/audits/${auditId}/verify`, { method: "POST", body: { code } });
  },
  submitAudit(auditId: string, payload: Record<string, unknown>) {
    return apiRequest<unknown>(`/audits/${auditId}/submit`, { method: "POST", body: payload });
  },
  auditRubric() {
    return apiRequest<unknown>("/audits/rubric");
  },
  currentCheckpoint() {
    return apiRequest<unknown>("/me/checkpoints/current");
  },
  curriculumPath() {
    return apiRequest<unknown>("/me/curriculum-path");
  },
  startCheckpoint(checkpointId: string) {
    return apiRequest<unknown>(`/checkpoints/${checkpointId}/start`, { method: "POST" });
  },
  submitCheckpointAttempt(attemptId: string, responses: Array<Record<string, unknown>>) {
    return apiRequest<unknown>(`/checkpoints/attempts/${attemptId}/submit`, { method: "POST", body: { responses } });
  },
  saveCheckpointReflection(checkpointId: string, text: string) {
    return apiRequest<unknown>(`/me/checkpoints/${checkpointId}/reflection`, { method: "POST", body: { text } });
  },
  leaderboard(params = "scope=cohort&metric=xp_total&page=1&page_size=50") {
    return apiRequest<unknown>(`/leaderboards?${params}`);
  },
  communityChannels() {
    return apiRequest<unknown>("/me/community/channels");
  },
  channelPosts(channelId: string, cursor = "", limit = 50) {
    const query = new URLSearchParams({ limit: String(limit) });
    if (cursor) query.set("cursor", cursor);
    return apiRequest<unknown>(`/community/channels/${channelId}/posts?${query.toString()}`);
  },
  createPost(channelId: string, payload: { content: string; parent_post_id: string | null }) {
    return apiRequest<unknown>(`/community/channels/${channelId}/posts`, { method: "POST", body: payload });
  },
  achievements() {
    return apiRequest<unknown>("/me/achievements");
  },
  repositories() {
    return apiRequest<unknown>("/me/repositories");
  },
  repository(repoId: string) {
    return apiRequest<unknown>(`/repositories/${repoId}`);
  },
  repositoryTree(repoId: string, path = "", ref = "main") {
    return apiRequest<unknown>(`/repositories/${repoId}/tree?path=${encodeURIComponent(path)}&ref=${encodeURIComponent(ref)}`);
  },
  repositoryFile(repoId: string, path: string, ref = "main") {
    return apiRequest<unknown>(`/repositories/${repoId}/file?path=${encodeURIComponent(path)}&ref=${encodeURIComponent(ref)}`);
  },
  repositoryCommits(repoId: string, limit = 20, ref = "main") {
    return apiRequest<unknown>(`/repositories/${repoId}/commits?limit=${limit}&ref=${encodeURIComponent(ref)}`);
  },
  logbook() {
    return apiRequest<unknown>("/me/logbook");
  },
  saveLogbookEntry(payload: Record<string, unknown>) {
    return apiRequest<unknown>("/me/logbook/entries", { method: "POST", body: payload });
  },
  profile() {
    return apiRequest<unknown>("/me/profile");
  },
  updateProfile(payload: Record<string, unknown>) {
    return apiRequest<unknown>("/me/profile", { method: "PATCH", body: payload });
  },
  notifications(page = 1, pageSize = 50, unreadOnly = false) {
    return apiRequest<unknown>(`/me/notifications?unread_only=${unreadOnly}&page=${page}&page_size=${pageSize}`);
  },
  markNotificationRead(notificationId: string) {
    return apiRequest<unknown>(`/me/notifications/${notificationId}/read`, { method: "POST" });
  },
  markAllNotificationsRead() {
    return apiRequest<unknown>("/me/notifications/read-all", { method: "POST" });
  },
};

export const lmsApi = {
  launch(next: string) {
    return apiRequest<{ url: string }>("/lms/launch", {
      method: "POST",
      body: { next },
    });
  },
};

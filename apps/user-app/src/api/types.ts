export type DashboardState = "status_only" | "countdown" | "game_access" | "onboarding_form" | "full_learning";

export type ApplicationStatus =
  | "registered"
  | "game_pending"
  | "game_completed"
  | "review"
  | "verification_pending"
  | "verified"
  | "onboarding"
  | "accepted"
  | "rejected";

export type ApiErrorEnvelope = {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
};

export type ApiUser = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url?: string | null;
};

export type ApiApplication = {
  id: string;
  cohort_id?: string;
  campus_id?: string;
  status: ApplicationStatus;
  dashboard_state?: DashboardState;
  passed_game?: boolean | null;
  game_score?: number | null;
  registered_at?: string;
  rejection_email_sent?: boolean;
};

export type SelectionGame = {
  id: string;
  name?: string;
  description?: string;
  scheduled_at?: string;
  duration_minutes: number;
  access_method?: string;
  status: "upcoming" | "active" | "completed";
  configuration?: {
    rounds?: Array<Record<string, unknown>>;
  };
};

export type AuthResponse = {
  token: string;
  user: ApiUser;
  application?: ApiApplication;
  selection_game?: SelectionGame;
};

export type SessionResponse = {
  user: ApiUser;
  application: ApiApplication | null;
  enrollment: unknown | null;
  progression_stage: {
    name: string;
    dashboard_state: DashboardState;
  };
};

export type ActiveCohortResponse = {
  application_cohort: {
    id: string;
    name: string;
    status: "open" | "in_review" | "closed";
    opens_at: string;
    closes_at: string;
    max_applicants: number;
    registered_count?: number;
  };
  program: {
    id: string;
    name: string;
    duration_options_months: number[];
  };
};

export type Campus = {
  id: string;
  name: string;
  location: {
    city: string;
    state: string;
    address?: string;
  };
  capacity: number;
  seats_remaining: number;
  demand_label: "Recommended" | "High demand" | "Open";
};

export type CampusesResponse = {
  data: Campus[];
};

export type SelectionGameResponse = {
  selection_game: SelectionGame;
  latest_attempt: GameAttempt | null;
};

export type GameAttempt = {
  id: string;
  game_id?: string;
  user_id?: string;
  application_id?: string;
  started_at?: string;
  deadline_at?: string;
  score: number | null;
  passed: boolean | null;
  completed_at?: string;
};

export type CompleteAttemptResponse = {
  attempt: GameAttempt;
  application: ApiApplication;
  next_route_hint?: "review" | "onboarding" | "dashboard";
};

export type LatestAttemptResponse = {
  attempt: GameAttempt;
  application: ApiApplication;
};

export type ApplicationResponse = {
  application: ApiApplication;
  verification_request?: {
    status: "pending" | "confirmed" | "denied" | "no_response";
    follow_up_count: number;
  } | null;
  next_action?: {
    label: string;
    route: string;
  } | null;
};

export type OnboardingDocumentSlot = {
  document_type: "cys_form" | "logbook" | "acceptance_letter" | "other";
  title: string;
  description?: string;
  requires_physical_signature?: boolean;
  uploaded: null | {
    id: string;
    status: string;
    file_url: string;
    uploaded_at: string;
  };
};

export type OnboardingDocumentsResponse = {
  required_documents: OnboardingDocumentSlot[];
  campus_signing_contact?: {
    name: string;
    email: string;
  } | null;
};

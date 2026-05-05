export type GameDifficulty = "standard" | "hard" | "boss";

export type GameSettings = {
  difficulty: GameDifficulty;
  memorySeconds: number;
  zzleSeconds: number;
};

export const GAME_SETTINGS_KEY = "talentNationGameSettings";
export const GAME_ATTEMPTS_KEY = "talentNationGameAttempts";
export const MAX_GAME_ATTEMPTS = 3;
export const PASS_MARK = 70;

export const defaultGameSettings: GameSettings = {
  difficulty: "boss",
  memorySeconds: 45,
  zzleSeconds: 90,
};

export const getGameSettings = (): GameSettings => {
  if (typeof window === "undefined") return defaultGameSettings;

  try {
    const stored = window.localStorage.getItem(GAME_SETTINGS_KEY);
    if (!stored) return defaultGameSettings;
    const parsed = JSON.parse(stored) as Partial<GameSettings>;

    return {
      difficulty: parsed.difficulty ?? defaultGameSettings.difficulty,
      memorySeconds: Number(parsed.memorySeconds) || defaultGameSettings.memorySeconds,
      zzleSeconds: Number(parsed.zzleSeconds) || defaultGameSettings.zzleSeconds,
    };
  } catch {
    return defaultGameSettings;
  }
};

export const saveGameSettings = (settings: GameSettings) => {
  window.localStorage.setItem(GAME_SETTINGS_KEY, JSON.stringify(settings));
};

export const getCompletedAttempts = () => {
  if (typeof window === "undefined") return 0;
  return Number(window.localStorage.getItem(GAME_ATTEMPTS_KEY) ?? "0") || 0;
};

export const setCompletedAttempts = (attempts: number) => {
  window.localStorage.setItem(GAME_ATTEMPTS_KEY, String(Math.max(0, Math.min(MAX_GAME_ATTEMPTS, attempts))));
};

export const resetCompletedAttempts = () => setCompletedAttempts(0);

export const formatGameTime = (seconds: number) => {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const rest = safeSeconds % 60;
  return `${minutes}m ${String(rest).padStart(2, "0")}s`;
};

const KEY = "tn.moduleAccess.v1";

type AccessRecord = {
  /** modules opened with engagement timer met */
  accessed: Record<string, number>;
  /** quests that have been failed since last module access */
  failedQuests: Record<string, true>;
};

const read = (): AccessRecord => {
  if (typeof window === "undefined") return { accessed: {}, failedQuests: {} };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { accessed: {}, failedQuests: {} };
    return JSON.parse(raw) as AccessRecord;
  } catch {
    return { accessed: {}, failedQuests: {} };
  }
};

const write = (rec: AccessRecord) => {
  window.localStorage.setItem(KEY, JSON.stringify(rec));
};

export const markModuleAccessed = (moduleId: string, questId?: string) => {
  const rec = read();
  rec.accessed[moduleId] = Date.now();
  if (questId) {
    delete rec.failedQuests[questId];
  }
  write(rec);
};

export const isModuleAccessed = (moduleId: string) => {
  const rec = read();
  return Boolean(rec.accessed[moduleId]);
};

export const markQuestFailed = (questId: string) => {
  const rec = read();
  rec.failedQuests[questId] = true;
  write(rec);
};

export const isQuestRetryBlocked = (questId: string) => {
  const rec = read();
  return Boolean(rec.failedQuests[questId]);
};

export const isQuestUnlocked = (
  moduleId: string | undefined,
  questId: string | undefined,
) => {
  if (!moduleId) return false;
  if (!isModuleAccessed(moduleId)) return false;
  if (questId && isQuestRetryBlocked(questId)) return false;
  return true;
};

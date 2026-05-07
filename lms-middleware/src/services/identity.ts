export const canonicalQuestId = (questId: string) => {
  const trimmed = String(questId || '').trim();
  if (!trimmed) return 'quest-00';
  return trimmed.startsWith('quest-') ? trimmed : `quest-${trimmed}`;
};

export const shortQuestId = (questId: string) => canonicalQuestId(questId).replace(/^quest-/, '');

export const repoNameForQuest = (questId: string) => `quest-${shortQuestId(questId)}`;

export const templateRepoNameForQuest = (questId: string) => `${repoNameForQuest(questId)}-template`;

export const toGiteaUsername = (value: string) => {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/@.*$/, '')
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || 'user';
};

export const userDisplayName = (user: { firstName?: string | null; lastName?: string | null; email: string }) => {
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return name || user.email;
};

import { config } from '../config/env';
import { dbService } from './dbService';
import { giteaService } from './giteaService';
import { repoNameForQuest, toGiteaUsername } from './identity';

export const auditMatchingService = {
  tryMatchExercise: async (auditee: string, questId: string, exerciseId: string) => {
    const auditor = await dbService.findEligibleExerciseAuditor(questId, exerciseId, auditee);
    if (!auditor) return null;

    const owner = toGiteaUsername(auditee);
    const repoName = repoNameForQuest(questId);
    const repoUrl = `${config.gitea.webUrl}/${owner}/${repoName}`;

    await giteaService.addCollaborator(owner, repoName, toGiteaUsername(auditor), 'read');

    return dbService.createAuditSession(
      auditee,
      auditor,
      questId,
      exerciseId,
      repoUrl,
      new Date(Date.now() + 30 * 60 * 1000),
    );
  },
};

import { Request, Response } from 'express';
import { dbService } from '../services/dbService';
import { manifestService } from '../services/manifestService';
import { auditMatchingService } from '../services/auditMatchingService';

export const handleGiteaWebhook = async (req: Request, res: Response) => {
  // Security: In a production environment, you should verify req.headers['x-gitea-signature'] here
  
  const { results, questId, studentUsername, exerciseId, commit_id: commitId } = req.body;

  if (!results) {
    return res.status(400).send('No test results found in payload');
  }

  if (!studentUsername || !questId || !exerciseId) {
    return res.status(400).send('Missing studentUsername, questId, or exerciseId in payload');
  }

  const passed = results.numFailedTestSuites === 0;

  try {
    console.log(`Received webhook for ${studentUsername} - Quest: ${questId} - Exercise: ${exerciseId} - Commit: ${commitId || 'unknown'} - Status: ${passed ? 'PASSED' : 'FAILED'}`);

    if (passed) {
      // 1. Record individual exercise pass
      await dbService.recordExerciseResult(studentUsername, questId, exerciseId, 'WAITING_FOR_AUDIT', {
        ...results,
        commit_id: commitId,
      });
      await dbService.joinAuditQueue(studentUsername, questId, exerciseId);
      await auditMatchingService.tryMatchExercise(studentUsername, questId, exerciseId);

      // 2. Determine next exercise
      const nextExerciseId = manifestService.getNextExerciseId(questId, exerciseId);

      if (nextExerciseId === 'DONE') {
        console.log(`[Quest] Student ${studentUsername} finished bot tests for ${questId}. Waiting for exercise audits.`);
        await dbService.updateStudentProgress(studentUsername, questId, 'WAITING_FOR_AUDIT', exerciseId);
      } else {
        // Unlock next exercise
        console.log(`[Quest] Student ${studentUsername} passed ${exerciseId}. Unlocking ${nextExerciseId}.`);
        await dbService.updateStudentProgress(studentUsername, questId, 'IN_PROGRESS', nextExerciseId);
      }
    } else {
      await dbService.recordExerciseResult(studentUsername, questId, exerciseId, 'FAILED', {
        ...results,
        commit_id: commitId,
      });
      await dbService.updateStudentProgress(studentUsername, questId, 'IN_PROGRESS', exerciseId);
    }
    
    res.status(200).send('Result recorded');
  } catch (error: any) {
    console.error('Database update failed:', error.message);
    res.status(500).send('Internal Server Error');
  }
};

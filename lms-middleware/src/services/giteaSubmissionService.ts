import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { config } from '../config/env';

const execFileAsync = promisify(execFile);

interface SubmitToRepoInput {
  studentUsername: string;
  questId: string;
  exerciseId: string;
  code: string;
}

const toGiteaUsername = (username: string) => {
  const normalized = username
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || username;
};

const getAuthenticatedRemote = (owner: string, repo: string) => {
  const internalWebUrl = config.gitea.url.replace(/\/api\/v1\/?$/, '');
  const base = new URL(internalWebUrl || config.gitea.webUrl);
  base.username = config.gitea.admin.username;
  base.password = config.gitea.token;
  base.pathname = `/${owner}/${repo}.git`;
  return base.toString();
};

const runGit = async (args: string[], cwd: string) => {
  try {
    return await execFileAsync('git', args, { cwd, windowsHide: true, timeout: 30000 });
  } catch (error: any) {
    const detail = error.stderr || error.stdout || error.message;
    throw new Error(`Git command failed: ${detail}`);
  }
};

export const giteaSubmissionService = {
  submitCode: async ({ studentUsername, questId, exerciseId, code }: SubmitToRepoInput) => {
    const owner = toGiteaUsername(studentUsername);
    const normalizedQuestId = questId.replace(/^quest-/, '');
    const repo = `quest-${normalizedQuestId}`;
    const remote = getAuthenticatedRemote(owner, repo);
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'lms-submit-'));
    const worktree = path.join(tempRoot, repo);

    try {
      await runGit(['clone', remote, worktree], tempRoot);

      const solutionPath = path.join(worktree, 'exercises', exerciseId, 'solution.py');
      const metadataPath = path.join(worktree, '.lms', 'latest-submission.json');
      fs.mkdirSync(path.dirname(solutionPath), { recursive: true });
      fs.mkdirSync(path.dirname(metadataPath), { recursive: true });

      fs.writeFileSync(solutionPath, code.endsWith('\n') ? code : `${code}\n`, 'utf8');
      fs.writeFileSync(metadataPath, JSON.stringify({
        studentUsername,
        giteaUsername: owner,
        questId,
        exerciseId,
        submittedAt: new Date().toISOString(),
      }, null, 2), 'utf8');

      await runGit(['config', 'user.email', config.gitea.admin.email], worktree);
      await runGit(['config', 'user.name', 'LMS Submit Bot'], worktree);
      await runGit(['add', solutionPath, metadataPath], worktree);

      const diff = await runGit(['diff', '--cached', '--name-only'], worktree);
      if (!diff.stdout.trim()) {
        const currentSha = (await runGit(['rev-parse', 'HEAD'], worktree)).stdout.trim();
        return {
          commitId: currentSha,
          repoFullName: `${owner}/${repo}`,
          repoUrl: `${config.gitea.webUrl}/${owner}/${repo}`,
          changed: false,
        };
      }

      await runGit(['commit', '-m', `Submit ${questId}/${exerciseId}`], worktree);
      const commitId = (await runGit(['rev-parse', 'HEAD'], worktree)).stdout.trim();

      // Try to push to main branch, if it fails, try master
      try {
        await runGit(['push', '-u', 'origin', 'main'], worktree);
      } catch (error) {
        // If main doesn't work, try master (older default branch name)
        await runGit(['push', '-u', 'origin', 'master'], worktree);
      }

      return {
        commitId,
        repoFullName: `${owner}/${repo}`,
        repoUrl: `${config.gitea.webUrl}/${owner}/${repo}`,
        changed: true,
      };
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  },
};

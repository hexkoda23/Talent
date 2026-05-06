import { execFile } from 'child_process';
import { promisify } from 'util';
import { config } from '../config/env';

const execFileAsync = promisify(execFile);

interface BootstrapUser {
  username: string;
  email: string;
  password: string;
  admin?: boolean;
  mustChangePassword?: boolean;
}

const runGiteaCli = async (args: string[]) => {
  const baseArgs = [
    '--work-path',
    config.gitea.cliWorkPath,
    '--config',
    config.gitea.cliConfigPath,
  ];

  return execFileAsync(config.gitea.cliPath, [...baseArgs, ...args], {
    windowsHide: true,
    timeout: 60000,
  });
};

const isAlreadyExists = (message: string) => (
  message.toLowerCase().includes('already exists') ||
  message.toLowerCase().includes('user already exists') ||
  message.toLowerCase().includes('duplicate')
);

const createUser = async (user: BootstrapUser) => {
  const args = [
    'admin',
    'user',
    'create',
    '--username',
    user.username,
    '--password',
    user.password,
    '--email',
    user.email,
    '--must-change-password=false',
  ];

  if (user.admin) args.push('--admin');

  try {
    await runGiteaCli(args);
    console.log(`[Gitea Bootstrap] Created ${user.admin ? 'admin' : 'user'} account: ${user.username}`);
  } catch (error: any) {
    const message = `${error.stderr || ''}\n${error.stdout || ''}\n${error.message || ''}`;
    if (isAlreadyExists(message)) {
      console.log(`[Gitea Bootstrap] Account already exists: ${user.username}`);
      return;
    }
    throw new Error(`Failed to create Gitea account ${user.username}: ${message.trim()}`);
  }
};

const parseBootstrapUsers = (): BootstrapUser[] => {
  if (!config.gitea.bootstrapUsers.trim()) return [];

  try {
    return JSON.parse(config.gitea.bootstrapUsers);
  } catch (error: any) {
    throw new Error(`GITEA_BOOTSTRAP_USERS must be valid JSON: ${error.message}`);
  }
};

export const giteaCliService = {
  bootstrap: async () => {
    if (!config.gitea.bootstrapEnabled) {
      console.log('[Gitea Bootstrap] Disabled.');
      return;
    }

    if (!config.gitea.cliPath || !config.gitea.cliWorkPath || !config.gitea.cliConfigPath) {
      console.log('[Gitea Bootstrap] Skipped. GITEA_CLI_PATH, GITEA_CLI_WORK_PATH, or GITEA_CLI_CONFIG_PATH is not set.');
      return;
    }

    console.log('[Gitea Bootstrap] Preparing Gitea database and system accounts...');
    await runGiteaCli(['migrate']);

    await createUser({
      username: config.gitea.admin.username,
      email: config.gitea.admin.email,
      password: config.gitea.admin.password,
      admin: true,
      mustChangePassword: false,
    });

    for (const user of parseBootstrapUsers()) {
      await createUser({
        ...user,
        admin: Boolean(user.admin),
        mustChangePassword: user.mustChangePassword ?? false,
      });
    }
  },
};

import dotenv from 'dotenv';
dotenv.config();

export const config = {
  gitea: {
    url: process.env.GITEA_API_URL || 'https://git.your-app.com/api/v1',
    webUrl: process.env.GITEA_WEB_URL || (process.env.GITEA_API_URL || 'https://git.your-app.com/api/v1').replace(/\/api\/v1\/?$/, ''),
    token: process.env.GITEA_ADMIN_TOKEN || '',
    cliPath: process.env.GITEA_CLI_PATH || '',
    cliWorkPath: process.env.GITEA_CLI_WORK_PATH || '',
    cliConfigPath: process.env.GITEA_CLI_CONFIG_PATH || '',
    bootstrapEnabled: process.env.GITEA_BOOTSTRAP_ENABLED !== 'false',
    admin: {
      username: process.env.GITEA_ADMIN_USERNAME || 'Dotunbey',
      email: process.env.GITEA_ADMIN_EMAIL || 'dotun@example.com',
      password: process.env.GITEA_ADMIN_PASSWORD || 'Password123!',
    },
    bootstrapUsers: process.env.GITEA_BOOTSTRAP_USERS || '',
  },
  db: {
    url: process.env.DATABASE_URL || '',
  },
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    apiKey: process.env.MIDDLEWARE_API_KEY || '',
  },
};

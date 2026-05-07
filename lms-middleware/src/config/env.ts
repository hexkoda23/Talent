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
    templateOwner: process.env.GITEA_TEMPLATE_OWNER || process.env.GITEA_ADMIN_USERNAME || 'curriculum-team',
    bootstrapEnabled: process.env.GITEA_BOOTSTRAP_ENABLED !== 'false',
    admin: {
      username: process.env.GITEA_ADMIN_USERNAME || 'Dotunbey',
      email: process.env.GITEA_ADMIN_EMAIL || 'dotun@example.com',
      password: process.env.GITEA_ADMIN_PASSWORD || 'Password123!',
    },
    bootstrapUsers: process.env.GITEA_BOOTSTRAP_USERS || '',
  },
  db: {
    url: process.env.LMS_DATABASE_URL || process.env.DATABASE_URL || '',
  },
  mainBackend: {
    url: process.env.MAIN_BACKEND_URL || 'http://localhost:3000',
    userAppUrl: process.env.MAIN_USER_APP_URL || 'http://localhost:5173/dashboard',
    adminAppUrl: process.env.MAIN_ADMIN_APP_URL || 'http://localhost:5174/admin/dashboard',
  },
  auth: {
    launchSecret: process.env.LMS_LAUNCH_SECRET || process.env.JWT_ACCESS_SECRET || 'change-this-access-secret',
    sessionSecret: process.env.LMS_SESSION_SECRET || process.env.LMS_LAUNCH_SECRET || process.env.JWT_ACCESS_SECRET || 'change-this-access-secret',
    cookieName: process.env.LMS_SESSION_COOKIE || 'tn_lms_session',
  },
  oidc: {
    issuer: process.env.OIDC_ISSUER || process.env.LMS_PUBLIC_URL || process.env.MAIN_BACKEND_URL || 'http://app:3000',
    clientId: process.env.OIDC_CLIENT_ID || 'lms-middleware',
    clientSecret: process.env.OIDC_CLIENT_SECRET || 'lms-secret',
  },
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    apiKey: process.env.MIDDLEWARE_API_KEY || '',
  },
};

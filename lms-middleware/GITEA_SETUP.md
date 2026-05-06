# Gitea SSO & Runner Configuration

To complete the 01Edu-style setup, follow these steps after running `docker-compose up`:

## 1. Connect Gitea to the LMS SSO
1. Log into Gitea at `http://localhost:3001` (Admin).
2. Go to **Site Administration** > **Authentication Sources**.
3. Add a new source with type **OAuth2**.
4. Set the following values:
   - **Authentication Name**: `LMS-SSO`
   - **OAuth2 Provider**: `Custom`
   - **Client ID**: `lms-middleware` (or any string)
   - **Client Secret**: `lms-secret` (or any string)
   - **Authorize URL**: `http://app:3000/api/v1/auth/authorize`
   - **Token URL**: `http://app:3000/api/v1/auth/token`
   - **Userinfo URL**: `http://app:3000/api/v1/auth/userinfo`
5. Enable **Auto-discovery of OpenID Connect** if possible, or manually map the email/username.

## 2. Register the Action Runner
1. Go to **Site Administration** > **Actions** > **Runners**.
2. Click **Create new Runner**.
3. Copy the **Registration Token**.
4. Paste this token into your `.env` file as `GITEA_RUNNER_TOKEN`.
5. Restart the runner container: `docker-compose restart runner`.

## 3. Setup Template Repository
1. Create a repository in Gitea named `quest-00-template` under the `curriculum-team` organization.
2. Add the `.gitea/workflows/test.yml` file from the `templates/` directory in this project.
3. Mark it as a **Template Repository** in settings.

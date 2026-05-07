# Gitea SSO & Runner Configuration

To complete the 01Edu-style setup, follow these steps after running `docker-compose up`:

## 1. Connect Gitea to the LMS SSO
1. Log into Gitea at `http://localhost:3001` (Admin).
2. Go to **Site Administration** > **Authentication Sources**.
3. Add a new source with type **OpenID Connect**.
4. Set the following values:
   - **Authentication Name**: `LMS-SSO`
   - **Discovery URL**: `http://app:3000/.well-known/openid-configuration`
   - **Client ID**: `lms-middleware`
   - **Client Secret**: `lms-secret`
5. Save and set username/email claim mapping:
   - username claim: `preferred_username`
   - email claim: `email`

## 2. Register the Action Runner
1. Go to **Site Administration** > **Actions** > **Runners**.
2. Click **Create new Runner**.
3. Copy the **Registration Token**.
4. Paste this token into your `.env` file as `GITEA_RUNNER_TOKEN`.
5. Restart the runner container: `docker-compose restart runner`.

## 3. Setup Template Repository
1. Create a repository in Gitea named `quest-00-template` under the owner configured as `GITEA_TEMPLATE_OWNER`.
2. Add the `.gitea/workflows/test.yml` file from the `templates/` directory in this project.
3. Mark it as a **Template Repository** in settings.

import axios from 'axios';
import { config } from '../config/env';

const apiClient = axios.create({
  baseURL: config.gitea.url,
  headers: {
    Authorization: `token ${config.gitea.token}`,
    'Content-Type': 'application/json',
  },
});

const getGiteaErrorMessage = (error: any) => {
  const responseMessage = error.response?.data?.message || error.response?.data?.error || error.response?.data;
  if (typeof responseMessage === 'string') return responseMessage;
  if (responseMessage) return JSON.stringify(responseMessage);
  return error.message || 'Unknown Gitea error';
};

export const giteaService = {
  /**
   * Fetch a user if it exists.
   */
  getUser: async (username: string) => {
    try {
      const response = await apiClient.get(`/users/${username}`);
      return response.data;
    } catch (error: any) {
      const message = getGiteaErrorMessage(error);
      if (
        error.response?.status === 404 ||
        message.includes('user does not exist') ||
        message.includes('user redirect does not exist')
      ) return null;
      throw new Error(`Failed to fetch user ${username}: ${getGiteaErrorMessage(error)}`);
    }
  },

  /**
   * Fetch a repository if it exists.
   */
  getRepo: async (owner: string, repo: string) => {
    try {
      const response = await apiClient.get(`/repos/${owner}/${repo}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) return null;
      throw new Error(`Failed to fetch repo: ${getGiteaErrorMessage(error)}`);
    }
  },

  /**
   * Create a new user in Gitea.
   */
  createUser: async (username: string, email: string) => {
    const existingUser = await giteaService.getUser(username);
    if (existingUser) return existingUser;

    const create = async (candidateEmail: string) => apiClient.post('/admin/users', {
      username,
      email: candidateEmail,
      password: 'TemporaryPassword123!', // They will use SSO anyway
      must_change_password: false,
      send_notify: false,
    });

    try {
      const response = await create(email);
      return response.data;
    } catch (error: any) {
      const afterConflict = await giteaService.getUser(username);
      if (afterConflict) return afterConflict;

      if (error.response?.status === 422 || getGiteaErrorMessage(error).includes('user does not exist')) {
        try {
          const fallbackEmail = `${username}@students.local`;
          const response = await create(fallbackEmail);
          return response.data;
        } catch (fallbackError: any) {
          const finalUser = await giteaService.getUser(username);
          if (finalUser) return finalUser;
          throw new Error(`Failed to create user ${username}: ${getGiteaErrorMessage(fallbackError)}`);
        }
      }
      throw new Error(`Failed to create user: ${getGiteaErrorMessage(error)}`);
    }
  },

  /**
   * Generate a repository from a template.
   */
  generateRepo: async (studentUsername: string, templateOwner: string, templateRepo: string, newRepoName: string) => {
    try {
      const response = await apiClient.post(`/repos/${templateOwner}/${templateRepo}/generate`, {
        owner: studentUsername,
        name: newRepoName,
        private: false,
        git_content: true,
        topics: true,
        git_hooks: true,
        webhooks: true,
        avatar: true,
        labels: true,
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 422 || error.response?.status === 409) {
        // Repo already exists, fetch it and return
        console.log(`[Gitea] Repo ${newRepoName} already exists for ${studentUsername}, skipping generation.`);
        const existingRepo = await giteaService.getRepo(studentUsername, newRepoName);
        if (!existingRepo) {
          throw new Error(`Failed to verify existing repo ${studentUsername}/${newRepoName}`);
        }
        return existingRepo;
      }
      throw new Error(`Failed to generate repo: ${getGiteaErrorMessage(error)}`);
    }
  },


  /**
   * Add the automated bot as a collaborator with admin permissions.
   */
  addBotCollaborator: async (studentUsername: string, repoName: string, botUsername: string = 'grader-bot') => {
    try {
      const response = await apiClient.put(`/repos/${studentUsername}/${repoName}/collaborators/${botUsername}`, {
        permission: 'admin', // Bot needs admin to trigger webhooks/actions if necessary
      });
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to add bot collaborator: ${getGiteaErrorMessage(error)}`);
    }
  },

  addCollaborator: async (owner: string, repoName: string, collaborator: string, permission: 'read' | 'write' | 'admin' = 'read') => {
    try {
      const response = await apiClient.put(`/repos/${owner}/${repoName}/collaborators/${collaborator}`, {
        permission,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to add ${collaborator} to ${owner}/${repoName}: ${getGiteaErrorMessage(error)}`);
    }
  },

  getContents: async (owner: string, repo: string, filePath: string = '') => {
    try {
      const response = await apiClient.get(`/repos/${owner}/${repo}/contents/${filePath}`);
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to read ${owner}/${repo}/${filePath}: ${getGiteaErrorMessage(error)}`);
    }
  },

  createFile: async (owner: string, repo: string, filePath: string, content: string, message: string) => {
    const encodedContent = Buffer.from(content, 'utf8').toString('base64');
    try {
      const existing = await apiClient.get(`/repos/${owner}/${repo}/contents/${filePath}`);
      const response = await apiClient.put(`/repos/${owner}/${repo}/contents/${filePath}`, {
        content: encodedContent,
        message,
        sha: existing.data.sha,
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status !== 404) {
        throw new Error(`Failed to write ${owner}/${repo}/${filePath}: ${getGiteaErrorMessage(error)}`);
      }
      try {
        const response = await apiClient.post(`/repos/${owner}/${repo}/contents/${filePath}`, {
          content: encodedContent,
          message,
        });
        return response.data;
      } catch (createError: any) {
        throw new Error(`Failed to create ${owner}/${repo}/${filePath}: ${getGiteaErrorMessage(createError)}`);
      }
    }
  },

  /**
   * Enable Gitea Actions for a repository.
   */
  enableActions: async (owner: string, repo: string) => {
    try {
      const response = await apiClient.patch(`/repos/${owner}/${repo}`, {
        has_actions: true,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to enable Actions for ${owner}/${repo}: ${getGiteaErrorMessage(error)}`);
    }
  },

  /**
   * Freeze a repository snapshot for audit.
   */
  archiveRepo: async (owner: string, repo: string) => {
    try {
      const response = await apiClient.patch(`/repos/${owner}/${repo}`, {
        archived: true,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to freeze ${owner}/${repo} for audit: ${getGiteaErrorMessage(error)}`);
    }
  },

  /**
   * Set a secret in the repository for Gitea Actions.
   */
  setRepoSecret: async (owner: string, repo: string, secretName: string, secretValue: string) => {
    try {
      const response = await apiClient.put(`/repos/${owner}/${repo}/actions/secrets/${secretName}`, {
        data: secretValue,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to set repository secret ${secretName}: ${getGiteaErrorMessage(error)}`);
    }
  }
};

import { config } from '../config/env';

/**
 * Auth service for SSO integration.
 * Implements a basic OAuth2 flow for Gitea.
 */
export const authService = {
  // In-memory storage for auth codes (use Redis for production)
  authCodes: new Map<string, { username: string, email: string }>(),

  /**
   * Generate an authorization code.
   */
  generateAuthCode: (username: string, email: string) => {
    const code = Math.random().toString(36).substring(2, 15);
    authService.authCodes.set(code, { username, email });
    
    // Expire code after 5 minutes
    setTimeout(() => authService.authCodes.delete(code), 5 * 60 * 1000);
    
    return code;
  },

  /**
   * Exchange code for a token (Mocked for simplicity).
   */
  exchangeCodeForToken: (code: string) => {
    const user = authService.authCodes.get(code);
    if (!user) throw new Error('Invalid or expired authorization code');
    
    authService.authCodes.delete(code);
    
    // In a real OIDC provider, this would be a JWT
    return {
      access_token: `at_${Math.random().toString(36).substring(2, 15)}`,
      token_type: 'Bearer',
      expires_in: 3600,
      user
    };
  }
};

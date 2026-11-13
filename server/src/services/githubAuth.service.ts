import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma.js';

export interface GitHubUserProfile {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
  bio: string | null;
}

export interface GitHubRepoItem {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  default_branch: string;
}

export class GitHubAuthService {
  private static get clientId(): string {
    return process.env.GITHUB_CLIENT_ID || '';
  }

  private static get clientSecret(): string {
    return process.env.GITHUB_CLIENT_SECRET || '';
  }

  private static get clientUrl(): string {
    return process.env.CLIENT_URL || 'http://localhost:5173';
  }

  private static get jwtSecret(): string {
    return process.env.JWT_SECRET || 'pigeon-jwt-secret-key-default';
  }

  /**
   * Check if GitHub OAuth keys are configured in environment
   */
  static isConfigured(): boolean {
    return Boolean(this.clientId.trim() && this.clientSecret.trim());
  }

  /**
   * Generates the GitHub OAuth authorize URL
   */
  static getAuthorizeUrl(): { url: string; configured: boolean; clientId: string } {
    if (!this.isConfigured()) {
      return {
        url: '',
        configured: false,
        clientId: '',
      };
    }

    const params = new URLSearchParams({
      client_id: this.clientId,
      scope: 'read:user,user:email,repo',
      redirect_uri: `${this.clientUrl}`,
      prompt: 'select_account',
    });

    return {
      url: `https://github.com/login/oauth/authorize?${params.toString()}`,
      configured: true,
      clientId: this.clientId,
    };
  }

  /**
   * Exchanges an authorization code for a GitHub Access Token
   */
  static async exchangeCodeForToken(code: string): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('GitHub Client ID or Client Secret is not configured in server/.env');
    }

    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
      }),
    });

    if (!response.ok) {
      throw new Error(`GitHub token exchange failed: HTTP ${response.status}`);
    }

    const data: any = await response.json();

    if (data.error) {
      throw new Error(`GitHub OAuth error: ${data.error_description || data.error}`);
    }

    if (!data.access_token) {
      throw new Error('No access_token returned by GitHub');
    }

    return data.access_token;
  }

  /**
   * Fetches user profile from GitHub API
   */
  static async fetchGitHubProfile(accessToken: string): Promise<GitHubUserProfile> {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'Pigeon-App',
        Accept: 'application/vnd.github+json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch GitHub profile: HTTP ${response.status}`);
    }

    const profile: any = await response.json();

    // If profile email is null or private, attempt to fetch from /user/emails
    if (!profile.email) {
      try {
        const emailsRes = await fetch('https://api.github.com/user/emails', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'User-Agent': 'Pigeon-App',
            Accept: 'application/vnd.github+json',
          },
        });

        if (emailsRes.ok) {
          const emails = (await emailsRes.json()) as any[];
          const primaryEmail = emails.find((e: any) => e.primary && e.verified) || emails[0];
          if (primaryEmail) {
            profile.email = primaryEmail.email;
          }
        }
      } catch (err) {
        console.warn('Could not fetch GitHub private emails:', err);
      }
    }

    return profile;
  }

  /**
   * Fetches the user's top active repositories from GitHub
   */
  static async fetchUserRepositories(accessToken: string): Promise<GitHubRepoItem[]> {
    try {
      const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=8&type=owner', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'User-Agent': 'Pigeon-App',
          Accept: 'application/vnd.github+json',
        },
      });

      if (!response.ok) {
        return [];
      }

      const repos = (await response.json()) as any[];
      return repos.map(r => ({
        id: r.id,
        name: r.name,
        full_name: r.full_name,
        html_url: r.html_url,
        description: r.description,
        language: r.language,
        default_branch: r.default_branch || 'main',
      }));
    } catch {
      return [];
    }
  }

  /**
   * Creates or updates the User record and seeds their repositories in Prisma
   */
  static async authenticateUser(profile: GitHubUserProfile, accessToken: string) {
    const githubId = String(profile.id);

    // Upsert user in database
    let user = await prisma.user.upsert({
      where: { githubId },
      update: {
        username: profile.login,
        name: profile.name || profile.login,
        email: profile.email || `${profile.login}@users.noreply.github.com`,
        avatarUrl: profile.avatar_url,
        accessToken,
      },
      create: {
        githubId,
        username: profile.login,
        name: profile.name || profile.login,
        email: profile.email || `${profile.login}@users.noreply.github.com`,
        avatarUrl: profile.avatar_url,
        accessToken,
      },
      include: {
        socialAccounts: true,
        socialGroups: { include: { members: true } },
        repositories: true,
      },
    });

    // Refresh user record
    user = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        socialAccounts: true,
        socialGroups: { include: { members: true } },
        repositories: true,
      },
    }) as any;

    // Generate JWT
    const token = jwt.sign(
      {
        userId: user.id,
        githubId: user.githubId,
        username: user.username,
      },
      this.jwtSecret,
      { expiresIn: '30d' }
    );

    return { user, token };
  }

  /**
   * Helper for quick dev login when OAuth keys aren't added yet
   */
  static async devMockLogin(customUsername?: string) {
    const mockProfile: GitHubUserProfile = {
      id: 9942081,
      login: customUsername || 'dev_builder',
      name: 'Developer Builder',
      email: `${customUsername || 'dev_builder'}@pigeon.dev`,
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      bio: 'Building in public with Pigeon.',
    };

    return this.authenticateUser(mockProfile, 'mock_github_access_token');
  }
}

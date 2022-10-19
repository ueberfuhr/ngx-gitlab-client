/**
 * The configuration that is used to access Gitlab.
 */
export interface GitlabConfig {

  /**
   * The URL to the GitLab server.
   */
  host: string;
  /**
   * The access token that is used to access GitLab.
   */
  token: string;

}

/**
 * Returns an empty Gitlab configuration.
 */
export function emptyGitlabConfig(): GitlabConfig {
  return {
    host: '',
    token: ''
  };
}

export function staticGitlabConfig(config: GitlabConfig): () => GitlabConfig {
  return () => config;
}

/**
 * The GitLab configuration provider. Can be injected into the services.
 */
export class GitlabConfigProvider {
  constructor(private readonly resolveFn: () => GitlabConfig) {
  }

  public get(): GitlabConfig {
    return this.resolveFn();
  }

  public static fromStatic(config: GitlabConfig): GitlabConfigProvider {
    return new GitlabConfigProvider(staticGitlabConfig(config));
  }

}

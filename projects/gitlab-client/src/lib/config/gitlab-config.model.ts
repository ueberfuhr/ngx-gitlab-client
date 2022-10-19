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

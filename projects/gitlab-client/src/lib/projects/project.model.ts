/**
 * The project group.
 */
export interface GitlabProjectNamespace {
  /**
   * The id of the group.
   */
  id: number,
  /**
   * The unique path of the group within the Gitlab instance.
   */
  fullPath: string
}

/**
 * The model object for a Gitlab project.
 */
export interface GitlabProject {

  /**
   * The id of the project within the Gitlab instance.
   */
  id: number;
  /**
   * The simple project name.
   */
  name: string;
  /**
   * The unique project name within the Gitlab instance using a slash as separator.
   */
  nameWithNamespace: string;
  /**
   * The unique name of the group within the Gitlab instance using a slash as separator.
   */
  pathWithNamespace: string;
  /**
   * The URL to the project that can be opened within a browser.
   */
  webUrl: string;
  /**
   * The group containing the project.
   */
  namespace: GitlabProjectNamespace
}

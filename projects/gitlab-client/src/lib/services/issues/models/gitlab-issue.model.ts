export type GitlabIssueState = "opened" | "closed";
export type GitlabIssueType = "issue" | "incident" | "test_case";

/**
 * A Gitlab issue.
 */
export interface GitlabIssue {

  /**
   * The ID that is unique across all projects. Can be empty when created.
   */
  id?: number;
  /**
   * The internal ID (displayed in the web UI) that’s unique in the scope of a single project.
   * See {@link https://docs.gitlab.com/ee/api/#id-vs-iid} for more information.
   */
  iid?: number;
  /**
   * The title.
   */
  title: string;
  /**
   * The description text.
   */
  description: string;
  /**
   * The state of the issue.
   */
  state: GitlabIssueState;
  /**
   * The labels of the issue.
   */
  labels: string[];
  /**
   * The type of issue.
   */
  issue_type: GitlabIssueType;

}

/**
 * The issue statistics for a project, a group or the whole Gitlab.
 */
export interface GitlabIssuesStatistics {
  /**
   * The count of closed issues.
   */
  closed: number,
  /**
   * The count of opened issues.
   */
  opened: number
}

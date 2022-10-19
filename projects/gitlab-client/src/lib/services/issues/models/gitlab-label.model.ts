/**
 * A label that is assigned to issues.
 */
export interface GitlabLabel {

  /**
   * The id of the label. This is empty when creating a label.
   */
  id?: number,
  /**
   * The name of the label.
   */
  name: string,
  /**
   * A description for the label.
   */
  description?: string,
  /**
   * The label background-color as hex string (<code>#FFFFFF</code>).
   */
  color: string,
  /**
   * A flag indicating that the label is declared within the project or within one of the parent groups.
   */
  is_project_label: boolean

}

/**
 * A label including its usage statistics.
 */
export interface GitlabLabelWithCounts extends GitlabLabel {

  /**
   * The count of open issues.
   */
  open_issues_count: number,
  /**
   * The count of closed issues.
   */
  closed_issues_count: number,
  /**
   * The count of open merge requests.
   */
  open_merge_requests_count: number

}

/**
 * Returns a flag indicating that the label is used in issues or merge requests.
 * @param label the label
 * @return <tt>true</tt> if there is at least one issue or merge request with this label
 */
export function isLabelUsed(label: GitlabLabelWithCounts): boolean {
  return label.open_issues_count > 0
    || label.closed_issues_count > 0
    || label.open_merge_requests_count > 0;
}

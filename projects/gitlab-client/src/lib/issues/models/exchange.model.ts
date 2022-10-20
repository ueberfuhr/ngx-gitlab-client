import {GitlabIssueState, GitlabIssueType} from './gitlab-issue.model';

/**
 * A Gitlab issue model for exchange.
 */
export interface ExchangeIssue {

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
 * A label for exchange.
 */
export interface ExchangeLabel {

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
 * The model for exchange.
 */
export interface IssueExchangeModel {
  /**
   * The issues.
   */
  issues: ExchangeIssue[],
  /**
   * The labels.
   */
  labels: ExchangeLabel[]
}

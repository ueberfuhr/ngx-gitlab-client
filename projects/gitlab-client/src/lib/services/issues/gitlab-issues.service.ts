import {Injectable} from '@angular/core';
import {map, Observable} from 'rxjs';
import {DataSet, GitlabService} from '../shared/gitlab.service';
import {GitlabIssue, GitlabIssuesStatistics, GitlabIssueState} from './models/gitlab-issue.model';

@Injectable({
  providedIn: null
})
export class GitlabIssuesService {

  constructor(private readonly gitlab: GitlabService) {
  }

  /**
   * Remove all fields from Gitlab resource that are not needed within this application.
   * @param set the object that was received from Gitlab
   * @private the reduced object
   */
  private static reduceSet(set: DataSet<GitlabIssue>): DataSet<GitlabIssue> {
    set.payload = GitlabIssuesService.reduce(set.payload);
    return set;
  }

  private static reduce(issue: GitlabIssue): GitlabIssue {
    return {
      id: issue.id,
      iid: issue.iid,
      title: issue.title,
      description: issue.description,
      state: issue.state,
      labels: issue.labels,
      issue_type: issue.issue_type,
    };
  }

  getIssues(projectId: number, options?: IssueRequestOptions): Observable<DataSet<GitlabIssue>> {
    let params = {};
    if (options?.state) {
      params = Object.assign(params, {state: options.state});
    }
    return this.gitlab.callPaginated<GitlabIssue>(`projects/${projectId}/issues`, {
      params
    }).pipe(map(GitlabIssuesService.reduceSet));
  }

  getIssuesStatistics(projectId: number): Observable<GitlabIssuesStatistics> {
    return this.gitlab.call<{ statistics: { counts: GitlabIssuesStatistics } }>(`projects/${projectId}/issues_statistics`)
      .pipe(
        map(result => result.statistics.counts)
      );
  }

  create(projectId: number, issue: GitlabIssue): Observable<GitlabIssue> {
    return this.gitlab.call<GitlabIssue>(`projects/${projectId}/issues`, 'post', {
      params: {
        title: issue.title,
        description: issue.description,
        labels: issue.labels.join(','),
        issue_type: issue.issue_type,
        // don't import id, iid and state
      }
    })
  }

  delete(projectId: number, issueId: number): Observable<void> {
    return this.gitlab.call<void>(`projects/${projectId}/issues/${issueId}`, 'delete');
  }

}

export type IssueRequestOptions = {
  state?: GitlabIssueState
};

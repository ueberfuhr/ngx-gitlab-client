import {Injectable} from '@angular/core';
import {map, Observable, tap} from 'rxjs';
import {DataSet, GitlabService} from '../shared/gitlab.service';
import {GitlabLabel, GitlabLabelWithCounts} from './models/gitlab-label.model';
import {GitlabProject} from '../projects/project.model';

@Injectable({
  providedIn: null
})
export class GitlabLabelsService {

  constructor(private readonly gitlab: GitlabService) {
  }

  private static reduceWithCount(label: GitlabLabelWithCounts): GitlabLabelWithCounts {
    return Object.assign(GitlabLabelsService.reduce(label), {
      open_issues_count: label.open_issues_count,
      closed_issues_count: label.closed_issues_count,
      open_merge_requests_count: label.open_merge_requests_count
    });
  }

  private static reduce(label: GitlabLabel): GitlabLabel {
    return {
      id: label.id,
      color: label.color,
      description: label.description,
      name: label.name,
      is_project_label: label.is_project_label
    };
  }

  getLabelsForProject(projectId: number): Observable<DataSet<GitlabLabel>>;
  getLabelsForProject(projectId: number, addCounts: WithCountType): Observable<DataSet<GitlabLabelWithCounts>>;
  getLabelsForProject(projectId: number, addCounts?: WithCountType): Observable<DataSet<GitlabLabel | GitlabLabelWithCounts>> {
    if (addCounts) {
      return this.gitlab.callPaginated<GitlabLabelWithCounts>(`projects/${projectId}/labels`, {
        params: {
          with_counts: true
        }
      }).pipe(
        tap(set => set.payload = GitlabLabelsService.reduceWithCount(set.payload))
      );
    } else {
      return this.gitlab.callPaginated<GitlabLabel>(`projects/${projectId}/labels`).pipe(
        tap(set => set.payload = GitlabLabelsService.reduce(set.payload))
      );
    }
  }

  create(project: GitlabProject, label: GitlabLabel): Observable<GitlabLabel> {
    return label.is_project_label ?
      this.createForProject(label, project.id) :
      this.createForGroup(label, project.namespace.id);
  }

  private createForProject(label: GitlabLabel, projectId: number): Observable<GitlabLabel> {
    console.log(`Create project label ${label.name} with color ${label.color}`);
    return this.gitlab.call<GitlabLabel>(`projects/${projectId}/labels`, 'post', {
      params: {
        name: label.name,
        description: label.description ?? '',
        color: label.color,
      }
    }).pipe(
      map(GitlabLabelsService.reduce)
    );
  }

  private createForGroup(label: GitlabLabel, groupId: number): Observable<GitlabLabel> {
    console.log(`Create group label ${label.name} with color ${label.color}`);
    return this.gitlab.call<GitlabLabel>(`groups/${groupId}/labels`, 'post', {
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        name: label.name,
        description: label.description ?? '',
        color: label.color,
      }
    }).pipe(
      map(GitlabLabelsService.reduce)
    );
  }

  delete(project: GitlabProject, label: GitlabLabel,): Observable<void> {
    console.log(`Delete ${label.is_project_label ? 'project' : 'group'} label ${label.name} with color ${label.color}`);
    return this.gitlab.call<void>(`projects/${project.id}/labels/${label.name}`, 'delete');
  }

}

export type WithCountType = {};
/**
 * Use this to get the labels with count.
 */
export const withCount: WithCountType = {}

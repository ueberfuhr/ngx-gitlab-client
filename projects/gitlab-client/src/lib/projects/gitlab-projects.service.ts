import {Injectable} from '@angular/core';
import {map, Observable} from 'rxjs';
import {DataSet, GitlabService} from '../shared/gitlab.service';
import {GitlabProject} from './project.model';
import {GitlabApiProject, reduceGitlabApiProject, reduceGitlapApiProjectDataSet} from './project.api';

@Injectable({
  providedIn: null
})
export class GitlabProjectsService {

  constructor(private readonly gitlab: GitlabService) {
  }

  /**
   * Finds a project by id.
   * @param id the project's id
   * @return an observable with the found gitlab project
   */
  getProjectById(id: number): Observable<GitlabProject> {
    return this.gitlab.call<GitlabApiProject>(`projects/${id}`)
      .pipe(
        map(reduceGitlabApiProject)
      );
  }

  /**
   * Finds all projects that are available to the current user.
   * @param search a search text or empty, if all projects have to be found
   * @return an observable with the found data sets
   */
  getProjects(search?: string): Observable<DataSet<GitlabProject>> {
    return this.gitlab.callPaginated<GitlabApiProject>('projects', {
      params: {
        search: search ?? '',
        search_namespaces: true,
        order_by: 'path',
        membership: true,
        sort: 'asc',
        simple: true
      }
    }).pipe(
      map(reduceGitlapApiProjectDataSet)
    );
  }

}

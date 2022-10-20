import {GitlabProject, GitlabProjectNamespace} from './project.model';
import {DataSet} from '../shared/gitlab.service';
import {mapDataSet} from '../shared/utilities';

/**
 * The project group.
 */
export interface GitlabApiProjectNamespace {
  /**
   * The id of the group.
   */
  id: number,
  /**
   * The unique path of the group within the Gitlab instance.
   */
  full_path: string
}

/**
 * The model object for a Gitlab project.
 */
export interface GitlabApiProject {

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
  name_with_namespace: string;
  /**
   * The unique name of the group within the Gitlab instance using a slash as separator.
   */
  path_with_namespace: string;
  /**
   * The URL to the project that can be opened within a browser.
   */
  web_url: string;
  /**
   * The group containing the project.
   */
  namespace: GitlabApiProjectNamespace
}

export function reduceGitlabApiProjectNamespace(ns: GitlabApiProjectNamespace): GitlabProjectNamespace {
  return {
    id: ns.id,
    fullPath: ns.full_path
  };
}

export function reduceGitlabApiProject(p: GitlabApiProject): GitlabProject {
  return {
    id: p.id,
    name: p.name,
    nameWithNamespace: p.name_with_namespace,
    pathWithNamespace: p.path_with_namespace,
    webUrl: p.web_url,
    namespace: reduceGitlabApiProjectNamespace(p.namespace)
  }
}

export function reduceGitlapApiProjectDataSet(set: DataSet<GitlabApiProject>): DataSet<GitlabProject> {
  return mapDataSet<GitlabApiProject, GitlabProject>(set, reduceGitlabApiProject);
}

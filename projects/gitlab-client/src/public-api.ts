/*
 * Public API Surface of gitlab-client
 */

export * from './lib/gitlab-client.module';
export * from './lib/config/gitlab-config.model';
export * from './lib/shared/gitlab.service';
export * from './lib/users/gitlab-user.model';
export * from './lib/users/gitlab-users.service';
export * from './lib/projects/project.model';
export * from './lib/projects/gitlab-projects.service';
export * from './lib/issues/models/gitlab-issue.model';
export * from './lib/issues/models/gitlab-label.model';
export * from './lib/issues/models/exchange.model';
export * from './lib/issues/progress/progress.utilities';
export * from './lib/issues/progress/progress.service';
export * from './lib/issues/gitlab-issues.service';
export * from './lib/issues/gitlab-labels.service';
export * from './lib/issues/issue-export.service';
export * from './lib/issues/issue-import.service';
export * from './lib/issues/labels-by-name.pipe';

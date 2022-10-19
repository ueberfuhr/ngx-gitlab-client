import {ModuleWithProviders, NgModule} from '@angular/core';
import {GitlabConfig, GitlabConfigProvider} from './config/gitlab-config.model';
import {GitlabService} from './services/shared/gitlab.service';
import {HttpClientModule} from '@angular/common/http';
import {GitlabUsersService} from './services/users/gitlab-users.service';
import {GitlabProjectsService} from './services/projects/gitlab-projects.service';
import {LabelsByNamePipe} from './services/issues/labels-by-name.pipe';
import {GitlabIssuesService} from './services/issues/gitlab-issues.service';
import {GitlabLabelsService} from './services/issues/gitlab-labels.service';
import {IssueImportService} from './services/issues/issue-import.service';
import {IssueExportService} from './services/issues/issue-export.service';
import {IssueExportModelMapperService} from './services/issues/issue-export-model-mapper.service';

@NgModule({
  imports: [
    HttpClientModule
  ],
  providers: [
    GitlabService,
    GitlabUsersService,
    GitlabProjectsService,
    GitlabLabelsService,
    GitlabIssuesService,
    IssueExportModelMapperService,
    IssueImportService,
    IssueExportService
  ],
  declarations: [
    LabelsByNamePipe
  ],
  exports: [
    LabelsByNamePipe
  ]
})
export class GitlabClientModule {

  static forRoot(gitlabConfigFactory: () => GitlabConfig): ModuleWithProviders<GitlabClientModule> {
    return {
      ngModule: GitlabClientModule,
      providers: [
        {provide: GitlabConfigProvider, useValue: new GitlabConfigProvider(gitlabConfigFactory)}
      ]
    }
  }

}

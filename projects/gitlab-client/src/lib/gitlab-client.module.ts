import {InjectionToken, ModuleWithProviders, NgModule} from '@angular/core';
import {GitlabConfig} from './config/gitlab-config.model';
import {GitlabService} from './shared/gitlab.service';
import {HttpClientModule} from '@angular/common/http';
import {GitlabUsersService} from './users/gitlab-users.service';
import {GitlabProjectsService} from './projects/gitlab-projects.service';
import {LabelsByNamePipe} from './issues/labels-by-name.pipe';
import {GitlabIssuesService} from './issues/gitlab-issues.service';
import {GitlabLabelsService} from './issues/gitlab-labels.service';
import {IssueImportService} from './issues/issue-import.service';
import {IssueExportService} from './issues/issue-export.service';
import {IssueExportModelMapperService} from './issues/issue-export-model-mapper.service';

/**
 * Use this injection token to configure a Gitlab connection configuration provider.
 * This allows dynamically resolving the Gitlab connection configuration by using a service:
 *
 * <pre>
 * {
 *   provide: GITLAB_CONFIG_PROVIDER,
 *   useFactory: (service: MyGitlabConfigService) => () => service.configuration,
 *   deps: [MyGitlabConfigService],
 * }
 * </pre>
 *
 */
export const GITLAB_CONFIG_PROVIDER = new InjectionToken<() => GitlabConfig>("Gitlab Configuration Provider");

/**
 * The module that provides all available services to access Gitlab.
 * If the Gitlab connection is static, use
 * <pre>
 * @NgModule({
 *   imports: [
 *     GitlabClientModule.forRoot({
 *       host: 'https://mygitlabhost/',
 *       token: 'mygitlabtoken'
 *     })
 *   ]
 * })
 * export class MyModule {
 * }
 * </pre>
 *
 * to import the module. If the Gitlab connection is resolved dynamically, e.g. by another service,
 * import the module directly and provide a <code>GITLAB_CONFIG_PROVIDER</code>:
 * <pre>
 *   @Injectable({providedIn: 'root'})
 *   export class MyGitlabConfigService {
 *
 *     readConfiguration(): GitlabConfig {
 *       // ...
 *     }
 *
 *   }
 *
 *   @NgModule({
 *     imports: [
 *       GitlabClientModule
 *     ],
 *     providers: [
 *       {
 *         provide: GITLAB_CONFIG_PROVIDER,
 *         useFactory: (service: MyGitlabConfigService) => service.readConfiguration,
 *         deps: [MyGitlabConfigService],
 *       }
 *    ]
 *  })
 *  export class MyModule {
 *  }
 * </pre>
 */
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

  static forRoot(config: GitlabConfig): ModuleWithProviders<GitlabClientModule> {
    return {
      ngModule: GitlabClientModule,
      providers: [
        {
          provide: GITLAB_CONFIG_PROVIDER,
          useValue: () => config
        }
      ]
    }
  }

}

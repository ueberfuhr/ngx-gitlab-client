import {Injectable} from '@angular/core';
import {GitlabIssuesService, IssueRequestOptions} from './gitlab-issues.service';
import {GitlabLabelsService, withCount} from './gitlab-labels.service';
import {combineLatest, concat, defer, forkJoin, map, mergeMap, Observable, of, OperatorFunction, take, tap, toArray} from 'rxjs';
import {GitlabLabel, isLabelUsed} from './models/gitlab-label.model';
import {GitlabIssue} from './models/gitlab-issue.model';
import {GitlabProjectsService} from '../projects/gitlab-projects.service';
import {GitlabProject} from '../projects/project.model';
import {ExchangeIssue, ExchangeLabel, IssueExchangeModel} from './models/exchange.model';
import {Progress, ProgressDialogHandle, ProgressService, toProgress} from './progress/progress.service';
import {createProgressHandler, finishProgress, finishProgressOnError, ProgressHandler, ProgressHandlerValues} from './progress/progress.utilities';

/**
 * Options for the import.
 */
export interface IssueImportOptions {
  /**
   * Delete existing open issues before import.
   */
  deleteOpenIssues: boolean,
  /**
   * Delete existing closed issues before import.
   */
  deleteClosedIssues: boolean,
  /**
   * Delete unused labels before import.
   */
  deleteUnusedLabels: boolean,
}

/**
 * The result of the import.
 */
export interface IssueImportResult {
  /**
   * An array of imported labels. If a label with the given name already existed, it was not imported.
   */
  labels: GitlabLabel[],
  /**
   * An array of imported issues.
   */
  issues: GitlabIssue[]
}

@Injectable({
  providedIn: null
})
export class IssueImportService {

  constructor(private readonly issuesService: GitlabIssuesService,
              private readonly projectsService: GitlabProjectsService,
              private readonly labelsService: GitlabLabelsService,
              private readonly progressService: ProgressService) {
  }

  import(project: GitlabProject, data: IssueExchangeModel, options: IssueImportOptions, obtainOrder = true): Observable<IssueImportResult> {
    return this.doClean(project, options)
      .pipe(
        take(1), // just to be sure
        mergeMap(() => this.doImport(project, data, obtainOrder))
      );
  }

  private deleteIssues(project: GitlabProject, options: IssueImportOptions, progressOptions: {
    handle: ProgressDialogHandle,
    minProgress: Progress,
    maxProgress: Progress
  }): Observable<ProgressDialogHandle> {
    if (options.deleteClosedIssues || options.deleteOpenIssues) {
      let irOptions: IssueRequestOptions;
      if (!(options.deleteClosedIssues && options.deleteOpenIssues)) {
        irOptions = {
          state: options.deleteOpenIssues ? 'opened' : 'closed'
        }
      }
      return of(progressOptions.handle)
        .pipe(
          // 1* ProgressDialogHandle
          tap(h => h.submit({
            progress: progressOptions.minProgress,
            description: 'Fetching issues from project'
          })),
          // 1* ProgressDialogHandle => read issues
          mergeMap(() => this.issuesService.getIssues(project.id, irOptions)),
          // x* DataSet<GitlabIssue> => fetch them into a single array
          toArray(),
          // 1* DataSet<GitlabIssue>[] => delete them step by step
          mergeMap(issues => {
            let total = issues.length;
            if (total > 0) {
              let handler = createProgressHandler(
                progressOptions.handle,
                ProgressHandlerValues.ofMinMax(total, progressOptions.minProgress, progressOptions.maxProgress),
                (progress, count) => `Deleted ${count} of ${total} issue(s).`
              );
              return forkJoin(
                issues.map(
                  i => this.issuesService.delete(project.id, i.payload.iid!)
                    .pipe(
                      tap(() => handler.done())
                    )
                )
              )
            } else {
              return of([]);
            }
          }),
          // 1* void[]
          map(() => progressOptions.handle),
          finishProgressOnError(progressOptions.handle)
        )
    } else {
      return of(progressOptions.handle)
    }
  }

  private deleteUnusedLabels(project: GitlabProject, options: IssueImportOptions, progressOptions: {
    handle: ProgressDialogHandle,
    minProgress: Progress,
    maxProgress: Progress
  }): Observable<ProgressDialogHandle> {
    if (options.deleteUnusedLabels) {
      return of(progressOptions.handle)
        .pipe(
          // 1* ProgressDialogHandle
          tap(h => h.submit({
            progress: progressOptions.minProgress,
            description: 'Fetching labels from project'
          })),
          // 1* ProgressDialogHandle => read issues
          mergeMap(() => this.labelsService.getLabelsForProject(project.id, withCount)),
          // x* DataSet<GitlabLabelWithCounts> => fetch them into a single array
          toArray(),
          // 1* DataSet<GitlabIssue>[] => filter unused and only project leven
          map(labels => labels.filter(label => label.payload.is_project_label && !isLabelUsed(label.payload))),
          // 1* DataSet<GitlabIssue>[] => delete them step by step
          mergeMap(labels => {
            let total = labels.length;
            if (total > 0) {
              let handler = createProgressHandler(
                progressOptions.handle,
                ProgressHandlerValues.ofMinMax(total, progressOptions.minProgress, progressOptions.maxProgress),
                (progress, count) => `Deleted ${count} of ${total} label(s).`
              );
              return forkJoin(
                labels.map(
                  i => this.labelsService.delete(project, i.payload)
                    .pipe(
                      tap(() => handler.done())
                    )
                )
              )
            } else {
              return of([]);
            }
          }),
          // 1* void[]
          map(() => progressOptions.handle),
          finishProgressOnError(progressOptions.handle)
        )

    } else {
      return of(progressOptions.handle);
    }
  }

  private doClean(project: GitlabProject, options: IssueImportOptions): Observable<void> {
    return defer(
      () => of(this.progressService.start({title: 'Cleaning project...', mode: 'determinate'}))
    )
      .pipe(
        // ProgressDialogHandle
        mergeMap(handle => this.deleteIssues(project, options, {
          handle, minProgress: 0, maxProgress: 80
        })),
        // ProgressDialogHandle
        mergeMap(handle => this.deleteUnusedLabels(project, options, {
          handle, minProgress: 80, maxProgress: 100
        })),
        // ProgressDialogHandle
        mergeMap(handle => of(void 0).pipe(
          finishProgress(handle),
        ))
        // void
      );
  }


  private doImport(project: GitlabProject, data: IssueExchangeModel, obtainOrder: boolean): Observable<IssueImportResult> {
    const total = data.labels.length + data.issues.length;
    if (total === 0) {
      return of({issues: [], labels: [],});
    } else {
      const progressAfterLabels = toProgress(data.labels.length, total);
      return defer(
        () => of(this.progressService.start({title: 'Importing...', mode: 'determinate'}))
      )
        .pipe(
          mergeMap(handle =>
            new LabelsImporter(
              data.labels,
              project,
              this.labelsService,
              total => createProgressHandler(
                handle,
                ProgressHandlerValues.ofMinMax(total, 0, progressAfterLabels),
                (_progress, index) => `Imported ${index} of ${total} label(s)`
              )
            ).import()
              .pipe(
                take(1), // just to be sure
                mergeMap(labels =>
                  new IssuesImporter(
                    data.issues,
                    project,
                    this.issuesService,
                    total => createProgressHandler(
                      handle,
                      ProgressHandlerValues.ofMinMax(total, progressAfterLabels, 100),
                      (_progress, index) => `Imported ${index} of ${total} issues(s)`
                    )
                  ).import(obtainOrder)
                    .pipe(
                      take(1), // just to be sure
                      map(issues => ({issues, labels} as IssueImportResult))
                    )
                ),
                finishProgress(handle),
                finishProgressOnError(handle)
              )
          )
        )
        ;
    }
  }

}

/* *************************************
 *   I N T E R N A L   C L A S S E S   *
 * ----------------------------------- *
 * Internal classes that encapsulate   *
 * the import context data and provide *
 * a readable kind of code.            *
 ************************************* */

/**
 * Imports the labels that do not yet exist.
 */
class LabelsImporter {

  /**
   * Constructor.
   * @param labels the array of labels that have to be imported
   * @param project the project where to import into
   * @param labelsService the labels service to access Gitlab
   * @param progressHandlerFactory a function to create a progress handler for the current progress
   */
  constructor(private readonly labels: ExchangeLabel[],
              private readonly project: GitlabProject,
              private readonly labelsService: GitlabLabelsService,
              private readonly progressHandlerFactory: (total: number) => ProgressHandler) {
  }

  private getExistingLabelNames(): Observable<string[]> {
    return this.labelsService.getLabelsForProject(this.project.id)
      .pipe(
        // DataSet<GitlabLabel>
        map(dataSet => dataSet.payload.name),
        // GitlabLabel-Name
        toArray()
      );
  }

  private findNewLabels(): OperatorFunction<string[], ExchangeLabel[]> {
    return map<string[], ExchangeLabel[]>(
      existingLabelNames => this.labels
        .filter(label => existingLabelNames.indexOf(label.name) < 0)
    );
  }

  private createImportOperationForLabel(label: ExchangeLabel, progressHandler: ProgressHandler) {
    return this.labelsService.create(this.project, {
      name: label.name,
      description: label.description,
      color: label.color,
      is_project_label: label.is_project_label,
    })
      .pipe(
        // display progress
        tap(() => progressHandler.done())
      )
  }

  /**
   * Execute the import.
   * @return the imported labels (that did not yet exist before the import)
   */
  import(): Observable<GitlabLabel[]> {
    return this.getExistingLabelNames()
      .pipe(
        // import labels that do not yet exist
        this.findNewLabels(),
        // ExchangeLabel[]
        mergeMap(newLabels => {
          if (newLabels.length > 0) {
            const progressHandler = this.progressHandlerFactory(newLabels.length);
            const importOperations = newLabels.map(label => this.createImportOperationForLabel(label, progressHandler));
            return combineLatest(importOperations);
          } else {
            return of([]);
          }
        })
      );
  }

}

/**
 * Imports the issues.
 */
class IssuesImporter {

  /**
   * Constructor.
   * @param issues the array of issues that have to be imported
   * @param project the project where to import into
   * @param issuesService the issues service to access Gitlab
   * @param createProgressHandler a function to create a progress handler for the current progress
   */
  constructor(private readonly issues: ExchangeIssue[],
              private readonly project: GitlabProject,
              private readonly issuesService: GitlabIssuesService,
              private readonly createProgressHandler: (total: number) => ProgressHandler) {
  }

  private createImportOperationForIssue(issue: ExchangeIssue, progressHandler: ProgressHandler) {
    return this.issuesService.create(this.project.id, {
      title: issue.title,
      issue_type: issue.issue_type,
      labels: issue.labels,
      description: issue.description,
      state: issue.state
    })
      .pipe(
        // display progress
        tap(() => progressHandler.done())
      )
  }

  import(obtainOrder = true): Observable<GitlabIssue[]> {
    if (this.issues.length < 1) {
      return of([])
    } else {
      return of(this.issues)
        .pipe(
          // ExchangeIssue[]
          mergeMap(newIssues => {
            const progressHandler = this.createProgressHandler(newIssues.length);
            const importOperations = newIssues.map(issue => this.createImportOperationForIssue(issue, progressHandler));
            return obtainOrder ?
              // we need them in sequence to get the right order!
              concat(...importOperations).pipe(toArray()) :
              combineLatest(importOperations);
          })
        );
    }
  }

}

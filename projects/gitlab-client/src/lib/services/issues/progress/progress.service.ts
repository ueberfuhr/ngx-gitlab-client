import {Injectable, Optional} from '@angular/core';
import {BehaviorSubject, defer, Observable, of, tap} from 'rxjs';
import {GitlabClientModule} from '../../../gitlab-client.module';

export abstract class ProgressDialog {

  abstract open(param: { data: { mode: "determinate" | "indeterminate" | undefined; title: string | undefined; status: Observable<ProgressStatus> }; disableClose: boolean }): void;
}

@Injectable({
  providedIn: GitlabClientModule
})
export class ProgressService {

  constructor(@Optional() private readonly dialog: ProgressDialog) {
  }

  start(options?: {
    title?: string,
    mode?: 'determinate' | 'indeterminate'
  }): ProgressDialogHandle {
    // defer opening the status dialog in case of quick operations
    const deferMS = 500;
    let lastSubmittedStatus: ProgressStatus;
    const subject = new BehaviorSubject<ProgressStatus>({
      progress: 0
    });
    const status$ = subject.asObservable();
    const subscription = status$.subscribe(status => {
      lastSubmittedStatus = status;
    })
    setTimeout(() => {
      if (!lastSubmittedStatus || lastSubmittedStatus.progress < 100) {
        this.dialog?.open({
          data: {
            status: status$,
            title: options?.title,
            mode: options?.mode
          },
          disableClose: true
        });
      }
      subscription.unsubscribe();
    }, deferMS);
    return {
      submit: status => {
        subject.next(status);
      },
      finish: () => subject.next(QUIT_STATUS)
    }
  }

  startAsObservable(options?: {
    title?: string,
    mode?: 'determinate' | 'indeterminate'
    initialProgress?: ProgressStatus
  }) {
    return defer(() => of(this.start({
        title: options?.title,
        mode: options?.mode
      })).pipe(
        tap(handle => {
          if (options?.initialProgress) {
            handle.submit(options.initialProgress)
          }
        }))
    );
  }

}

/**
 * A single progress status.
 */
export interface ProgressStatus {
  /**
   * A value between 0 and 100. When reaching 100, the dialog is closed.
   * @see QUIT_STATUS
   */
  progress: Progress,
  description?: string
}

/**
 * A progress can be a value between 0 and 100.
 */
export type Progress = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
  | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19
  | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29
  | 30 | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39
  | 40 | 41 | 42 | 43 | 44 | 45 | 46 | 47 | 48 | 49
  | 50 | 51 | 52 | 53 | 54 | 55 | 56 | 57 | 58 | 59
  | 60 | 61 | 62 | 63 | 64 | 65 | 66 | 67 | 68 | 69
  | 70 | 71 | 72 | 73 | 74 | 75 | 76 | 77 | 78 | 79
  | 80 | 81 | 82 | 83 | 84 | 85 | 86 | 87 | 88 | 89
  | 90 | 91 | 92 | 93 | 94 | 95 | 96 | 97 | 98 | 99
  | 100;

export function toProgress(dividend : number, divisor = 100): Progress {
  return Math.max(0, Math.min(100, Math.round(100 * dividend / divisor))) as Progress;
}

/**
 * You can send this status to indicate that the progress is finished.
 */
export const QUIT_STATUS: ProgressStatus = {progress: 100};

/**
 * A handle for the dialog.
 */
export interface ProgressDialogHandle {
  /**
   * Submit a new status to the dialog.
   * @param status the status
   */
  submit(status: ProgressStatus): void;

  /**
   * Submit the final status.
   */
  finish(): void;
}

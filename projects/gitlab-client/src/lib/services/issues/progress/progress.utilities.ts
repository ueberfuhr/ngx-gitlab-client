import {catchError, finalize, MonoTypeOperatorFunction, ObservableInput, ObservedValueOf, OperatorFunction, throwError} from 'rxjs';
import {Progress, ProgressDialogHandle, toProgress} from './progress.service';

/**
 * Use this RxJS operator to finish the progress when the observable completes.
 * @param handle the progress handle
 */
export function finishProgress<T>(handle: ProgressDialogHandle): MonoTypeOperatorFunction<T> {
  return finalize(() => handle.finish());
}

/**
 * Use this RxJS operator to finish the progress if any error occurs.
 * @param handle the progress handle
 */
export function finishProgressOnError<T, O extends ObservableInput<any>>(handle: ProgressDialogHandle): OperatorFunction<T, T | ObservedValueOf<O>> {
  return catchError(err => {
    handle.finish();
    return throwError(() => err);
  })
}

/**
 * Used to provide a calculation for displaying the progress when finishing a single step.
 * This is necessary because the calling function knows the total count while the called function knows the progress.
 */
export interface ProgressHandler {
  // invoke this when a task is done
  done(): void;
}

/**
 * A callback to create a label.
 */
export type LabelFactory = (progress: Progress, count: number) => string;

export function createProgressHandler(
  handle: ProgressDialogHandle,
  values: ProgressHandlerValues,
  labelFactory: LabelFactory) {

  let count = 0;

  return {
    done(): void {
      if(values.steps > 0) {
        count = Math.min(count + 1, values.steps);
        const progress: Progress = toProgress(values.offset + count * values.factor)
        handle.submit({
          progress,
          description: labelFactory(progress, count)
        });
      }
    }
  }

}

export class ProgressHandlerValues {

  public constructor(public readonly offset: Progress,
                     public readonly steps: number,
                     public readonly factor: number,
  ) {
  }

  public static ofMinMax(steps: number, minValue: Progress, maxValue: Progress): ProgressHandlerValues {
    return new ProgressHandlerValues(minValue, steps, (maxValue - minValue) / steps);
  }

}


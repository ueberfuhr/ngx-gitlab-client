import {HttpClient, HttpErrorResponse, HttpResponse} from '@angular/common/http';
import {catchError, concat, defer, EMPTY, from, mergeMap, Observable, Subject, tap, throwError} from 'rxjs';
import {GitlabConfig} from '../../config/gitlab-config.model';
import {Inject, Injectable, Optional} from '@angular/core';
import {GITLAB_CONFIG_PROVIDER} from '../../gitlab-client.module';

// header names
const TOTAL_HEADER = 'X-Total';
const TOTAL_PAGES_HEADER = 'X-Total-Pages'

/**
 * This error is thrown then there isn't any Gitlab connection configuration provider.
 */
export class NoGitlabConnectionProviderError extends Error {
  constructor() {
    super(
      'There isn\'t any Gitlab connection configuration provider available for dependency injection. ' +
      'Please configure a GITLAB_CONFIG_PROVIDER or import the GitlabClientModule by ' +
      'using GitlabClientModule.forRoot(myGitlabConfig).'
    );
  }
}

@Injectable({
  providedIn: null
})
export class GitlabService {

  private readonly errorsSubject = new Subject<GitlabAccessError>();
  public readonly errors = this.errorsSubject.asObservable();
  private readonly accessesSubject = new Subject<GitlabAccess>();
  public readonly accesses = this.accessesSubject.asObservable();

  constructor(
    private readonly http: HttpClient,
    @Inject(GITLAB_CONFIG_PROVIDER) @Optional() private readonly config: () => GitlabConfig
  ) {
    if (!this.config) {
      throw new NoGitlabConnectionProviderError();
    }
  }

  /**
   * Notifies the errors and accesses observers about the result.
   * @param result the result
   */
  private notifyObservers<T>(result: Observable<T>): Observable<T> {
    return result
      .pipe(
        catchError((err: HttpErrorResponse) => {
          this.errorsSubject.next({
            status: err.status
          });
          return throwError(() => err);
        }),
        tap(() => this.accessesSubject.next({}))
      );
  }

  /**
   * Makes a single call to the REST API.
   * The result must not be paginated, otherwise, we'll only get the first page.
   * @param resource the URL of the resource
   * @param method the request method, defaults to 'get'
   * @param options the options of the call
   */
  call<T>(resource: string, method: 'get' | 'post' | 'put' | 'delete' = 'get', options?: CallOptions): Observable<T> {
    let config = this.config();
    return this.notifyObservers(
      this.http.request<T>(method, `${config.host}/api/v4/${resource}`, {
        body: options?.body,
        params: options?.params,
        headers: Object.assign({'PRIVATE-TOKEN': config.token}, options?.headers)
      })
    );
  }

  /**
   * Makes multiple calls to the REST API to fetch multiple resources.
   * Gitlab has a pagination that this method will handle.
   * If you do not want to read all data, use the <code>take*</code> operators for pipes.
   * @return an observable that submits each data set separately
   */
  callPaginated<T>(resource: string, options?: CallOptions, pageSize = 20): Observable<DataSet<T>> {
    return this.callPaginatedSincePage(resource, 1, pageSize, options);
  }

  // uses for recursive call
  private callPaginatedSincePage<T>(resource: string, page: number, pageSize: number, options?: CallOptions): Observable<DataSet<T>> {
    const indexOffset = (page - 1) * pageSize;
    // deferring is important to only lazy fetch data from the server if the pipe limits the count of data
    return defer(() => {
      let config = this.config();
      return this.notifyObservers(
        this.http.request<T[]>('get', `${config.host}/api/v4/${resource}`,
          {
            body: options?.body,
            params: Object.assign({
              // Gitlab pagination
              page,
              per_page: pageSize
            }, options?.params),
            headers: Object.assign({'PRIVATE-TOKEN': config.token}, options?.headers),
            observe: 'response',
          })
      )
        .pipe(
          mergeMap((response: HttpResponse<T[]>) => {
            const body = response.body ?? [];
            // read out pagination headers
            const totalHeader = response.headers.get(TOTAL_HEADER);
            const total = totalHeader ? Number(totalHeader) : body.length;
            const totalPagesHeader = response.headers.get(TOTAL_PAGES_HEADER);
            const totalPages = totalPagesHeader ? Number(totalPagesHeader) : page;
            // create Observables
            const itemsOfThisRequest$ = from(
              body.map((payload, index) => ({payload, index: index + indexOffset, total} as DataSet<T>))
            );
            const itemsOfNextPage$ = page === totalPages ?
              EMPTY :
              this.callPaginatedSincePage<T>(resource, page + 1, pageSize, options);
            return concat(itemsOfThisRequest$, itemsOfNextPage$);
          }),
        )
    });
  }

}

/**
 * Options for a request to Gitlab.
 */
export interface CallOptions {
  /**
   * A body to include
   */
  body?: any,
  /**
   * Additional headers.
   */
  headers?: {
    [header: string]: string | string[];
  },
  /**
   * Additional params
   */
  params?: {
    [param: string]: string | number | boolean | ReadonlyArray<string | number | boolean>;
  };
}

/**
 * A single data set as part of a paginated or streamed call.
 */
export interface DataSet<T> {
  /**
   * The payload.
   */
  payload: T;
  /**
   * The 0-based index of the data set.
   */
  index: number;
  /**
   * The total count of available data sets.
   */
  total: number;

}

/**
 * A single successful Gitlab access result.
 */
export interface GitlabAccess {

}

/**
 * A single faulty Gitlab access result.
 */
export interface GitlabAccessError {
  status: number;
}


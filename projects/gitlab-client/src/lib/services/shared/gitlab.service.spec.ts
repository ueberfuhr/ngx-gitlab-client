import {createHttpFactory, HttpMethod, SpectatorHttp} from '@ngneat/spectator/jest';
import {DataSet, GitlabService} from './gitlab.service';
import {HttpTestingController} from '@angular/common/http/testing';
import {map, merge, take, toArray} from 'rxjs';
import {GitlabConfigProvider} from '../../config/gitlab-config.model';

describe('GitlabService', () => {

  const createHttp = createHttpFactory({
    service: GitlabService,
    providers: [
      {
        provide: GitlabConfigProvider,
        useValue: GitlabConfigProvider.fromStatic({
          host: 'host',
          token: 'token'
        })
      }
    ]
  });

  const errorResponseOptions = () => ({
    status: 500,
    statusText: 'internal server error'
  });

  let spectator: SpectatorHttp<GitlabService>;
  // Mock
  let http: HttpTestingController;
  // Class under Test
  let gitlab: GitlabService;


  beforeEach(() => {
    spectator = createHttp();
    gitlab = spectator.service;
    http = spectator.controller;
  });

  describe('making a simple request', () => {

    it('should not fetch until subscription', () => {
      gitlab.call('test');
      http.verify();
    });

    it('should use GET as default method', () => {
      gitlab.call('test').subscribe();
      http.expectOne(req => req.method === HttpMethod.GET);
      http.verify();
    });

    it('should set options correctly', done => {
      const responseBody = {test: 'test'};
      gitlab.call('test', 'delete', {
        body: 'body',
        params: {
          param1: 'pValue1'
        },
        headers: {
          header1: 'hValue1'
        }
      }).subscribe(response => {
        expect(response).toMatchObject(responseBody);
        done();
      });
      const req = http.expectOne('host/api/v4/test?param1=pValue1', HttpMethod.DELETE)
      const request = req.request;
      expect(request.body).toBe('body');
      expect(request.headers.get('header1')).toBe('hValue1');
      expect(request.headers.get('PRIVATE-TOKEN')).toBe('token');
      req.flush(responseBody);
    });

    it('should notify observers', done => {
      gitlab.accesses.subscribe(() => done());
      gitlab.call('test').subscribe();
      http.expectOne(() => true)
        .flush(null);
      http.verify();
    });

    it('should notify observers on error', done => {
      gitlab.errors.subscribe(err => {
        expect(err.status).toBe(500);
        done();
      });
      gitlab.call('test').subscribe();
      http.expectOne(() => true)
        .flush(null, errorResponseOptions());
      http.verify();
    });

  });

  describe('making paginated requests', () => {

    const fakeBody = (countOfElements: number) => [...Array(countOfElements).keys()];

    const paginationResponseOptions = (total: number, totalPages: number) => ({
      headers: {
        'X-Total': `${total}`,
        'X-Total-Pages': `${totalPages}`
      }
    });


    it('should not fetch until subscription', () => {
      gitlab.callPaginated('test');
      http.verify();
    });

    it('should not fetch second page if not wanted', done => {
      gitlab.callPaginated('test', undefined, 20)
        .pipe(take(20), toArray())
        .subscribe(datasets => {
          expect(datasets).toHaveLength(20);
          datasets.forEach(ds => expect(ds.total).toBe(50));
          done();
        });
      http.expectOne('host/api/v4/test?page=1&per_page=20', HttpMethod.GET)
        .flush(fakeBody(20), paginationResponseOptions(50, 3));
      http.verify();
    });

    it('should not fetch third page if not wanted', done => {
      gitlab.callPaginated('test', undefined, 20)
        .pipe(take(25), toArray())
        .subscribe(datasets => {
          expect(datasets).toHaveLength(25);
          datasets.forEach(ds => expect(ds.total).toBe(50));
          done();
        });
      http.expectOne('host/api/v4/test?page=1&per_page=20', HttpMethod.GET)
        .flush(fakeBody(20), paginationResponseOptions(50, 3));
      http.expectOne('host/api/v4/test?page=2&per_page=20', HttpMethod.GET)
        .flush(fakeBody(20), paginationResponseOptions(50, 3));
      http.verify();
    });

    it('should fetch all pages', done => {
      gitlab.callPaginated('test', undefined, 20)
        .pipe(take(50), toArray())
        .subscribe(datasets => {
          expect(datasets).toHaveLength(50);
          datasets.forEach(ds => expect(ds.total).toBe(50));
          done();
        });
      http.expectOne('host/api/v4/test?page=1&per_page=20', HttpMethod.GET)
        .flush(fakeBody(20), paginationResponseOptions(50, 3));
      http.expectOne('host/api/v4/test?page=2&per_page=20', HttpMethod.GET)
        .flush(fakeBody(20), paginationResponseOptions(50, 3));
      http.expectOne('host/api/v4/test?page=3&per_page=20', HttpMethod.GET)
        .flush(fakeBody(10), paginationResponseOptions(50, 3));
      http.verify();
    });

    it('should notify observers', done => {
      gitlab.accesses.subscribe(() => done());
      gitlab.callPaginated('test').subscribe();
      http.expectOne(() => true)
        .flush(fakeBody(2), paginationResponseOptions(2, 1));
      http.verify();
    });

    it('should notify observers on error', done => {
      gitlab.errors.subscribe(err => {
        expect(err.status).toBe(500);
        done();
      });
      gitlab.callPaginated('test').subscribe();
      http.expectOne(() => true)
        .flush(null, errorResponseOptions());
      http.verify();
    });

    it('should notify all observers on multiple pages', done => {
      merge(
        gitlab.accesses.pipe(map(() => true)), // simplify
        gitlab.errors.pipe(map(() => false)) // simplify
      ).pipe(take(2), toArray()).subscribe(result => {
        expect(result).toMatchObject([true, false])
        done();
      })
      gitlab.callPaginated('test')
        .pipe(take(50), toArray())
        .subscribe();
      http.expectOne('host/api/v4/test?page=1&per_page=20', HttpMethod.GET)
        .flush(fakeBody(20), paginationResponseOptions(50, 3));
      http.expectOne('host/api/v4/test?page=2&per_page=20', HttpMethod.GET)
        .flush(null, errorResponseOptions());
      http.verify();
    });

    it('should set options correctly', done => {
      const responseBody = {test: 'test'};
      gitlab.callPaginated('test', {
        body: 'body',
        params: {
          param1: 'pValue1'
        },
        headers: {
          header1: 'hValue1'
        }
      }, 20).subscribe(response => {
        expect(response).toMatchObject({payload: responseBody, total: 1} as DataSet<unknown>);
        done();
      });
      const req = http.expectOne('host/api/v4/test?page=1&per_page=20&param1=pValue1', HttpMethod.DELETE)
      const request = req.request;
      expect(request.body).toBe('body');
      expect(request.headers.get('header1')).toBe('hValue1');
      expect(request.headers.get('PRIVATE-TOKEN')).toBe('token');
      req.flush([responseBody], paginationResponseOptions(1, 1));
    });

  });

});

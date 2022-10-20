import {createServiceFactory, SpectatorService, SpyObject} from '@ngneat/spectator/jest';
import {GitlabProjectsService} from './gitlab-projects.service';
import {DataSet, GitlabService} from '../shared/gitlab.service';
import {of, take, throwError, toArray} from 'rxjs';
import {GitlabApiProject, GitlabApiProjectNamespace} from './project.api';
import {HttpErrorResponse} from '@angular/common/http';

describe('GitlabProjectsService', () => {

  const createService = createServiceFactory({
    service: GitlabProjectsService,
    mocks: [GitlabService]
  });

  let spectator: SpectatorService<GitlabProjectsService>;
  // Mock
  let gitlab: SpyObject<GitlabService>;
  // Class under Test
  let service: GitlabProjectsService;

  const namespace: GitlabApiProjectNamespace = {
    id: 1,
    full_path: 'path'
  };

  beforeEach(() => {
    spectator = createService();
    gitlab = spectator.inject(GitlabService);
    service = spectator.service;
  });

  describe('searching for project by id', () => {

    it('should reduce to GitlabProject', done => {
      gitlab.call.mockReturnValue(of(({
        id: 10,
        name: 'test-project',
        web_url: 'test-url',
        namespace
      } as GitlabApiProject)));
      service.getProjectById(10).subscribe(project => {
        expect(project.id).toBe(10);
        expect(project.name).toBe('test-project');
        expect(project.webUrl).toBe('test-url');
        expect((project as any).web_url).toBeUndefined();
        done();
      })
    })

    it('should not catch any error', done => {
      const errorResponse = new HttpErrorResponse({});
      gitlab.call.mockReturnValue(throwError(() => errorResponse));
      service.getProjectById(10).subscribe({
        error: err => {
          expect(err).toBe(errorResponse);
          done();
        }
      });
    }, 1000);

  })

  describe('searching for projects', () => {

    it('should reduce to GitlabProject', done => {
      gitlab.callPaginated.mockReturnValue(of(
        ({
          total: 2,
          index: 0,
          payload: {
            id: 10,
            name: 'test-project',
            web_url: 'test-url',
            namespace
          }
        } as DataSet<GitlabApiProject>),
        ({
          total: 2,
          index: 1,
          payload: {
            id: 11,
            name: 'test-project2',
            web_url: 'test-url2',
            namespace
          }
        } as DataSet<GitlabApiProject>)
      ));
      service.getProjects().pipe(take(2), toArray()).subscribe(projects => {
        expect(projects).toHaveLength(2);
        expect(projects[0].payload.id).toBe(10);
        expect(projects[0].payload.name).toBe('test-project');
        expect(projects[0].payload.webUrl).toBe('test-url');
        expect(projects[1].payload.id).toBe(11);
        expect(projects[1].payload.name).toBe('test-project2');
        expect(projects[1].payload.webUrl).toBe('test-url2');
        done();
      })
    })

    it('should not catch any error', done => {
      const errorResponse = new HttpErrorResponse({});
      gitlab.callPaginated.mockReturnValue(throwError(() => errorResponse));
      service.getProjects().subscribe({
        error: err => {
          expect(err).toBe(errorResponse);
          done();
        }
      });
    }, 1000);

  })

});

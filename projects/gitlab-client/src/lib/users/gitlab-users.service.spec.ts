import {GitlabUsersService} from './gitlab-users.service';
import {createServiceFactory, SpectatorService, SpyObject} from '@ngneat/spectator/jest';
import {of, throwError} from 'rxjs';
import {HttpErrorResponse} from '@angular/common/http';
import {GitlabService} from '../shared/gitlab.service';

describe('GitlabUsersService', () => {

  const createService = createServiceFactory({
    service: GitlabUsersService,
    mocks: [GitlabService]
  });

  let spectator: SpectatorService<GitlabUsersService>;
  // Mock
  let gitlab: SpyObject<GitlabService>;
  // Class under Test
  let service: GitlabUsersService;

  beforeEach(() => {
    spectator = createService();
    gitlab = spectator.inject(GitlabService);
    service = spectator.service;
  });

  it('should reduce to GitlabUser', done => {
    gitlab.call.mockReturnValue(of({
      id: 10,
      username: 'john.doe',
      name: 'John Doe',
      another_property: 22
    }));
    service.getCurrentUser().subscribe(user => {
      expect(user.id).toBe(10);
      expect(user.username).toBe('john.doe');
      expect(user.name).toBe('John Doe');
      expect((user as any).another_property).toBeUndefined();
      done();
    });
  }, 1000);

  it('should not catch any error', done => {
    const errorResponse = new HttpErrorResponse({});
    gitlab.call.mockReturnValue(throwError(() => errorResponse));
    service.getCurrentUser().subscribe({
      error: err => {
        expect(err).toBe(errorResponse);
        done();
      }
    });
  }, 1000);

});

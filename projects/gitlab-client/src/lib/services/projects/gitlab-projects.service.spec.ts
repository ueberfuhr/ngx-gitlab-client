import {createServiceFactory, SpectatorService, SpyObject} from '@ngneat/spectator/jest';
import {GitlabProjectsService} from './gitlab-projects.service';
import {GitlabService} from '../shared/gitlab.service';

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

  beforeEach(() => {
    spectator = createService();
    gitlab = spectator.inject(GitlabService);
    service = spectator.service;
  });

  it('should work', () => {
  });

});

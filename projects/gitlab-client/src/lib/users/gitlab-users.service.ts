import {Injectable} from '@angular/core';
import {map, Observable} from 'rxjs';
import {GitlabService} from '../shared/gitlab.service';
import {GitlabUser} from './gitlab-user.model';

@Injectable({
  providedIn: null
})
export class GitlabUsersService {

  constructor(private readonly gitlab: GitlabService) {
  }

  /**
   * Remove all fields from Gitlab resource that are not needed within this application.
   * @param user the object that was received from Gitlab
   * @private the reduced object
   */
  private static reduce(user: GitlabUser): GitlabUser {
    return {
      id: user.id,
      name: user.name,
      username: user.username
    }
  }

  getCurrentUser(): Observable<GitlabUser> {
    return this.gitlab.call<GitlabUser>('user')
      .pipe(map(GitlabUsersService.reduce));
  }

}

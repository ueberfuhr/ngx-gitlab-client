import {Injectable} from '@angular/core';
import {GitlabIssue} from './models/gitlab-issue.model';
import {ExchangeIssue, ExchangeLabel} from './models/exchange.model';
import {GitlabLabel} from './models/gitlab-label.model';

@Injectable({
  providedIn: null
})
export class IssueExportModelMapperService {

  mapIssue(issue: GitlabIssue): ExchangeIssue {
    return {
      title: issue.title,
      description: issue.description,
      state: issue.state,
      labels: issue.labels,
      issue_type: issue.issue_type
    }
  }

  mapLabel(label: GitlabLabel): ExchangeLabel {
    return {
      name: label.name,
      description: label.description,
      color: label.color,
      is_project_label: label.is_project_label
    }
  }

}

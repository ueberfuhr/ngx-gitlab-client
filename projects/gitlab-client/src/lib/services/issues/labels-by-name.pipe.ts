import {Pipe, PipeTransform} from '@angular/core';
import {GitlabLabel} from './models/gitlab-label.model';
import {ExchangeLabel} from './models/exchange.model';

@Pipe({
  name: 'labelsByName'
})
export class LabelsByNamePipe implements PipeTransform {

  transform(names: string[], labels?: GitlabLabel[] | ExchangeLabel[]): GitlabLabel[] {
    return labels ? labels.filter(label => names.indexOf(label.name) >= 0) : [];
  }

}

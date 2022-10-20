import {DataSet} from './gitlab.service';

export function mapDataSet<T, V>(source: DataSet<T>, callbackFn: (t: T) => V): DataSet<V> {
  return {
    index: source.index,
    total: source.total,
    payload: callbackFn(source.payload)
  }
}

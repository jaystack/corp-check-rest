import { Package } from '../types';

export type Reducer<R> = {
  (acc: R, pkg: Package, path: string[]): R;
};

const reduce = <R>(reducer: Reducer<R>, accResult: R, tree: Package, path: string[], depth): R => {
  if (path.length > depth + 1) return accResult;
  return (tree.dependencies || [])
    .reduce<R>((acc, pkg) => reduce(reducer, acc, pkg, [ ...path, pkg.name ], depth), reducer(accResult, tree, path));
};

export default <R>(tree: Package, reducer: Reducer<R>, initialResult: R, depth = Infinity): R => {
  return reduce(reducer, initialResult, tree, [ tree.name ], depth);
};

import { Package } from '../types';

export type Reducer<R> = {
  (acc: R, pkg: Package, path: string[]): R;
};

const reduce = <R>(reducer: Reducer<R>, accResult: R, tree: Package, path: string[], depth): R => {
  const rootValue = reducer(accResult, tree, path);
  return path.length > depth + 1
    ? rootValue
    : (tree.dependencies || [])
        .reduce<R>((acc, pkg) => reduce(reducer, acc, pkg, [ ...path, pkg.name ], depth), rootValue);
};

export default <R>(tree: Package, reducer: Reducer<R>, initialResult: R, depth = Infinity): R => {
  return reduce(reducer, initialResult, tree, [ tree.name ], depth);
};

import { Package } from '../types';

export type Reducer<R, E> = {
  (acc: R, pkg: Package, path: string[], depth: number, extraArgument?: E): R;
};

const reduce = <R, E>(
  reducer: Reducer<R, E>,
  accResult: R,
  tree: Package,
  path: string[],
  depth,
  extraArgument?: E
): R => {
  const dependencies = tree.dependencies || [];
  return dependencies.reduce<R>(
    (acc, pkg) => reduce(reducer, acc, pkg, [ ...path, pkg.name ], depth + 1, extraArgument),
    reducer(accResult, tree, path, depth, extraArgument)
  );
};

export default <R, E>(tree: Package, reducer: Reducer<R, E>, initialResult: R, extraArgument?: E): R => {
  return reduce(reducer, initialResult, tree, [ tree.name ], 0, extraArgument);
};

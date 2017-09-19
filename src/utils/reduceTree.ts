import { Package } from '../types';

export type Reducer<R, E> = {
  (pkg: Package, path: string[], acc: R, extraArgument?: E): R;
};

const reduce = <R, E>(tree: Package, path: string[], reducer: Reducer<R, E>, accResult: R, extraArgument?: E): R => {
  const dependencies = tree.dependencies || [];
  return dependencies.reduce<R>(
    (acc, pkg) => reduce(pkg, [ ...path, pkg.name ], reducer, acc, extraArgument),
    reducer(tree, path, accResult, extraArgument)
  );
};

export default <R, E>(tree: Package, reducer: Reducer<R, E>, initialResult: R, extraArgument?: E): R => {
  return reduce(tree, [ tree.name ], reducer, initialResult, extraArgument);
};

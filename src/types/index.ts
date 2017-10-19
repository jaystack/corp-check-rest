import { Node, PackageMeta, Evaluation } from 'corp-check-core';

export * from './rules';

export * from './evaluationInfo';
export * from './packageInfo';
export * from './moduleMetadata';

export type Evaluator<Rule = any> = (
  data: { node: Node; packageMeta: PackageMeta; rule: Rule; unknownPackages: string[]; depth: number }
) => Evaluation;

import { Service, param, injectable, InjectionScope, inject } from 'functionly';
import {
  Info as Data,
  Node,
  Meta,
  PackageMeta,
  Qualification,
  Evaluation,
  NodeEvaluation,
  FinalEvaluation
} from 'corp-check-core';
import { Evaluator, RuleSet } from '../types';
import license from '../evaluators/license';
import version from '../evaluators/version';
import npmScores from '../evaluators/npmScores';

const A = 1;
const corpCheckPackages = [ 'corp-check-core', 'corp-check-cli' ];

const qualificate = (finalScore: number): Qualification => {
  if (finalScore >= 0.5) return Qualification.RECOMMENDED;
  else if (finalScore > 0 && finalScore < 0.5) return Qualification.ACCEPTED;
  else return Qualification.REJECTED;
};

const weightFunction = (score: number): number => Math.sqrt(A * score);

const getNodeScore = (selfScore: number, dependencyScores: number[]): number => {
  return Math.min(selfScore, ...dependencyScores.map(weightFunction));
};

const evaluate = (
  evaluators: Evaluator[],
  rules: any[],
  meta: Meta,
  node: Node,
  unknownPackages: string[] = [],
  depth: number = 0
): NodeEvaluation => {
  const evaluations = evaluators.map((evaluator, i) =>
    evaluator({
      node,
      packageMeta: meta[node.name] || ({} as PackageMeta),
      rule: rules[i] || {},
      unknownPackages,
      depth
    })
  );
  const dependencyEvaluations = node.dependencies.map(dependency =>
    evaluate(evaluators, rules, meta, dependency, unknownPackages, depth + 1)
  );
  const selfScore = evaluations.reduce((acc, { score }) => acc * score, 1);
  return {
    nodeName: node.name,
    nodeVersion: node.version,
    evaluations,
    nodeScore: getNodeScore(selfScore, dependencyEvaluations.map(({ nodeScore }) => nodeScore)),
    dependencies: dependencyEvaluations
  } as NodeEvaluation;
};

const filterCorpCheckPackages = (node: Node, depth = 0): Node => {
  if (depth === 0 && corpCheckPackages.includes(node.name)) return node;
  return {
    name: node.name,
    version: node.version,
    license: node.license,
    dependencies: node.dependencies
      .filter(({ name }) => !corpCheckPackages.includes(name))
      .map(dependency => filterCorpCheckPackages(dependency, depth + 1))
  };
};

@injectable(InjectionScope.Singleton)
export class Evaluate extends Service {
  public async handle(@param data, @param ruleSet) {
    const evaluators: Evaluator[] = [ license, version, npmScores ];
    const rules = [ ruleSet.license, ruleSet.version, ruleSet.npmScores ];
    const treeWithoutCorpCheckPackages = filterCorpCheckPackages(data.tree);
    const rootEvaluation = evaluate(evaluators, rules, data.meta, treeWithoutCorpCheckPackages, data.unknownPackages);
    return {
      rootEvaluation,
      qualification: qualificate(rootEvaluation.nodeScore)
    } as FinalEvaluation;
  }
}

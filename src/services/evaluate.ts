import { Service, param, injectable, InjectionScope, inject } from 'functionly';
import {
  Info as Data,
  Node,
  Meta,
  PackageMeta,
  RuleSet,
  Qualification,
  Evaluator,
  Evaluation,
  NodeEvaluation,
  FinalEvaluation
} from '../types';
import license from '../evaluators/license';
import version from '../evaluators/version';
import npmScores from '../evaluators/npmScores';

const A = 1;

const qualificate = (finalScore: number): Qualification => {
  if (finalScore >= 0.5) return 'RECOMMENDED';
  else if (finalScore > 0 && finalScore < 0.5) return 'ACCEPTED';
  else return 'REJECTED';
};

const weightFunction = (score: number): number => Math.sqrt(A * score);

const getNodeScore = (selfScore: number, dependencyScores: number[]): number => {
  return Math.min(selfScore, ...dependencyScores.map(weightFunction));
};

const evaluate = (evaluators: Evaluator[], rules: any[], meta: Meta, node: Node, depth: number = 0): NodeEvaluation => {
  const evaluations = evaluators.map((evaluator, i) =>
    evaluator({ node, packageMeta: meta[node.name] || ({} as PackageMeta), rule: rules[i] || {}, depth })
  );
  const dependencyEvaluations = node.dependencies.map(dependency =>
    evaluate(evaluators, rules, meta, dependency, depth + 1)
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

@injectable(InjectionScope.Singleton)
export class Evaluate extends Service {
  public async handle(@param data, @param ruleSet) {
    console.log('ruleSet:', ruleSet);
    const evaluators: Evaluator[] = [ license, version, npmScores ];
    const rules = [ ruleSet.license, ruleSet.version, ruleSet.npmScores ];
    const rootEvaluation = evaluate(evaluators, rules, data.meta, data.tree);
    return {
      rootEvaluation,
      qualification: qualificate(rootEvaluation.nodeScore)
    } as FinalEvaluation;
  }
}

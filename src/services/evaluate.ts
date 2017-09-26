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
import License from '../evaluators/license';
import Version from '../evaluators/version';

const A = 1;

const qualificate = (finalScore: number): Qualification => {
  if (finalScore >= 0.8) return 'RECOMMENDED';
  else if (finalScore >= 0.5 && finalScore < 0.8) return 'ACCEPTED';
  else return 'REJECTED';
};

const weightFunction = (score: number): number => Math.sqrt(A * score);

const getNodeScore = (selfScore: number, dependencyScores: number[]): number => {
  return Math.min(selfScore, ...dependencyScores.map(weightFunction));
};

const evaluate = async (evaluators: Evaluator[], rules: any[], meta: Meta, node: Node): Promise<NodeEvaluation> => {
  const evaluations = await Promise.all(
    evaluators.map((evaluator, i) =>
      evaluator({ node, packageMeta: meta[node.name] || ({} as PackageMeta), rule: rules[i] || {} })
    )
  );
  const dependencyEvaluations = await Promise.all(
    node.dependencies.map(dependency => evaluate(evaluators, rules, meta, dependency))
  );
  const selfScore = evaluations.reduce((acc, { score }) => acc * score, 1);
  return {
    nodeName: node.name,
    evaluations,
    nodeScore: getNodeScore(selfScore, dependencyEvaluations.map(({ nodeScore }) => nodeScore)),
    dependencies: dependencyEvaluations
  } as NodeEvaluation;
};

@injectable(InjectionScope.Singleton)
export class Evaluate extends Service {
  public async handle(@param data, @param ruleSet, @inject(License) license, @inject(Version) version) {
    const evaluators: Evaluator[] = [ license, version ]; // evaulators are injectable services
    const rules = [ ruleSet.license, ruleSet.version ];
    const rootEvaluation = await evaluate(evaluators, rules, data.meta, data.tree);
    return {
      rootEvaluation,
      qualification: qualificate(rootEvaluation.nodeScore)
    } as FinalEvaluation;
  }
}

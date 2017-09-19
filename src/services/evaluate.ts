import { Service, param, injectable, InjectionScope, inject } from 'functionly';
import { Info as Data, RuleSet, Qualification, Evaluator, Evaluation, FinalEvaluation } from '../types';
import License from '../evaluators/License';

const qualificate = (finalScore: number): Qualification => {
  if (finalScore >= 0.8) return 'RECOMMENDED';
  else if (finalScore >= 0.5 && finalScore < 0.8) return 'ACCEPTED';
  else return 'REJECTED';
};

@injectable(InjectionScope.Singleton)
export class Evaluate extends Service {
  public async handle(@param data, @param ruleSet, @inject(License) license) {
    const evaluators: Evaluator[] = [ license ]; // evaulators are injectable services
    const rules = [ ruleSet.license ];
    const evaluations: Evaluation[] = await Promise.all(
      evaluators.map((evaluator, i) => evaluator({ data, rule: rules[i] }))
    );
    const finalScore = evaluations.reduce((final, { score }) => final * score, 1);
    return {
      evaluations,
      finalScore,
      qualification: qualificate(finalScore)
    } as FinalEvaluation;
  }
}

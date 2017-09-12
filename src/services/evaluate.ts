import { Service, param, injectable, InjectionScope } from 'functionly';

export type Evaluation = {
  score: number;
  description: string;
  meta: any; // meta for custom data visualization
};

export type Evaluator = (data: any) => Promise<Evaluation>;

export type Qualification = 'RECOMMENDED' | 'ACCEPTED' | 'REJECTED';

export type FinalEvaluation = {
  evaluations: Evaluation[];
  finalScore: number;
  qualification: Qualification;
};

const qualificate = (finalScore: number): Qualification => {
  if (finalScore >= 0.8) return 'RECOMMENDED';
  else if (finalScore >= 0.5 && finalScore < 0.8) return 'ACCEPTED';
  else return 'REJECTED';
};

@injectable(InjectionScope.Singleton)
export class Evaluate extends Service {
  public async handle(@param data, @param cid) {
    const evaluators: Evaluator[] = []; // evaulators are injectable services
    const evaluations: Evaluation[] = await Promise.all(evaluators.map(evaluator => evaluator(data)));
    const weights: number[] = evaluations.map(() => 1); // trivial weights
    const finalScore = evaluations.reduce((acc, { score }, i) => acc * score * weights[i], 1);
    return {
      evaluations,
      finalScore,
      qualification: qualificate(finalScore)
    } as FinalEvaluation;
  }
}

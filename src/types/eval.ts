import { Info as Data } from './info';

export type Evaluation = {
  name: string;
  score: number;
  description: string;
  meta: any; // meta for custom data visualization
};

export type Evaluator = ({ data, rule }: { data: Data; rule: any }) => Promise<Evaluation>;

export type Qualification = 'RECOMMENDED' | 'ACCEPTED' | 'REJECTED';

export type FinalEvaluation = {
  evaluations: Evaluation[];
  finalScore: number;
  qualification: Qualification;
};

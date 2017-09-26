import { Info as Data } from './info';

export type Log = {
  message: string;
  type: 'ERROR' | 'WARNING';
  meta?: any;
};

export type Evaluation = {
  name: string;
  score: number;
  description: string;
  logs: Log[];
};

export type Evaluator = ({ data, rule }: { data: Data; rule: any }) => Promise<Evaluation>;

export type Qualification = 'RECOMMENDED' | 'ACCEPTED' | 'REJECTED';

export type FinalEvaluation = {
  evaluations: Evaluation[];
  finalScore: number;
  qualification: Qualification;
};

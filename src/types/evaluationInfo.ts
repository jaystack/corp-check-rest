import { FinalEvaluation } from 'corp-check-core';

export type EvaluationInfo = {
  _id: any;
  packageInfoId: any;
  date: number;
  ruleSet: Object;
  ruleSetHash: string;
  result?: FinalEvaluation;
};

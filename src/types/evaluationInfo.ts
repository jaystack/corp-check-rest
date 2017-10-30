import { FinalEvaluation } from 'corp-check-core';

export type EvaluationInfo = {
  _id: any;
  packageInfoId: any;
  date: number;
  ruleSet: string;
  ruleSetHash: string;
  result?: FinalEvaluation;
};

import { Node, PackageMeta } from './info';

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

//export type Evaluator = ({ data, rule }: { data: Data; rule: any }) => Promise<Evaluation>;
export type Evaluator = (
  { node, packageMeta, rule }: { node: Node; packageMeta: PackageMeta; rule: any }
) => Promise<Evaluation>;

export type Qualification = 'RECOMMENDED' | 'ACCEPTED' | 'REJECTED';

export type NodeEvaluation = {
  nodeName: string;
  nodeVersion: string;
  evaluations: Evaluation[];
  nodeScore: number;
  dependencies: NodeEvaluation[];
};

export type FinalEvaluation = {
  rootEvaluation: NodeEvaluation;
  qualification: Qualification;
};

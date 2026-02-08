export type ConditionOp = 'equals' | 'contains' | 'gt' | 'lt' | 'in';

export type SimpleCondition = {
  path: string;
  op: ConditionOp;
  value: any;
};

export type Conditions =
  | { all: SimpleCondition[] }
  | { any: SimpleCondition[] };

import { Injectable } from '@nestjs/common';

type Condition =
  | { op: 'eq'; left: string; right: any }
  | { op: 'contains'; left: string; right: any }
  | { op: 'gt' | 'gte' | 'lt' | 'lte'; left: string; right: number };

type Conditions = { all: Condition[] } | { any: Condition[] };

@Injectable()
export class ConditionEvaluatorService {
  matches(conditions: any, event: any): boolean {
    if (!conditions) return true;
    if (typeof conditions !== 'object') return false;

    const all = Array.isArray(conditions.all)
      ? (conditions.all as any[])
      : null;
    const any = Array.isArray(conditions.any)
      ? (conditions.any as any[])
      : null;

    if (!all && !any) return true;

    if (all) return all.every((c) => this.evalOne(c, event));
    if (any) return any.some((c) => this.evalOne(c, event));

    return true;
  }

  private evalOne(raw: any, event: any): boolean {
    const op = raw?.op;
    const leftPath = raw?.left;
    const right = raw?.right;

    if (!op || !leftPath) return false;

    const left = this.getByPath(event, leftPath);
    console.log('[WF][COND]', { op, leftPath, left, right });

    switch (op) {
      case 'eq':
        return left === right;

      case 'contains':
        if (left == null) return false;
        return String(left).toLowerCase().includes(String(right).toLowerCase());

      case 'gt':
        return Number(left) > Number(right);
      case 'gte':
        return Number(left) >= Number(right);
      case 'lt':
        return Number(left) < Number(right);
      case 'lte':
        return Number(left) <= Number(right);

      default:
        return false;
    }
  }

  private getByPath(obj: any, path: string) {
    return path
      .split('.')
      .reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
  }
}

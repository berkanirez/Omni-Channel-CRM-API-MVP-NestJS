export function getByPath(obj: any, path: string) {
  const parts = path.split('.');
  let cur = obj;

  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }

  return cur;
}

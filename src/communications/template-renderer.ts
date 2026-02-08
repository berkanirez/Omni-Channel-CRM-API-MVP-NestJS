export function renderTemplate(
  template: string | null | undefined,
  vars: Record<string, any> | undefined,
) {
  if (!template) return null;
  const v = vars ?? {};

  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
    const val = v[key];
    return val === undefined || val === null ? '' : String(val);
  });
}

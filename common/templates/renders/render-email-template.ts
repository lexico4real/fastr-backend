export function renderEmailTemplate(
  template: string,
  variables: Record<string, string | number>,
): string {
  return template.replace(/{{\s*(\w+)\s*}}/g, (_, key) => {
    return variables[key] !== undefined ? String(variables[key]) : `{{${key}}}`;
  });
}

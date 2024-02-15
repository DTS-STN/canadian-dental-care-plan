/**
 * Expand the given string template using the provided variables.
 * A string template uses handlebar notation to denote placeholders. For example:
 *
 * expandTemplate('{greeting}, {subject}!', { greeting: 'Hello', subject: 'world' }) → 'Hello, world!
 */
export function expandTemplate(template: string, variables: Record<string, string>) {
  return Object.entries(variables).reduce((t, [key, value]) => t.replace(`{${key}}`, value), template);
}

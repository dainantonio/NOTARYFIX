/**
 * src/schemas/validate.js
 *
 * Thin wrapper around schema.safeParse().
 * - Development: console.error (red, visible in devtools)
 * - Production:  console.warn  (silent to end users, visible in monitoring)
 * Never throws — validation is a guardrail, not a gate.
 */

const isDev = import.meta.env?.DEV ?? false;

/**
 * @param {object} schema  - Any schema from src/schemas/index.js
 * @param {object} data    - The record about to be persisted
 * @param {string} [context] - Optional label shown in the error (e.g. "addInvoice")
 */
export function validateRecord(schema, data, context = '') {
  const result = schema.safeParse(data);
  if (!result.ok) {
    const tag = context ? `[${context}] ` : '';
    const message = `${tag}Schema violation:\n  ${result.errors.join('\n  ')}`;
    if (isDev) {
      console.error(message);
    } else {
      console.warn(message);
    }
  }
  return result.ok;
}

/**
 * src/schemas/validate.js
 *
 * Thin validation wrapper for Zod schemas.
 *
 * - In development (import.meta.env.DEV): console.error with full details
 *   so developers see drift immediately.
 * - In production: console.warn only — never throw, never block the user.
 *
 * Usage:
 *   import { validateRecord } from '../schemas/validate';
 *   import { InvoiceSchema }  from '../schemas';
 *
 *   const addInvoice = (i) => {
 *     validateRecord(InvoiceSchema, i, 'Invoice');
 *     return setData(...);
 *   };
 */

/**
 * Validate `data` against `schema`, logging errors without ever throwing.
 *
 * @param {import('zod').ZodTypeAny} schema  - Zod schema to validate against
 * @param {unknown}                  data    - The record to validate
 * @param {string}                   name    - Human-readable name for logging (e.g. 'Invoice')
 * @returns {boolean}                        - true if valid, false if issues found
 */
export function validateRecord(schema, data, name) {
  try {
    const result = schema.safeParse(data);
    if (!result.success) {
      const issues = result.error.issues
        .map((i) => `  • [${i.path.join('.') || 'root'}] ${i.message}`)
        .join('\n');

      const message = `[NotaryFix Schema] ${name} validation failed:\n${issues}`;

      if (import.meta.env?.DEV) {
        // Dev: use console.error so it shows red in devtools
        console.error(message, '\nRecord:', data);
      } else {
        // Prod: warn only — never block the user
        console.warn(message);
      }
      return false;
    }
    return true;
  } catch (err) {
    // Defensive: if Zod itself throws (shouldn't happen), log and continue
    console.warn(`[NotaryFix Schema] Validator threw unexpectedly for ${name}:`, err);
    return false;
  }
}

/**
 * Validate and return the parsed/coerced data.
 * Useful when you want Zod's transforms (e.g. coercing "150" → 150).
 * Falls back to raw data if parsing fails.
 *
 * @param {import('zod').ZodTypeAny} schema
 * @param {unknown}                  data
 * @param {string}                   name
 * @returns {unknown}  Parsed data if valid, raw data if not
 */
export function parseRecord(schema, data, name) {
  try {
    const result = schema.safeParse(data);
    if (!result.success) {
      validateRecord(schema, data, name); // log the issues
      return data;                        // fall back to raw
    }
    return result.data;
  } catch (err) {
    console.warn(`[NotaryFix Schema] parseRecord threw for ${name}:`, err);
    return data;
  }
}

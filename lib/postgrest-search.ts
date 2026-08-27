/**
 * Strips characters that act as delimiters inside a PostgREST `or(...)`
 * expression. Interpolating a raw user term into one of those strings lets
 * commas and parentheses be parsed as additional filters rather than as part
 * of the search text.
 */
export function sanitizeSearchTerm(term: string | null | undefined): string {
  return (term || "").replace(/[,()\\]/g, " ").trim()
}

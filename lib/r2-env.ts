/** Safe env read for R2 (shared by presign routes). */
export function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing environment variable: ${name}`)
  return v
}

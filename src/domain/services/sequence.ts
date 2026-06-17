// formatter ของเลขเอกสาร (pure) — การ increment อะตอมมิกอยู่ใน infra/sequence repo
export function formatDocNumber(prefix: string, n: number, padding: number): string {
  return `${prefix}${String(n).padStart(padding, "0")}`;
}

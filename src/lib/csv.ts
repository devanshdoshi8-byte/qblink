/**
 * Safe CSV cell: quotes the value and neutralises spreadsheet formulas
 * (cells starting with = + - @ tab or CR get a leading apostrophe).
 */
export function csvCell(value: unknown): string {
  let s = value == null ? "" : typeof value === "object" ? JSON.stringify(value) : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
}

export function toCsv(rows: unknown[][]): string {
  return rows.map((r) => r.map(csvCell).join(",")).join("\n");
}

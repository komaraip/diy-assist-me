export function toCsv(rows = [], columns = []) {
  const header = columns.map((column) => escapeCsvCell(column.header)).join(",");
  const body = rows.map((row) =>
    columns
      .map((column) => {
        const value = typeof column.value === "function" ? column.value(row) : row[column.key];
        return escapeCsvCell(value);
      })
      .join(",")
  );

  return [header, ...body].join("\n");
}

export function escapeCsvCell(value) {
  if (value === null || value === undefined) return "";

  const normalizedValue = typeof value === "object" ? JSON.stringify(value) : String(value);
  const escapedValue = normalizedValue.replace(/"/g, '""');

  if (/[",\r\n]/.test(escapedValue)) {
    return `"${escapedValue}"`;
  }

  return escapedValue;
}

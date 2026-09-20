// Small, dependency-free CSV export used by list pages that want a "download as CSV" action for
// accounting/offline record-keeping — a real, recurring shop-owner need this app didn't have any
// version of yet. Client-side only (no backend endpoint): converts rows already shaped by the
// caller into a CSV string and triggers a browser download. Kept deliberately generic (columns +
// rows in, a Blob download out) so any list page can reuse it without a bespoke exporter.

export interface CsvColumn<T> {
  header: string
  /** Extracts a single cell's value for a row. Returning null/undefined renders as an empty cell. */
  accessor: (row: T) => string | number | null | undefined
}

function escapeCsvCell(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? '' : String(value)
  // Quote whenever the cell contains a comma, quote, or newline — the three characters that are
  // otherwise ambiguous in CSV — doubling any embedded quotes per the standard escaping rule.
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

export function rowsToCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((column) => escapeCsvCell(column.header)).join(',')
  const lines = rows.map((row) => columns.map((column) => escapeCsvCell(column.accessor(row))).join(','))
  // Leading BOM so Excel (the overwhelmingly common consumer of a shop-owner's exported CSV)
  // correctly detects UTF-8 instead of misrendering non-ASCII customer/product names.
  return `﻿${[header, ...lines].join('\r\n')}`
}

/**
 * Triggers a browser download of `content` as a file named `filename`. Revokes the object URL
 * after the click to avoid leaking it — the download itself doesn't need the URL to stay valid
 * once the browser has picked it up.
 */
export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function exportRowsAsCsv<T>(filename: string, rows: T[], columns: CsvColumn<T>[]): void {
  downloadCsv(filename, rowsToCsv(rows, columns))
}

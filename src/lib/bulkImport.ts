import Papa from 'papaparse'
import readXlsxFile from 'read-excel-file'

export type ParsedRow = Record<string, string>

function normalizeHeader(header: string) {
  return header.trim().toLowerCase().replace(/\s+/g, '_')
}

async function parseCsv(file: File): Promise<ParsedRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: normalizeHeader,
      complete: (results) => resolve(results.data),
      error: (error: Error) => reject(error),
    })
  })
}

async function parseXlsx(file: File): Promise<ParsedRow[]> {
  const rows = await readXlsxFile(file)
  if (rows.length === 0) return []
  const headers = rows[0].map((h) => normalizeHeader(String(h ?? '')))
  return rows.slice(1).map((row) => {
    const obj: ParsedRow = {}
    headers.forEach((header, idx) => {
      const cell = row[idx]
      obj[header] = cell === null || cell === undefined ? '' : String(cell)
    })
    return obj
  })
}

export async function parseSpreadsheetFile(file: File): Promise<ParsedRow[]> {
  const name = file.name.toLowerCase()
  if (name.endsWith('.csv')) return parseCsv(file)
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) return parseXlsx(file)
  throw new Error('Unsupported file type. Please upload a .csv or .xlsx file.')
}

export function parseBoolean(value: string | undefined): boolean {
  if (!value) return false
  const v = value.trim().toLowerCase()
  return v === 'yes' || v === 'true' || v === '1' || v === 'y'
}

export function downloadCsvTemplate(headers: string[], filename: string, exampleRow?: string[]) {
  const rows = exampleRow ? [headers, exampleRow] : [headers]
  const csv = rows.map((row) => row.map((cell) => `"${(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

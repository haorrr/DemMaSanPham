/**
 * excelReader.js
 * Reads Excel files in the browser using SheetJS.
 * Finds the "SAN PHAM" column across all sheets and returns raw rows.
 */

import * as XLSX from 'xlsx'
import { normalize } from './productParser.js'

// Accepted column header variants — stored uppercase + NFC so they match normalize() output
const RAW_COLUMN_VARIANTS = [
  'SảN PHẩM',   // SẢN PHẨM
  'SAN PHAM',
  'SANPHAM',
  'SảN PHầM',   // SẢN PHẦM (typo)
  'SAN PHẩM',        // SAN PHẨM
]
// Apply same normalize() so comparison is always apples-to-apples
const COLUMN_VARIANTS = new Set(RAW_COLUMN_VARIANTS.map(v => v.normalize('NFC').toUpperCase()))

/**
 * Check if a header cell value matches the SAN PHAM column.
 * Uses the same normalize() as the product parser to guarantee consistent comparison.
 */
function isProductColumn(headerValue) {
  if (headerValue == null) return false
  const norm = normalize(String(headerValue))
  return COLUMN_VARIANTS.has(norm)
}

/**
 * Read a browser File object as an ArrayBuffer.
 */
function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = () => reject(new Error('Không thể đọc file: ' + file.name))
    reader.readAsArrayBuffer(file)
  })
}

/**
 * Find the column index of "SAN PHAM" in a sheet.
 * Scans the first 10 rows in case there are metadata rows above headers.
 */
function findProductColumnIndex(sheet) {
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1')

  for (let r = range.s.r; r <= Math.min(range.s.r + 9, range.e.r); r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cellAddr = XLSX.utils.encode_cell({ r, c })
      const cell = sheet[cellAddr]
      if (cell && isProductColumn(cell.v)) {
        return { colIndex: c, headerRow: r }
      }
    }
  }

  return null
}

/**
 * Read a single Excel file and return all raw product rows.
 *
 * @param {File} file
 * @returns {Promise<{ rows: RawRow[], warnings: FileWarning[] }>}
 */
export async function readExcelFile(file) {
  const rows = []
  const warnings = []

  let workbook
  try {
    const arrayBuffer = await readFileAsArrayBuffer(file)
    workbook = XLSX.read(arrayBuffer, { type: 'array' })
  } catch (err) {
    warnings.push({ fileName: file.name, message: 'Lỗi đọc file: ' + err.message })
    return { rows, warnings }
  }

  let sheetsWithColumn = 0

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    if (!sheet || !sheet['!ref']) continue

    const found = findProductColumnIndex(sheet)
    if (!found) continue

    sheetsWithColumn++
    const { colIndex, headerRow } = found
    const range = XLSX.utils.decode_range(sheet['!ref'])

    for (let r = headerRow + 1; r <= range.e.r; r++) {
      const cellAddr = XLSX.utils.encode_cell({ r, c: colIndex })
      const cell = sheet[cellAddr]
      if (!cell || cell.v == null || String(cell.v).trim() === '') continue

      rows.push({
        fileName: file.name,
        sheetName,
        rowIndex: r + 1,
        rawValue: String(cell.v),
      })
    }
  }

  if (sheetsWithColumn === 0) {
    warnings.push({
      fileName: file.name,
      message: 'Không tìm thấy cột "SẢN PHẨM" trong bất kỳ sheet nào',
    })
  }

  return { rows, warnings }
}

/**
 * Process multiple files sequentially with progress callback.
 *
 * @param {File[]} files
 * @param {function} onProgress - called with (current, total) after each file
 * @returns {Promise<{ rows: RawRow[], warnings: FileWarning[] }>}
 */
export async function readExcelFiles(files, onProgress) {
  const allRows = []
  const allWarnings = []

  for (let i = 0; i < files.length; i++) {
    onProgress?.(i + 1, files.length)
    await new Promise(r => setTimeout(r, 0))

    const { rows, warnings } = await readExcelFile(files[i])
    allRows.push(...rows)
    allWarnings.push(...warnings)
  }

  return { rows: allRows, warnings: allWarnings }
}

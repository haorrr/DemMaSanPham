/**
 * excelReader.js
 * Reads Excel files in the browser using SheetJS.
 * Finds the "SẢN PHẨM" column across all sheets and returns raw rows.
 */

import * as XLSX from 'xlsx'
import { normalize } from './productParser.js'

// Accepted column header variants
const COLUMN_VARIANTS = [
  'SẢN PHẨM',
  'SAN PHAM',
  'SANPHAM',
  'SẢN PHẦM',  // common typo with wrong tone
  'SAN PHẨM',
]

/**
 * Check if a header cell value matches the SẢN PHẨM column.
 */
function isProductColumn(headerValue) {
  if (headerValue == null) return false
  const norm = normalize(String(headerValue))
  return COLUMN_VARIANTS.includes(norm)
}

/**
 * Read a browser File object as an ArrayBuffer.
 */
function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = () => reject(new Error(`Không thể đọc file: ${file.name}`))
    reader.readAsArrayBuffer(file)
  })
}

/**
 * Find the column index of "SẢN PHẨM" in a sheet's first row.
 * Returns null if not found.
 *
 * @param {XLSX.WorkSheet} sheet
 * @returns {string|null} column letter (e.g. "A", "B")
 */
function findProductColumnIndex(sheet) {
  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1')

  // Check first few rows for header (in case there are metadata rows above)
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
 * @param {File} file - browser File object
 * @returns {Promise<{ rows: RawRow[], warnings: FileWarning[] }>}
 *   RawRow: { fileName, sheetName, rowIndex, rawValue }
 *   FileWarning: { fileName, message }
 */
export async function readExcelFile(file) {
  const rows = []
  const warnings = []

  let workbook
  try {
    const arrayBuffer = await readFileAsArrayBuffer(file)
    workbook = XLSX.read(arrayBuffer, { type: 'array' })
  } catch (err) {
    warnings.push({ fileName: file.name, message: `Lỗi đọc file: ${err.message}` })
    return { rows, warnings }
  }

  let sheetsWithColumn = 0

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]

    if (!sheet || !sheet['!ref']) continue

    const found = findProductColumnIndex(sheet)
    if (!found) {
      // Skip sheet silently — not all sheets need the column
      continue
    }

    sheetsWithColumn++
    const { colIndex, headerRow } = found
    const range = XLSX.utils.decode_range(sheet['!ref'])

    // Iterate rows below the header
    for (let r = headerRow + 1; r <= range.e.r; r++) {
      const cellAddr = XLSX.utils.encode_cell({ r, c: colIndex })
      const cell = sheet[cellAddr]

      if (!cell || cell.v == null || String(cell.v).trim() === '') continue

      rows.push({
        fileName: file.name,
        sheetName,
        rowIndex: r + 1, // 1-based for display
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
    // Yield to UI thread
    await new Promise(r => setTimeout(r, 0))

    const { rows, warnings } = await readExcelFile(files[i])
    allRows.push(...rows)
    allWarnings.push(...warnings)
  }

  return { rows: allRows, warnings: allWarnings }
}

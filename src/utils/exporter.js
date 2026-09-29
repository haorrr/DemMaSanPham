/**
 * exporter.js
 * Exports results and errors to an Excel file using SheetJS.
 */

import * as XLSX from 'xlsx'

/**
 * Export product results and errors to a .xlsx file.
 *
 * @param {Array<{ma,mau,size,count}>} products - sorted result list
 * @param {Array<object>} errors - parse errors
 */
export function exportToExcel(products, errors) {
  const wb = XLSX.utils.book_new()

  // Sheet 1: KẾT QUẢ
  const resultHeaders = ['MÃ', 'MÀU', 'SIZE', 'MÃ MÀU SIZE', 'SỐ LƯỢNG']
  const resultRows = products.map(p => [
    p.ma,
    p.mau,
    p.size,
    `${p.ma} ${p.mau} ${p.size}`,
    p.count,
  ])
  const resultSheet = XLSX.utils.aoa_to_sheet([resultHeaders, ...resultRows])

  // Column widths
  resultSheet['!cols'] = [
    { wch: 12 }, // MÃ
    { wch: 20 }, // MÀU
    { wch: 8 },  // SIZE
    { wch: 30 }, // MÃ MÀU SIZE
    { wch: 12 }, // SỐ LƯỢNG
  ]

  XLSX.utils.book_append_sheet(wb, resultSheet, 'KẾT QUẢ')

  // Sheet 2: DU_LIEU_LOI
  const errorHeaders = ['File', 'Sheet', 'Dòng', 'Nội dung gốc', 'Lý do lỗi']
  const errorRows = errors.map(e => [
    e.fileName || '',
    e.sheetName || '',
    e.rowIndex || '',
    e.rawValue || '',
    e.reason || '',
  ])
  const errorSheet = XLSX.utils.aoa_to_sheet([errorHeaders, ...errorRows])

  errorSheet['!cols'] = [
    { wch: 30 }, // File
    { wch: 15 }, // Sheet
    { wch: 8 },  // Dòng
    { wch: 40 }, // Nội dung gốc
    { wch: 35 }, // Lý do lỗi
  ]

  XLSX.utils.book_append_sheet(wb, errorSheet, 'DU_LIEU_LOI')

  XLSX.writeFile(wb, 'ket-qua-dem-san-pham.xlsx')
}

import { useState, useMemo, useCallback } from 'react'
import FileUpload from './components/FileUpload.jsx'
import Statistics from './components/Statistics.jsx'
import FilterBar from './components/FilterBar.jsx'
import ResultTable from './components/ResultTable.jsx'
import ErrorTable from './components/ErrorTable.jsx'
import Calculator from './components/Calculator.jsx'
import { readExcelFiles } from './utils/excelReader.js'
import { parseCell } from './utils/productParser.js'

const DEFAULT_FILTERS = {
  search: '',
  ma: '',
  mau: '',
  size: '',
  sort: 'count_desc',
}

export default function App() {
  const [files, setFiles] = useState([])
  const [processing, setProcessing] = useState({ active: false, current: 0, total: 0 })
  const [allProducts, setAllProducts] = useState([])   // [{ma, mau, size, count, key}]
  const [errors, setErrors] = useState([])             // parse errors
  const [fileWarnings, setFileWarnings] = useState([]) // file-level warnings
  const [stats, setStats] = useState({ totalFiles: 0, totalRows: 0, totalProducts: 0, uniqueTypes: 0 })
  const [filters, setFilters] = useState(DEFAULT_FILTERS)

  // ─── File Management ───────────────────────────────────────────────────────

  function handleFilesAdd(newFiles) {
    setFiles(prev => {
      // Deduplicate by name + size
      const existing = new Set(prev.map(f => `${f.name}|${f.size}`))
      const fresh = newFiles.filter(f => !existing.has(`${f.name}|${f.size}`))
      const merged = [...prev, ...fresh]
      // Trigger processing immediately with the merged list
      triggerProcess(merged)
      return merged
    })
  }

  function handleFileRemove(idx) {
    setFiles(prev => {
      const next = prev.filter((_, i) => i !== idx)
      if (next.length === 0) {
        resetResults()
      } else {
        triggerProcess(next)
      }
      return next
    })
  }

  function handleFilesReset() {
    setFiles([])
    resetResults()
  }

  function resetResults() {
    setAllProducts([])
    setErrors([])
    setFileWarnings([])
    setStats({ totalFiles: 0, totalRows: 0, totalProducts: 0, uniqueTypes: 0 })
    setFilters(DEFAULT_FILTERS)
  }

  // ─── Processing Pipeline ───────────────────────────────────────────────────

  const triggerProcess = useCallback(async (fileList) => {
    if (fileList.length === 0) return

    setProcessing({ active: true, current: 0, total: fileList.length })
    setAllProducts([])
    setErrors([])
    setFileWarnings([])

    try {
      const parseErrors = []
      const rowsForStats = { count: 0 }
      let totalProductsParsed = 0
      const countMap = new Map() // key → {ma, mau, size, count, key}

      const { rows, warnings } = await readExcelFiles(fileList, (current, total) => {
        setProcessing({ active: true, current, total })
      })

      setFileWarnings(warnings)
      rowsForStats.count = rows.length

      // Parse each row
      for (const row of rows) {
        const { products, errors: rowErrors } = parseCell(row.rawValue, {
          fileName: row.fileName,
          sheetName: row.sheetName,
          rowIndex: row.rowIndex,
        })

        totalProductsParsed += products.length
        parseErrors.push(...rowErrors)

        for (const p of products) {
          // Extra safety: trim each field before building key
          const ma = p.ma.trim()
          const mau = p.mau.trim()
          const size = p.size.trim()
          const key = `${ma}|${mau}|${size}`
          if (countMap.has(key)) {
            countMap.get(key).count++
          } else {
            countMap.set(key, { ma, mau, size, count: 1, key })
          }
        }
      }

      // Sort by count desc initially
      const resultList = [...countMap.values()].sort((a, b) => b.count - a.count)

      setAllProducts(resultList)
      setErrors(parseErrors)
      setStats({
        totalFiles: fileList.length,
        totalRows: rowsForStats.count,
        totalProducts: totalProductsParsed,
        uniqueTypes: resultList.length,
      })
    } finally {
      setProcessing({ active: false, current: 0, total: 0 })
    }
  }, [])

  // ─── Filtering & Sorting ───────────────────────────────────────────────────

  const filteredProducts = useMemo(() => {
    let result = allProducts

    if (filters.search) {
      const q = filters.search.toUpperCase().trim()
      result = result.filter(p =>
        `${p.ma} ${p.mau} ${p.size}`.includes(q)
      )
    }

    if (filters.ma) result = result.filter(p => p.ma === filters.ma)
    if (filters.mau) result = result.filter(p => p.mau === filters.mau)
    if (filters.size) result = result.filter(p => p.size === filters.size)

    const sorted = [...result]
    switch (filters.sort) {
      case 'count_desc': sorted.sort((a, b) => b.count - a.count); break
      case 'count_asc':  sorted.sort((a, b) => a.count - b.count); break
      case 'ma_asc':     sorted.sort((a, b) => a.ma.localeCompare(b.ma, 'vi')); break
      case 'ma_desc':    sorted.sort((a, b) => b.ma.localeCompare(a.ma, 'vi')); break
      case 'mau_asc':    sorted.sort((a, b) => a.mau.localeCompare(b.mau, 'vi')); break
      case 'mau_desc':   sorted.sort((a, b) => b.mau.localeCompare(a.mau, 'vi')); break
    }

    return sorted
  }, [allProducts, filters])

  const hasData = allProducts.length > 0

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">TOOL ĐẾM MÃ SẢN PHẨM</h1>
            <p className="text-sm text-gray-500">Tải lên file Excel · Tự động đọc và đếm theo MÃ + MÀU + SIZE</p>
          </div>
          <div className="ml-auto text-right hidden sm:block">
            <p className="text-xs text-gray-400">Tác giả</p>
            <p className="text-sm font-semibold text-indigo-600">Võ Hoàn Hảo</p>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Upload */}
        <FileUpload
          files={files}
          onFilesAdd={handleFilesAdd}
          onFileRemove={handleFileRemove}
          onFilesReset={handleFilesReset}
          processing={processing}
        />

        {/* Stats */}
        {hasData && <Statistics stats={stats} />}

        {/* Calculator */}
        {hasData && <Calculator allProducts={allProducts} />}

        {/* Filter + Table */}
        {hasData && (
          <>
            <FilterBar
              allProducts={allProducts}
              filters={filters}
              onFiltersChange={setFilters}
              filteredCount={filteredProducts.length}
            />
            <ResultTable
              products={filteredProducts}
              allProducts={allProducts}
              errors={errors}
              searchTerm={filters.search}
            />
          </>
        )}

        {/* Errors */}
        {(errors.length > 0 || fileWarnings.length > 0) && (
          <ErrorTable errors={errors} fileWarnings={fileWarnings} />
        )}

        {/* Empty state after processing with no results */}
        {!processing.active && files.length > 0 && !hasData && errors.length === 0 && fileWarnings.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            <p className="text-gray-500 text-sm">Không tìm thấy dữ liệu sản phẩm trong các file đã chọn.</p>
            <p className="text-gray-400 text-xs mt-1">Hãy kiểm tra lại file — cần có cột "SẢN PHẨM".</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 pb-6 text-center text-xs text-gray-400">
        Toàn bộ dữ liệu được xử lý trực tiếp trên trình duyệt · Không upload lên server
      </footer>
    </div>
  )
}

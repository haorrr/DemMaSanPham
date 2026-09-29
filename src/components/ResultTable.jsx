import { exportToExcel } from '../utils/exporter.js'

function fmt(n) {
  return n.toLocaleString('vi-VN')
}

/** Highlight search term inside text */
function Highlight({ text, term }) {
  if (!term) return <span>{text}</span>
  const upper = text.toUpperCase()
  const termUpper = term.toUpperCase()
  const idx = upper.indexOf(termUpper)
  if (idx === -1) return <span>{text}</span>
  return (
    <span>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 text-yellow-900 rounded px-0.5">{text.slice(idx, idx + term.length)}</mark>
      {text.slice(idx + term.length)}
    </span>
  )
}

export default function ResultTable({ products, allProducts, errors, searchTerm }) {
  const totalCount = products.reduce((s, p) => s + p.count, 0)

  async function copyTable() {
    const header = 'MÃ\tMÀU\tSIZE\tMÃ MÀU SIZE\tSỐ LƯỢNG'
    const rows = products.map(p =>
      `${p.ma}\t${p.mau}\t${p.size}\t${p.ma} ${p.mau} ${p.size}\t${p.count}`
    )
    const text = [header, ...rows].join('\n')
    try {
      await navigator.clipboard.writeText(text)
      alert('Đã copy bảng vào clipboard!')
    } catch {
      fallbackCopy(text)
    }
  }

  async function copyList() {
    const lines = products.map(p => `${p.ma} ${p.mau} ${p.size}: ${p.count}`)
    const text = lines.join('\n')
    try {
      await navigator.clipboard.writeText(text)
      alert('Đã copy danh sách vào clipboard!')
    } catch {
      fallbackCopy(text)
    }
  }

  function fallbackCopy(text) {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.focus()
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    alert('Đã copy vào clipboard!')
  }

  function handleExport() {
    exportToExcel(allProducts, errors)
  }

  if (products.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
        <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="text-gray-400 text-sm">Không có dữ liệu phù hợp</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      {/* Action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={copyTable}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            Copy bảng
          </button>
          <button
            onClick={copyList}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Copy danh sách
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Xuất Excel
          </button>
        </div>
        <div className="text-sm text-gray-500">
          <span className="font-semibold text-gray-700">{fmt(products.length)}</span> loại ·{' '}
          <span className="font-semibold text-gray-700">{fmt(totalCount)}</span> sản phẩm
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-indigo-50 border-b border-indigo-100">
              <th className="text-left px-4 py-3 font-semibold text-indigo-800 whitespace-nowrap">MÃ</th>
              <th className="text-left px-4 py-3 font-semibold text-indigo-800 whitespace-nowrap">MÀU</th>
              <th className="text-left px-4 py-3 font-semibold text-indigo-800 whitespace-nowrap">SIZE</th>
              <th className="text-left px-4 py-3 font-semibold text-indigo-800 whitespace-nowrap">MÃ MÀU SIZE</th>
              <th className="text-right px-4 py-3 font-semibold text-indigo-800 whitespace-nowrap">SỐ LƯỢNG</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((p, idx) => {
              const combined = `${p.ma} ${p.mau} ${p.size}`
              const isHigh = p.count >= 10
              return (
                <tr key={p.key} className={idx % 2 === 0 ? 'bg-white hover:bg-indigo-50/40' : 'bg-gray-50/60 hover:bg-indigo-50/40'}>
                  <td className="px-4 py-2.5 font-mono font-semibold text-indigo-700">
                    <Highlight text={p.ma} term={searchTerm} />
                  </td>
                  <td className="px-4 py-2.5 text-gray-700">
                    <Highlight text={p.mau} term={searchTerm} />
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                      <Highlight text={p.size} term={searchTerm} />
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-600">
                    <Highlight text={combined} term={searchTerm} />
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span className={`font-bold tabular-nums ${isHigh ? 'text-indigo-700' : 'text-gray-800'}`}>
                      {fmt(p.count)}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 text-right">
        Tổng: <span className="font-semibold text-gray-700">{fmt(products.length)}</span> loại ·{' '}
        <span className="font-semibold text-gray-700">{fmt(totalCount)}</span> sản phẩm
      </div>
    </div>
  )
}

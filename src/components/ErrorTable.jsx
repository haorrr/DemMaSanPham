import { useState } from 'react'

const REASON_STYLE = {
  'Không xác định được SIZE': 'bg-red-100 text-red-700',
  'Không xác định được MÃ': 'bg-orange-100 text-orange-700',
  'Không xác định được MÀU': 'bg-yellow-100 text-yellow-700',
  'Không xác định được MÃ và MÀU': 'bg-orange-100 text-orange-700',
}

function reasonStyle(reason) {
  return REASON_STYLE[reason] || 'bg-gray-100 text-gray-600'
}

export default function ErrorTable({ errors, fileWarnings }) {
  const [open, setOpen] = useState(false)

  const totalIssues = errors.length + fileWarnings.length
  if (totalIssues === 0) return null

  return (
    <div className="border border-amber-200 rounded-xl overflow-hidden bg-amber-50">
      {/* Header toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-amber-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="font-semibold text-amber-800 text-sm">
            DỮ LIỆU KHÔNG NHẬN DIỆN ({totalIssues})
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-amber-600 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-amber-200">
          {/* File warnings (missing column, read errors) */}
          {fileWarnings.length > 0 && (
            <div className="px-4 py-3 bg-amber-50 border-b border-amber-200">
              <p className="text-xs font-semibold text-amber-700 mb-2">Cảnh báo file ({fileWarnings.length})</p>
              <ul className="space-y-1">
                {fileWarnings.map((w, i) => (
                  <li key={i} className="text-sm text-amber-800">
                    <span className="font-medium">{w.fileName}</span>: {w.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Parse errors */}
          {errors.length > 0 && (
            <div className="overflow-x-auto scrollbar-thin max-h-72 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-amber-100">
                  <tr>
                    <th className="text-left px-4 py-2 font-semibold text-amber-800 whitespace-nowrap">File</th>
                    <th className="text-left px-4 py-2 font-semibold text-amber-800 whitespace-nowrap">Sheet</th>
                    <th className="text-left px-4 py-2 font-semibold text-amber-800 whitespace-nowrap">Dòng</th>
                    <th className="text-left px-4 py-2 font-semibold text-amber-800 whitespace-nowrap">Nội dung gốc</th>
                    <th className="text-left px-4 py-2 font-semibold text-amber-800 whitespace-nowrap">Lý do lỗi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100 bg-white">
                  {errors.map((e, i) => (
                    <tr key={i} className="hover:bg-amber-50">
                      <td className="px-4 py-2 text-gray-600 max-w-32 truncate" title={e.fileName}>{e.fileName}</td>
                      <td className="px-4 py-2 text-gray-600 whitespace-nowrap">{e.sheetName}</td>
                      <td className="px-4 py-2 text-gray-600 whitespace-nowrap">{e.rowIndex}</td>
                      <td className="px-4 py-2 text-gray-800 font-mono max-w-48" title={e.rawValue}>
                        <span className="truncate block">{e.rawValue}</span>
                      </td>
                      <td className="px-4 py-2">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${reasonStyle(e.reason)}`}>
                          {e.reason}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

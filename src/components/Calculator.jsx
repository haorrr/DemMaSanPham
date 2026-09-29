import { useState, useMemo, useRef, useEffect } from 'react'

function fmt(n) {
  return n.toLocaleString('vi-VN')
}

// Dropdown tìm kiếm để chọn 1 sản phẩm
function ProductPicker({ allProducts, value, onChange, placeholder }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = useMemo(() => {
    if (!query.trim()) return allProducts.slice(0, 50)
    const q = query.toUpperCase().trim()
    return allProducts
      .filter(p => `${p.ma} ${p.mau} ${p.size}`.includes(q))
      .slice(0, 50)
  }, [allProducts, query])

  const selectedProduct = value ? allProducts.find(p => p.key === value) : null

  function select(product) {
    onChange(product.key)
    setQuery('')
    setOpen(false)
  }

  function clear(e) {
    e.stopPropagation()
    onChange(null)
    setQuery('')
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger / Input */}
      <div
        onClick={() => { setOpen(o => !o); }}
        className={[
          'flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer bg-white min-h-[40px]',
          open ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-300 hover:border-indigo-400',
        ].join(' ')}
      >
        {selectedProduct ? (
          <>
            <span className="flex-1 text-sm font-medium text-gray-800 truncate">
              <span className="text-indigo-700 font-mono">{selectedProduct.ma}</span>
              {' '}{selectedProduct.mau}{' '}
              <span className="inline-block px-1.5 py-0.5 bg-gray-100 rounded text-xs">{selectedProduct.size}</span>
            </span>
            <button onClick={clear} className="text-gray-400 hover:text-red-500 flex-shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </>
        ) : (
          <span className="text-gray-400 text-sm flex-1">{placeholder}</span>
        )}
        <svg className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
          {/* Search inside dropdown */}
          <div className="p-2 border-b border-gray-100">
            <input
              autoFocus
              type="text"
              placeholder="Tìm mã, màu, size..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onClick={e => e.stopPropagation()}
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <ul className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <li className="px-3 py-3 text-sm text-gray-400 text-center">Không tìm thấy</li>
            ) : (
              filtered.map(p => (
                <li
                  key={p.key}
                  onClick={() => select(p)}
                  className={[
                    'flex items-center justify-between px-3 py-2 cursor-pointer text-sm hover:bg-indigo-50',
                    value === p.key ? 'bg-indigo-50 font-semibold' : '',
                  ].join(' ')}
                >
                  <span>
                    <span className="text-indigo-700 font-mono font-semibold">{p.ma}</span>
                    {' '}
                    <span className="text-gray-700">{p.mau}</span>
                    {' '}
                    <span className="inline-block px-1.5 py-0.5 bg-gray-100 rounded text-xs text-gray-600">{p.size}</span>
                  </span>
                  <span className="font-bold text-indigo-700 tabular-nums ml-2">{fmt(p.count)}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

// Số slot tối đa
const MAX_SLOTS = 6

export default function Calculator({ allProducts }) {
  // Mảng các key đã chọn, mỗi phần tử là key hoặc null
  const [slots, setSlots] = useState([null, null])

  const selectedProducts = useMemo(() =>
    slots
      .map(key => key ? allProducts.find(p => p.key === key) : null)
      .filter(Boolean),
    [slots, allProducts]
  )

  const total = selectedProducts.reduce((s, p) => s + p.count, 0)

  function setSlot(idx, key) {
    setSlots(prev => {
      const next = [...prev]
      next[idx] = key
      return next
    })
  }

  function addSlot() {
    if (slots.length < MAX_SLOTS) setSlots(prev => [...prev, null])
  }

  function removeSlot(idx) {
    setSlots(prev => {
      if (prev.length <= 2) {
        // Không xóa slot, chỉ clear giá trị
        const next = [...prev]
        next[idx] = null
        return next
      }
      return prev.filter((_, i) => i !== idx)
    })
  }

  function reset() {
    setSlots([null, null])
  }

  async function copyResult() {
    const lines = selectedProducts.map(p => `${p.ma} ${p.mau} ${p.size}: ${fmt(p.count)}`).join('\n')
    const text = `${lines}\n─────────────\nTổng: ${fmt(total)}`
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.cssText = 'position:fixed;opacity:0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    alert('Đã copy kết quả!')
  }

  const hasAnySelection = selectedProducts.length > 0

  return (
    <div className="bg-white border border-indigo-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-indigo-50 border-b border-indigo-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="font-semibold text-indigo-800 text-sm">BẢNG TÍNH NHANH</span>
          <span className="text-xs text-indigo-500">Chọn các mã để cộng tổng số lượng</span>
        </div>
        {hasAnySelection && (
          <button onClick={reset} className="text-xs text-red-500 hover:text-red-700 font-medium">
            Xóa tất cả
          </button>
        )}
      </div>

      <div className="p-4">
        {/* Slots */}
        <div className="space-y-2">
          {slots.map((key, idx) => (
            <div key={idx} className="flex items-center gap-2">
              {/* Label */}
              <span className="w-6 text-center text-xs font-bold text-indigo-400 flex-shrink-0">
                {idx + 1}
              </span>

              {/* Picker */}
              <div className="flex-1">
                <ProductPicker
                  allProducts={allProducts}
                  value={key}
                  onChange={k => setSlot(idx, k)}
                  placeholder={`Chọn sản phẩm ${idx + 1}...`}
                />
              </div>

              {/* Count badge */}
              <div className="w-20 flex-shrink-0">
                {key && allProducts.find(p => p.key === key) ? (
                  <div className="text-right">
                    <span className="text-lg font-bold text-indigo-700 tabular-nums">
                      {fmt(allProducts.find(p => p.key === key).count)}
                    </span>
                  </div>
                ) : (
                  <div className="text-right text-gray-300 text-lg font-bold">—</div>
                )}
              </div>

              {/* Remove / plus sign between rows */}
              <button
                onClick={() => removeSlot(idx)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors flex-shrink-0"
                title="Xóa dòng này"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {/* Add slot button */}
        {slots.length < MAX_SLOTS && (
          <button
            onClick={addSlot}
            className="mt-2 ml-8 flex items-center gap-1 text-sm text-indigo-500 hover:text-indigo-700 font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Thêm dòng
          </button>
        )}

        {/* Divider + Total */}
        {hasAnySelection && (
          <div className="mt-4 pt-4 border-t-2 border-dashed border-indigo-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Summary of selected */}
                <div className="flex flex-wrap gap-1.5">
                  {selectedProducts.map((p, i) => (
                    <span key={p.key}>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 border border-indigo-200 rounded-full text-xs font-medium text-indigo-700">
                        <span className="font-mono">{p.ma}</span> {p.mau}
                        <span className="px-1 py-0.5 bg-indigo-100 rounded text-indigo-600">{p.size}</span>
                        <span className="font-bold">{fmt(p.count)}</span>
                      </span>
                      {i < selectedProducts.length - 1 && (
                        <span className="text-gray-400 mx-0.5 text-xs font-bold">+</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                {/* Total */}
                <div className="text-right">
                  <div className="text-xs text-gray-500 font-medium">TỔNG</div>
                  <div className="text-3xl font-black text-indigo-700 tabular-nums leading-tight">
                    {fmt(total)}
                  </div>
                </div>

                {/* Copy */}
                <button
                  onClick={copyResult}
                  className="w-9 h-9 rounded-lg bg-indigo-100 hover:bg-indigo-200 flex items-center justify-center text-indigo-600 transition-colors"
                  title="Copy kết quả"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty hint */}
        {!hasAnySelection && (
          <p className="mt-3 ml-8 text-xs text-gray-400">
            Chọn sản phẩm ở các ô trên để xem tổng số lượng cộng lại
          </p>
        )}
      </div>
    </div>
  )
}

import { useMemo, useState, useRef, useEffect } from 'react'

const SORT_OPTIONS = [
  { value: 'mau_asc',    label: 'Màu A → Z' },
  { value: 'mau_desc',   label: 'Màu Z → A' },
  { value: 'count_desc', label: 'Số lượng ↓ (cao → thấp)' },
  { value: 'count_asc',  label: 'Số lượng ↑ (thấp → cao)' },
  { value: 'ma_asc',     label: 'Mã A → Z' },
  { value: 'ma_desc',    label: 'Mã Z → A' },
]

/**
 * Combobox: vừa gõ tìm vừa chọn từ dropdown.
 * - value: giá trị đang lọc (exact match)
 * - options: danh sách gợi ý
 * - placeholder: text khi chưa chọn
 * - onChange(val): val = '' để clear, hoặc chuỗi exact
 */
function Combobox({ value, options, placeholder, onChange }) {
  const [input, setInput] = useState(value)
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Sync input khi value bị reset từ ngoài (nút "Xóa bộ lọc")
  useEffect(() => { setInput(value) }, [value])

  // Đóng khi click ra ngoài
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = useMemo(() => {
    const q = input.toUpperCase().trim()
    if (!q) return options
    return options.filter(o => o.toUpperCase().includes(q))
  }, [options, input])

  function handleInput(e) {
    const val = e.target.value
    setInput(val)
    setOpen(true)
    // Nếu xóa hết → clear filter
    if (val === '') onChange('')
  }

  function select(opt) {
    setInput(opt)
    onChange(opt)
    setOpen(false)
  }

  function handleBlur() {
    // Sau blur: nếu input không khớp exact option nào → dùng như free-text filter
    // (gõ tự do cũng lọc được)
    setTimeout(() => {
      if (!ref.current?.contains(document.activeElement)) {
        setOpen(false)
        onChange(input.trim().toUpperCase())
      }
    }, 150)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      onChange(input.trim().toUpperCase())
      setOpen(false)
    }
    if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  function clear(e) {
    e.stopPropagation()
    setInput('')
    onChange('')
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative flex-1 min-w-32">
      <div className={`flex items-center border rounded-lg bg-white transition-all ${open ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-300'}`}>
        <input
          type="text"
          value={input}
          placeholder={placeholder}
          onChange={handleInput}
          onFocus={() => setOpen(true)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="flex-1 px-3 py-2 text-sm bg-transparent focus:outline-none min-w-0"
        />
        {input ? (
          <button onMouseDown={clear} className="px-2 text-gray-400 hover:text-red-400">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ) : (
          <button onMouseDown={() => setOpen(o => !o)} className="px-2 text-gray-400">
            <svg className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>

      {open && filtered.length > 0 && (
        <ul className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-52 overflow-y-auto">
          {filtered.map(opt => (
            <li
              key={opt}
              onMouseDown={() => select(opt)}
              className={`px-3 py-2 text-sm cursor-pointer hover:bg-indigo-50 ${value === opt ? 'bg-indigo-50 font-semibold text-indigo-700' : 'text-gray-700'}`}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function FilterBar({ allProducts, filters, onFiltersChange, filteredCount }) {
  const uniqueMa = useMemo(() =>
    [...new Set(allProducts.map(p => p.ma))].sort(), [allProducts])

  const uniqueMau = useMemo(() =>
    [...new Set(allProducts.map(p => p.mau))].sort((a, b) => a.localeCompare(b, 'vi')), [allProducts])

  const uniqueSize = useMemo(() => {
    const ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '2XL', '3XL', '4XL', '5XL', '6XL', '7XL']
    const sizes = [...new Set(allProducts.map(p => p.size))]
    return sizes.sort((a, b) => {
      const ia = ORDER.indexOf(a), ib = ORDER.indexOf(b)
      if (ia === -1 && ib === -1) return a.localeCompare(b)
      if (ia === -1) return 1
      if (ib === -1) return -1
      return ia - ib
    })
  }, [allProducts])

  const hasActiveFilters = filters.search || filters.ma || filters.mau || filters.size

  function set(key, value) {
    onFiltersChange({ ...filters, [key]: value })
  }

  function reset() {
    onFiltersChange({ search: '', ma: '', mau: '', size: '', sort: filters.sort })
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Tìm theo mã, màu, size..."
          value={filters.search}
          onChange={e => set('search', e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        {filters.search && (
          <button onClick={() => set('search', '')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap gap-2 items-center">
        <Combobox
          value={filters.ma}
          options={uniqueMa}
          placeholder="Lọc theo mã..."
          onChange={v => set('ma', v)}
        />
        <Combobox
          value={filters.mau}
          options={uniqueMau}
          placeholder="Lọc theo màu..."
          onChange={v => set('mau', v)}
        />
        <Combobox
          value={filters.size}
          options={uniqueSize}
          placeholder="Lọc theo size..."
          onChange={v => set('size', v)}
        />

        {/* Sort — giữ nguyên select vì không cần gõ */}
        <select
          value={filters.sort}
          onChange={e => set('sort', e.target.value)}
          className="flex-1 min-w-44 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
        >
          {SORT_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            onClick={reset}
            className="px-3 py-2 text-sm text-red-600 hover:text-red-800 font-medium border border-red-200 rounded-lg hover:bg-red-50 transition-colors whitespace-nowrap"
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Result count */}
      <p className="text-xs text-gray-500">
        Hiển thị <span className="font-semibold text-gray-700">{filteredCount}</span>
        {' '}/ <span className="font-semibold text-gray-700">{allProducts.length}</span> loại sản phẩm
      </p>
    </div>
  )
}

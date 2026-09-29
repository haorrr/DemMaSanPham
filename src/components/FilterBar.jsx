import { useMemo } from 'react'

const SORT_OPTIONS = [
  { value: 'count_desc', label: 'Số lượng ↓ (cao → thấp)' },
  { value: 'count_asc', label: 'Số lượng ↑ (thấp → cao)' },
  { value: 'ma_asc', label: 'Mã A → Z' },
  { value: 'ma_desc', label: 'Mã Z → A' },
  { value: 'mau_asc', label: 'Màu A → Z' },
  { value: 'mau_desc', label: 'Màu Z → A' },
]

export default function FilterBar({ allProducts, filters, onFiltersChange, filteredCount }) {
  const uniqueMa = useMemo(() =>
    [...new Set(allProducts.map(p => p.ma))].sort(), [allProducts])

  const uniqueMau = useMemo(() =>
    [...new Set(allProducts.map(p => p.mau))].sort(), [allProducts])

  const uniqueSize = useMemo(() => {
    const ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '2XL', '3XL', '4XL', '5XL', '6XL', '7XL']
    const sizes = [...new Set(allProducts.map(p => p.size))]
    return sizes.sort((a, b) => {
      const ia = ORDER.indexOf(a)
      const ib = ORDER.indexOf(b)
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
          <button
            onClick={() => set('search', '')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Lọc MÃ */}
        <select
          value={filters.ma}
          onChange={e => set('ma', e.target.value)}
          className="flex-1 min-w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
        >
          <option value="">Tất cả mã</option>
          {uniqueMa.map(ma => (
            <option key={ma} value={ma}>{ma}</option>
          ))}
        </select>

        {/* Lọc MÀU */}
        <select
          value={filters.mau}
          onChange={e => set('mau', e.target.value)}
          className="flex-1 min-w-36 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
        >
          <option value="">Tất cả màu</option>
          {uniqueMau.map(mau => (
            <option key={mau} value={mau}>{mau}</option>
          ))}
        </select>

        {/* Lọc SIZE */}
        <select
          value={filters.size}
          onChange={e => set('size', e.target.value)}
          className="flex-1 min-w-28 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
        >
          <option value="">Tất cả size</option>
          {uniqueSize.map(size => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={filters.sort}
          onChange={e => set('sort', e.target.value)}
          className="flex-1 min-w-44 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
        >
          {SORT_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {/* Reset */}
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

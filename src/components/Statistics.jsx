function fmt(n) {
  return n.toLocaleString('vi-VN')
}

const CARDS = [
  {
    key: 'totalFiles',
    label: 'Tổng file đã đọc',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    color: 'text-indigo-600 bg-indigo-100',
  },
  {
    key: 'totalRows',
    label: 'Tổng dòng dữ liệu',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ),
    color: 'text-blue-600 bg-blue-100',
  },
  {
    key: 'totalProducts',
    label: 'Tổng sản phẩm',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
      </svg>
    ),
    color: 'text-violet-600 bg-violet-100',
  },
  {
    key: 'uniqueTypes',
    label: 'Loại sản phẩm',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
    color: 'text-emerald-600 bg-emerald-100',
  },
]

export default function Statistics({ stats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {CARDS.map(card => (
        <div key={card.key} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{fmt(stats[card.key] ?? 0)}</p>
            </div>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${card.color}`}>
              {card.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

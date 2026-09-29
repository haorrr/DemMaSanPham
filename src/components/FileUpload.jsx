import { useRef, useState } from 'react'

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function FileUpload({ files, onFilesAdd, onFileRemove, onFilesReset, processing }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  function handleDragOver(e) {
    e.preventDefault()
    e.stopPropagation()
    setDragging(true)
  }

  function handleDragLeave(e) {
    e.preventDefault()
    e.stopPropagation()
    setDragging(false)
  }

  function handleDrop(e) {
    e.preventDefault()
    e.stopPropagation()
    setDragging(false)
    const dropped = Array.from(e.dataTransfer.files).filter(
      f => f.name.endsWith('.xlsx') || f.name.endsWith('.xls')
    )
    if (dropped.length > 0) onFilesAdd(dropped)
  }

  function handleInputChange(e) {
    const selected = Array.from(e.target.files || [])
    if (selected.length > 0) onFilesAdd(selected)
    // reset input so same file can be re-added after removal
    e.target.value = ''
  }

  function handleZoneClick() {
    if (!processing.active) inputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onClick={handleZoneClick}
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={[
          'border-2 border-dashed rounded-xl p-10 text-center transition-all duration-150 select-none',
          processing.active
            ? 'cursor-not-allowed border-gray-300 bg-gray-50'
            : dragging
              ? 'cursor-copy border-indigo-500 bg-indigo-50'
              : 'cursor-pointer border-gray-300 bg-white hover:border-indigo-400 hover:bg-indigo-50',
        ].join(' ')}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleInputChange}
          disabled={processing.active}
        />

        {processing.active ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-indigo-700 font-semibold text-lg">
              Đang xử lý {processing.current}/{processing.total} file...
            </p>
            <p className="text-gray-500 text-sm">Vui lòng chờ</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center">
              <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <p className="text-gray-700 font-semibold text-lg">
                Kéo thả file Excel vào đây
              </p>
              <p className="text-gray-500 text-sm mt-1">
                hoặc <span className="text-indigo-600 font-medium">nhấn để chọn file</span>
              </p>
            </div>
            <p className="text-gray-400 text-xs">Hỗ trợ .xlsx và .xls · Có thể chọn nhiều file</p>
          </div>
        )}
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
            <span className="text-sm font-semibold text-gray-700">
              {files.length} file đã chọn
            </span>
            <button
              onClick={onFilesReset}
              disabled={processing.active}
              className="text-sm text-red-500 hover:text-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Xóa tất cả
            </button>
          </div>
          <ul className="divide-y divide-gray-100 max-h-56 overflow-y-auto scrollbar-thin">
            {files.map((file, idx) => (
              <li key={`${file.name}-${idx}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd"
                      d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                      clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                  <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                </div>
                <button
                  onClick={() => onFileRemove(idx)}
                  disabled={processing.active}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                  title="Xóa file này"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

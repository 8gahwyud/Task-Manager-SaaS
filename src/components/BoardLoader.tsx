'use client'

export function BoardLoader() {
  return (
    <div className="h-full flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-accent mb-4"></div>
        <p className="text-gray-600">Загрузка доски...</p>
      </div>
    </div>
  )
}


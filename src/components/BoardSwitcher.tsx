'use client'

import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { BoardLoader } from './BoardLoader'

export function BoardSwitcher({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const currentBoardIdRef = useRef<string | null>(null)
  const boardId = searchParams?.get('board')

  useEffect(() => {
    if (boardId && boardId !== currentBoardIdRef.current) {
      setIsLoading(true)
      currentBoardIdRef.current = boardId
      
      // Убираем лоадер после небольшой задержки (когда компонент обновится)
      const timer = setTimeout(() => {
        setIsLoading(false)
      }, 200)
      
      return () => clearTimeout(timer)
    }
  }, [boardId])

  if (isLoading) {
    return <BoardLoader />
  }

  return <>{children}</>
}


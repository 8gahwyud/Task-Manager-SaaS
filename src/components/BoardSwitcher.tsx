'use client'

import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { BoardLoader } from './BoardLoader'
import { useBoardLoading } from '@/contexts/BoardLoadingContext'

export function BoardSwitcher({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams()
  const { isLoading, setLoading } = useBoardLoading()
  const currentBoardIdRef = useRef<string | null>(null)
  const boardId = searchParams?.get('board')

  useEffect(() => {
    if (boardId && boardId !== currentBoardIdRef.current) {
      currentBoardIdRef.current = boardId
      
      // Убираем лоадер когда компонент загрузился
      const timer = setTimeout(() => {
        setLoading(false)
      }, 100)
      
      return () => clearTimeout(timer)
    } else if (!boardId) {
      currentBoardIdRef.current = null
      setLoading(false)
    }
  }, [boardId, setLoading])

  if (isLoading) {
    return <BoardLoader />
  }

  return <>{children}</>
}


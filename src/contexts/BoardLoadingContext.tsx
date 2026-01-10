'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface BoardLoadingContextType {
  isLoading: boolean
  setLoading: (loading: boolean) => void
}

const BoardLoadingContext = createContext<BoardLoadingContextType | undefined>(undefined)

export function BoardLoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false)

  return (
    <BoardLoadingContext.Provider value={{ isLoading, setLoading: setIsLoading }}>
      {children}
    </BoardLoadingContext.Provider>
  )
}

export function useBoardLoading() {
  const context = useContext(BoardLoadingContext)
  if (!context) {
    throw new Error('useBoardLoading must be used within BoardLoadingProvider')
  }
  return context
}


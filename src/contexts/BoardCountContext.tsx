'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface BoardCountContextType {
  taskCounts: Record<string, number>
  updateTaskCount: (boardId: string, count: number) => void
}

const BoardCountContext = createContext<BoardCountContextType | undefined>(undefined)

export function BoardCountProvider({ children }: { children: ReactNode }) {
  const [taskCounts, setTaskCounts] = useState<Record<string, number>>({})

  const updateTaskCount = (boardId: string, count: number) => {
    setTaskCounts((prev) => ({
      ...prev,
      [boardId]: count,
    }))
  }

  return (
    <BoardCountContext.Provider value={{ taskCounts, updateTaskCount }}>
      {children}
    </BoardCountContext.Provider>
  )
}

export function useBoardCount() {
  const context = useContext(BoardCountContext)
  if (context === undefined) {
    throw new Error('useBoardCount must be used within a BoardCountProvider')
  }
  return context
}


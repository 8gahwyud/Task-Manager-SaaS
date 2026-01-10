import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const taskSchema = z.object({
  title: z.string().min(1, 'Название обязательно'),
  description: z.string().optional(),
  boardId: z.string().min(1, 'Доска обязательна'),
  columnId: z.string().min(1, 'Столбец обязателен'),
  assigneeId: z.string().optional().nullable(),
  deadline: z.string().optional().nullable(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
})

// Создать задачу
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const body = await request.json()
    const data = taskSchema.parse(body)

    // Проверяем доступ к доске
    const board = await prisma.board.findFirst({
      where: {
        id: data.boardId,
        project: {
          OR: [
            { ownerId: session.user.id },
            { members: { some: { userId: session.user.id } } },
          ],
        },
      },
      include: {
        project: { select: { id: true } },
      },
    })

    if (!board) {
      return NextResponse.json(
        { error: 'Доска не найдена или нет доступа' },
        { status: 404 }
      )
    }

    // Проверяем, что столбец принадлежит этой доске
    const column = await prisma.boardColumn.findFirst({
      where: {
        id: data.columnId,
        boardId: data.boardId,
      },
    })

    if (!column) {
      return NextResponse.json(
        { error: 'Столбец не найден или не принадлежит этой доске' },
        { status: 404 }
      )
    }

    // Получаем максимальную позицию для столбца
    const maxPosition = await prisma.task.aggregate({
      where: {
        columnId: data.columnId,
      },
      _max: { position: true },
    })

    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        boardId: data.boardId,
        columnId: data.columnId,
        assigneeId: data.assigneeId || null,
        deadline: data.deadline ? new Date(data.deadline) : null,
        priority: data.priority,
        position: (maxPosition._max.position ?? -1) + 1,
        creatorId: session.user.id,
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
        column: {
          select: { id: true, name: true, color: true },
        },
        board: {
          select: { id: true, name: true, projectId: true },
        },
      },
    })

    return NextResponse.json(task)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    console.error('Task creation error:', error)
    return NextResponse.json(
      { error: 'Ошибка при создании задачи' },
      { status: 500 }
    )
  }
}




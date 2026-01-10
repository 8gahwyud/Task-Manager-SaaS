import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const boardSchema = z.object({
  name: z.string().min(1, 'Название обязательно'),
  description: z.string().optional(),
  backgroundColor: z.string().optional(),
  backgroundImage: z.string().optional(),
})

// Получить все доски проекта
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id } } },
        ],
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Проект не найден или нет доступа' },
        { status: 404 }
      )
    }

    const boards = await prisma.board.findMany({
      where: { projectId: params.id },
      include: {
        columns: {
          orderBy: { position: 'asc' },
        },
        _count: {
          select: { tasks: true },
        },
      },
      orderBy: { position: 'asc' },
    })

    return NextResponse.json(boards)
  } catch {
    return NextResponse.json(
      { error: 'Ошибка при получении досок' },
      { status: 500 }
    )
  }
}

// Создать доску
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        OR: [
          { ownerId: session.user.id },
          {
            members: {
              some: {
                userId: session.user.id,
                role: { in: ['owner', 'admin'] },
              },
            },
          },
        ],
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Проект не найден или нет доступа' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const data = boardSchema.parse(body)

    // Получаем максимальную позицию
    const maxPosition = await prisma.board.aggregate({
      where: { projectId: params.id },
      _max: { position: true },
    })

    const board = await prisma.board.create({
      data: {
        ...data,
        projectId: params.id,
        position: (maxPosition._max.position ?? -1) + 1,
      },
      include: {
        columns: true,
      },
    })

    // Создаём дефолтные столбцы
    const defaultColumns = [
      { name: 'To Do', color: '#8993a4', position: 0 },
      { name: 'In Progress', color: '#0052cc', position: 1 },
      { name: 'Review', color: '#8777d9', position: 2 },
      { name: 'Done', color: '#36b37e', position: 3 },
    ]

    await prisma.boardColumn.createMany({
      data: defaultColumns.map((col) => ({
        ...col,
        boardId: board.id,
      })),
    })

    const boardWithColumns = await prisma.board.findUnique({
      where: { id: board.id },
      include: {
        columns: {
          orderBy: { position: 'asc' },
        },
      },
    })

    return NextResponse.json(boardWithColumns)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Ошибка при создании доски' },
      { status: 500 }
    )
  }
}


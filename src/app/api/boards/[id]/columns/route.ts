import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const columnSchema = z.object({
  name: z.string().min(1, 'Название обязательно'),
  color: z.string().default('#8993a4'),
})

// Получить столбцы доски
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const board = await prisma.board.findFirst({
      where: {
        id: params.id,
        project: {
          OR: [
            { ownerId: session.user.id },
            { members: { some: { userId: session.user.id } } },
          ],
        },
      },
      include: {
        columns: {
          orderBy: { position: 'asc' },
          include: {
            _count: { select: { tasks: true } },
          },
        },
      },
    })

    if (!board) {
      return NextResponse.json(
        { error: 'Доска не найдена или нет доступа' },
        { status: 404 }
      )
    }

    return NextResponse.json(board.columns)
  } catch {
    return NextResponse.json(
      { error: 'Ошибка при получении столбцов' },
      { status: 500 }
    )
  }
}

// Создать столбец
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const board = await prisma.board.findFirst({
      where: {
        id: params.id,
        project: {
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
      },
    })

    if (!board) {
      return NextResponse.json(
        { error: 'Доска не найдена или нет доступа' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const data = columnSchema.parse(body)

    // Получаем максимальную позицию
    const maxPosition = await prisma.boardColumn.aggregate({
      where: { boardId: params.id },
      _max: { position: true },
    })

    const column = await prisma.boardColumn.create({
      data: {
        ...data,
        boardId: params.id,
        position: (maxPosition._max.position ?? -1) + 1,
      },
    })

    return NextResponse.json(column)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Ошибка при создании столбца' },
      { status: 500 }
    )
  }
}


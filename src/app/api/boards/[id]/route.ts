import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  backgroundColor: z.string().optional().nullable(),
  backgroundImage: z.string().optional().nullable(),
  position: z.number().optional(),
})

// Получить доску
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
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, email: true } },
            creator: { select: { id: true, name: true, email: true } },
          },
          orderBy: { position: 'asc' },
        },
        project: { select: { id: true, name: true } },
      },
    })

    if (!board) {
      return NextResponse.json(
        { error: 'Доска не найдена или нет доступа' },
        { status: 404 }
      )
    }

    return NextResponse.json(board)
  } catch {
    return NextResponse.json(
      { error: 'Ошибка при получении доски' },
      { status: 500 }
    )
  }
}

// Обновить доску
export async function PATCH(
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
    const data = updateSchema.parse(body)

    const updated = await prisma.board.update({
      where: { id: params.id },
      data,
      include: {
        columns: {
          orderBy: { position: 'asc' },
        },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Ошибка при обновлении доски' },
      { status: 500 }
    )
  }
}

// Удалить доску
export async function DELETE(
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

    await prisma.board.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Ошибка при удалении доски' },
      { status: 500 }
    )
  }
}


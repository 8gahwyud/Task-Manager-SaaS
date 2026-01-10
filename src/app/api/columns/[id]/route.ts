import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  color: z.string().optional(),
  position: z.number().optional(),
})

// Обновить столбец
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const column = await prisma.boardColumn.findFirst({
      where: {
        id: params.id,
        board: {
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
      },
    })

    if (!column) {
      return NextResponse.json(
        { error: 'Столбец не найден или нет доступа' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const data = updateSchema.parse(body)

    const updated = await prisma.boardColumn.update({
      where: { id: params.id },
      data,
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
      { error: 'Ошибка при обновлении столбца' },
      { status: 500 }
    )
  }
}

// Удалить столбец
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const column = await prisma.boardColumn.findFirst({
      where: {
        id: params.id,
        board: {
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
      },
      include: {
        _count: { select: { tasks: true } },
      },
    })

    if (!column) {
      return NextResponse.json(
        { error: 'Столбец не найден или нет доступа' },
        { status: 404 }
      )
    }

    // Если есть задачи - не удаляем
    if (column._count.tasks > 0) {
      return NextResponse.json(
        { error: 'Нельзя удалить столбец с задачами. Переместите задачи в другой столбец.' },
        { status: 400 }
      )
    }

    await prisma.boardColumn.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Ошибка при удалении столбца' },
      { status: 500 }
    )
  }
}


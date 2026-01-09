import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  deadline: z.string().optional().nullable(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'done']).optional(),
  position: z.number().optional(),
})

// Получить задачу
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const task = await prisma.task.findFirst({
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
        assignee: {
          select: { id: true, name: true, email: true },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
        project: {
          select: { id: true, name: true },
        },
      },
    })

    if (!task) {
      return NextResponse.json({ error: 'Задача не найдена' }, { status: 404 })
    }

    return NextResponse.json(task)
  } catch {
    return NextResponse.json(
      { error: 'Ошибка при получении задачи' },
      { status: 500 }
    )
  }
}

// Обновить задачу
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const task = await prisma.task.findFirst({
      where: {
        id: params.id,
        project: {
          OR: [
            { ownerId: session.user.id },
            { members: { some: { userId: session.user.id } } },
          ],
        },
      },
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Задача не найдена или нет доступа' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const data = updateSchema.parse(body)

    // Если меняется статус, обновляем позицию
    let position = data.position
    if (data.status && data.status !== task.status && position === undefined) {
      const maxPosition = await prisma.task.aggregate({
        where: {
          projectId: task.projectId,
          status: data.status,
        },
        _max: { position: true },
      })
      position = (maxPosition._max.position ?? -1) + 1
    }

    const updated = await prisma.task.update({
      where: { id: params.id },
      data: {
        ...data,
        deadline: data.deadline === null ? null : data.deadline ? new Date(data.deadline) : undefined,
        position,
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
        creator: {
          select: { id: true, name: true, email: true },
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
      { error: 'Ошибка при обновлении задачи' },
      { status: 500 }
    )
  }
}

// Удалить задачу
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const task = await prisma.task.findFirst({
      where: {
        id: params.id,
        project: {
          OR: [
            { ownerId: session.user.id },
            { members: { some: { userId: session.user.id } } },
          ],
        },
      },
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Задача не найдена или нет доступа' },
        { status: 404 }
      )
    }

    await prisma.task.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Ошибка при удалении задачи' },
      { status: 500 }
    )
  }
}



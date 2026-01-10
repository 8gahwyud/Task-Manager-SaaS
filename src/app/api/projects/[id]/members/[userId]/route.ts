import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Удалить участника из проекта
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; userId: string } }
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

    // Нельзя удалить владельца
    if (project.ownerId === params.userId) {
      return NextResponse.json(
        { error: 'Нельзя удалить владельца проекта' },
        { status: 400 }
      )
    }

    // Удаляем участника
    await prisma.projectMember.deleteMany({
      where: {
        projectId: params.id,
        userId: params.userId,
      },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Ошибка при удалении участника' },
      { status: 500 }
    )
  }
}


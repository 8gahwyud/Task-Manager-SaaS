import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const inviteSchema = z.object({
  email: z.string().email('Некорректный email'),
})

// Пригласить участника
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
    const { email } = inviteSchema.parse(body)

    // Проверяем, существует ли пользователь
    const invitedUser = await prisma.user.findUnique({
      where: { email },
    })

    if (!invitedUser) {
      return NextResponse.json(
        { error: 'Пользователь с таким email не существует' },
        { status: 404 }
      )
    }

    // Проверяем, не является ли уже участником
    const existingMember = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: invitedUser.id,
          projectId: params.id,
        },
      },
    })

    if (existingMember) {
      return NextResponse.json(
        { error: 'Пользователь уже является участником проекта' },
        { status: 400 }
      )
    }

    // Добавляем пользователя в проект
    const member = await prisma.projectMember.create({
      data: {
        userId: invitedUser.id,
        projectId: params.id,
        role: 'member',
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    return NextResponse.json({
      message: 'Участник добавлен',
      member,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Ошибка при приглашении' },
      { status: 500 }
    )
  }
}




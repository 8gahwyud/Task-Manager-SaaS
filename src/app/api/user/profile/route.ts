import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Минимум 2 символа').optional(),
  avatarUrl: z
    .string()
    .refine(
      (val) => !val || val.startsWith('http') || val.startsWith('data:image'),
      'Должен быть валидный URL или base64 data URL'
    )
    .optional()
    .nullable(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, 'Минимум 6 символов').optional(),
})

// Получить профиль
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch {
    return NextResponse.json(
      { error: 'Ошибка при получении профиля' },
      { status: 500 }
    )
  }
}

// Обновить профиль
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const body = await request.json()
    const data = updateProfileSchema.parse(body)

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
    }

    // Если меняется пароль - проверяем текущий
    if (data.newPassword) {
      if (!data.currentPassword) {
        return NextResponse.json(
          { error: 'Текущий пароль обязателен' },
          { status: 400 }
        )
      }

      const isValid = await bcrypt.compare(data.currentPassword, user.password)
      if (!isValid) {
        return NextResponse.json(
          { error: 'Неверный текущий пароль' },
          { status: 400 }
        )
      }

      // Хешируем новый пароль
      data.newPassword = await bcrypt.hash(data.newPassword, 12)
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
        ...(data.newPassword && { password: data.newPassword }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
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
      { error: 'Ошибка при обновлении профиля' },
      { status: 500 }
    )
  }
}


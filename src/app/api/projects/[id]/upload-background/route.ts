import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      select: { ownerId: true },
    })

    if (!project) {
      return NextResponse.json({ error: 'Проект не найден' }, { status: 404 })
    }

    if (project.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Нет доступа к проекту' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'Файл не загружен' }, { status: 400 })
    }

    // Проверяем тип файла
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Файл должен быть изображением' }, { status: 400 })
    }

    // Проверяем размер (макс 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Размер файла не должен превышать 5MB' }, { status: 400 })
    }

    // Конвертируем файл в base64
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString('base64')
    const dataUrl = `data:${file.type};base64,${base64}`

    // Обновляем фон проекта
    const updatedProject = await prisma.project.update({
      where: { id: params.id },
      data: { backgroundImage: dataUrl },
      select: {
        id: true,
        name: true,
        description: true,
        backgroundImage: true,
        backgroundColor: true,
      },
    })

    return NextResponse.json(updatedProject)
  } catch (error) {
    console.error('Background upload error:', error)
    return NextResponse.json(
      { error: 'Ошибка при загрузке фона' },
      { status: 500 }
    )
  }
}


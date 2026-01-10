import { getServerSession } from 'next-auth'
import { notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { KanbanBoard } from '@/components/KanbanBoard'
import { ProjectHeader } from '@/components/ProjectHeader'
import { BoardSelector } from '@/components/BoardSelector'
import { BoardSwitcher } from '@/components/BoardSwitcher'
import { BoardLoadingProvider } from '@/contexts/BoardLoadingContext'
import { BoardCountProvider } from '@/contexts/BoardCountContext'

interface Props {
  params: { id: string }
  searchParams: { board?: string }
}

export default async function ProjectPage({ params, searchParams }: Props) {
  const session = await getServerSession(authOptions)

  const project = await prisma.project.findFirst({
    where: {
      id: params.id,
      OR: [
        { ownerId: session!.user.id },
        { members: { some: { userId: session!.user.id } } },
      ],
    },
    include: {
      owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
      },
      boards: {
        include: {
          columns: {
            orderBy: { position: 'asc' },
          },
          tasks: {
            include: {
              assignee: { select: { id: true, name: true, email: true } },
              creator: { select: { id: true, name: true, email: true } },
            },
            orderBy: { position: 'asc' },
          },
          _count: { select: { tasks: true } },
        },
        orderBy: { position: 'asc' },
      },
    },
  })

  if (!project) {
    notFound()
  }

  const members = project.members.map((m) => m.user)
  const isOwner = project.ownerId === session!.user.id
  
  // Выбираем доску из query параметра или первую
  const selectedBoardId = searchParams?.board || project.boards[0]?.id
  const board = project.boards.find((b) => b.id === selectedBoardId) || project.boards[0]

  // Если нет досок - показываем сообщение
  if (!board) {
    return (
      <div className="h-screen flex flex-col">
        <ProjectHeader
          project={{
            id: project.id,
            name: project.name,
            description: project.description,
          }}
          members={members}
          isOwner={isOwner}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 mb-4">У проекта пока нет досок.</p>
            {isOwner && (
              <p className="text-sm text-gray-500">
                Создайте доску через кнопку ниже или в настройках проекта.
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <BoardLoadingProvider>
      <BoardCountProvider>
        <div className="flex flex-col overflow-hidden w-full" style={{ height: '100vh' }}>
        <div className="flex-shrink-0 bg-white border-b border-gray-200 overflow-x-hidden w-full">
          <ProjectHeader
            project={{
              id: project.id,
              name: project.name,
              description: project.description,
            }}
            members={members}
            isOwner={isOwner}
          />
          <BoardSelector
            projectId={project.id}
            boards={project.boards}
            currentBoardId={board.id}
            isOwner={isOwner}
          />
        </div>
        <div className="flex-1 min-h-0 overflow-hidden relative w-full">
          <BoardSwitcher>
            <KanbanBoard
              boardId={board.id}
              projectId={project.id}
              initialTasks={board.tasks}
              initialColumns={board.columns}
              members={members}
              backgroundImage={board.backgroundImage || project.backgroundImage}
              backgroundColor={board.backgroundColor || project.backgroundColor}
              isOwner={isOwner}
            />
          </BoardSwitcher>
        </div>
      </div>
      </BoardCountProvider>
    </BoardLoadingProvider>
  )
}




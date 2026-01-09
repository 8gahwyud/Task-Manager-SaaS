import { getServerSession } from 'next-auth'
import { notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { KanbanBoard } from '@/components/KanbanBoard'
import { ProjectHeader } from '@/components/ProjectHeader'

interface Props {
  params: { id: string }
}

export default async function ProjectPage({ params }: Props) {
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
      owner: { select: { id: true, name: true, email: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
      tasks: {
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          creator: { select: { id: true, name: true, email: true } },
        },
        orderBy: [{ status: 'asc' }, { position: 'asc' }],
      },
    },
  })

  if (!project) {
    notFound()
  }

  const members = project.members.map((m) => m.user)

  return (
    <div className="h-screen flex flex-col">
      <ProjectHeader
        project={{
          id: project.id,
          name: project.name,
          description: project.description,
        }}
        members={members}
        isOwner={project.ownerId === session!.user.id}
      />
      <div className="flex-1 overflow-hidden">
        <KanbanBoard
          projectId={project.id}
          initialTasks={project.tasks}
          members={members}
        />
      </div>
    </div>
  )
}


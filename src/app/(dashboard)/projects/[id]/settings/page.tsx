import { getServerSession } from 'next-auth'
import { notFound, redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ProjectSettings } from '@/components/ProjectSettings'

interface Props {
  params: { id: string }
}

export default async function ProjectSettingsPage({ params }: Props) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
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
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
      },
    },
  })

  if (!project) {
    notFound()
  }

  const isOwner = project.ownerId === session.user.id

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <ProjectSettings
        project={{
          id: project.id,
          ownerId: project.ownerId,
          name: project.name,
          description: project.description,
          backgroundImage: project.backgroundImage || null,
          backgroundColor: project.backgroundColor || null,
        }}
        members={project.members.map((m) => m.user)}
        isOwner={isOwner}
      />
    </div>
  )
}


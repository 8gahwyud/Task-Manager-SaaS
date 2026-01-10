import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { Sidebar } from '@/components/Sidebar'
import { prisma } from '@/lib/prisma'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  // Получаем полную информацию о пользователе включая avatarUrl
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
    },
  })

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen bg-gray-50 overflow-hidden">
      <Sidebar user={user} />
      <main className="flex-1 ml-64 bg-gray-50 overflow-x-hidden min-w-0">
        {children}
      </main>
    </div>
  )
}



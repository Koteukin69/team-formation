import { redirect, notFound } from 'next/navigation'
import { collections } from '@/lib/db/collections'
import { getCurrentUser } from '@/lib/auth/session'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdminParticipantsList } from '@/components/admin/admin-participants-list'
import { AdminTeamsList } from '@/components/admin/admin-teams-list'
import { OrganizersList } from '@/components/admin/organizers-list'

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function AdminPage({ params }: PageProps) {
  const user = await getCurrentUser()
  if (!user) {
    const { slug } = await params
    redirect(`/login?from=/${slug}/admin`)
  }

  const { slug } = await params
  const marathonsCollection = await collections.marathons()
  const marathon = await marathonsCollection.findOne({ slug: slug.toLowerCase() })

  if (!marathon) {
    notFound()
  }

  // Check if user is organizer or creator
  const isOrganizer = marathon.organizers.some(
    (orgId) => orgId.toString() === user._id.toString()
  )
  const isCreator = marathon.creatorId.toString() === user._id.toString()

  if (!isOrganizer && !isCreator) {
    notFound() // Return 404 if not authorized
  }

  // Fetch all data in parallel
  const participantsCollection = await collections.participants()
  const teamsCollection = await collections.teams()
  const usersCollection = await collections.users()

  const [participants, teams, organizerUsers, creator] = await Promise.all([
    participantsCollection
      .find({ marathonId: marathon._id })
      .sort({ createdAt: -1 })
      .toArray(),
    teamsCollection
      .find({ marathonId: marathon._id })
      .sort({ createdAt: -1 })
      .toArray(),
    usersCollection
      .find({ _id: { $in: marathon.organizers } })
      .toArray(),
    usersCollection.findOne({ _id: marathon.creatorId }),
  ])

  // Format participants for client component
  const participantsData = participants.map((p) => ({
    id: p._id.toString(),
    name: p.name || 'Без имени',
    nickname: p.nickname || '',
    isBanned: p.isBanned,
    banReason: p.banReason,
    isSuspended: p.isSuspended,
    suspendReason: p.suspendReason,
    hasTeam: !!p.teamId,
    roles: p.roles,
    technologies: p.technologies,
  }))

  // Format teams for client component
  const teamsData = teams.map((t) => ({
    id: t._id.toString(),
    name: t.name,
    memberCount: t.memberCount,
    isSuspended: t.isSuspended,
    suspendReason: t.suspendReason,
    managementType: t.managementType,
    decisionSystem: t.decisionSystem,
  }))

  // Format organizers for client component
  const organizers = organizerUsers.map((org) => ({
    id: org._id.toString(),
    email: org.email,
    isCreator: org._id.toString() === marathon.creatorId.toString(),
  }))

  // Add creator if not already in organizers array
  if (creator && !organizers.some((org) => org.isCreator)) {
    organizers.unshift({
      id: creator._id.toString(),
      email: creator.email,
      isCreator: true,
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Управление марафоном</h1>
        <p className="text-muted-foreground mt-2">
          Модерация участников, команд и управление организаторами
        </p>
      </div>

      <Tabs defaultValue="participants" className="space-y-6">
        <TabsList>
          <TabsTrigger value="participants">
            Участники ({participantsData.length})
          </TabsTrigger>
          <TabsTrigger value="teams">
            Команды ({teamsData.length})
          </TabsTrigger>
          <TabsTrigger value="organizers">
            Организаторы ({organizers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="participants" className="space-y-4">
          <AdminParticipantsList participants={participantsData} slug={slug} />
        </TabsContent>

        <TabsContent value="teams" className="space-y-4">
          <AdminTeamsList teams={teamsData} slug={slug} />
        </TabsContent>

        <TabsContent value="organizers" className="space-y-4">
          <OrganizersList
            organizers={organizers}
            slug={slug}
            isCreator={isCreator}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

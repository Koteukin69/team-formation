import { notFound, redirect } from 'next/navigation'
import { collections } from '@/lib/db/collections'
import { getCurrentUser } from '@/lib/auth/session'
import { ParticipantsList } from '@/components/participant/participants-list'
import { ROLES, TECHNOLOGIES } from '@/lib/references'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export const metadata: Metadata = {
  title: 'Участники',
}

async function getParticipantsData(
  slug: string,
  userId: any,
  filters: { available?: boolean; roles?: string[]; technologies?: string[] }
) {
  const marathonsCollection = await collections.marathons()
  const marathon = await marathonsCollection.findOne({ slug: slug.toLowerCase() })

  if (!marathon) return null

  // Check if user is organizer
  const isOrganizer = marathon.organizers.some(
    (orgId) => orgId.toString() === userId.toString()
  ) || marathon.creatorId.toString() === userId.toString()

  const participantsCollection = await collections.participants()

  // Check if user is participant
  const userParticipant = await participantsCollection.findOne({
    marathonId: marathon._id,
    userId: userId,
  })

  // Organizers can access even without being a participant
  if (!userParticipant && !isOrganizer) return { requiresJoin: true, marathon }

  // Build filter
  const filter: Record<string, unknown> = {
    marathonId: marathon._id,
    isBanned: false,
    isSuspended: false,
  }

  if (filters.available) {
    filter.teamId = { $exists: false }
  }

  if (filters.roles && filters.roles.length > 0) {
    filter.roles = { $in: filters.roles }
  }

  if (filters.technologies && filters.technologies.length > 0) {
    filter.technologies = { $in: filters.technologies }
  }

  const participants = await participantsCollection
    .find(filter)
    .sort({ createdAt: -1 })
    .toArray()

  return {
    marathon,
    participants: participants.map((p) => ({
      id: p._id.toString(),
      name: p.name || 'Без имени',
      nickname: p.nickname,
      roles: p.roles,
      technologies: p.technologies,
      hasTeam: !!p.teamId,
    })),
    userParticipantId: userParticipant?._id.toString() || userId,
  }
}

export default async function ParticipantsPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const search = await searchParams
  const user = await getCurrentUser()

  if (!user) {
    redirect(`/login?from=/${slug}/participants`)
  }

  const filters = {
    available: search.available === 'true',
    roles: typeof search.roles === 'string' ? search.roles.split(',').filter(Boolean) : [],
    technologies:
      typeof search.technologies === 'string'
        ? search.technologies.split(',').filter(Boolean)
        : [],
  }

  const data = await getParticipantsData(slug, user._id, filters)

  if (!data) {
    notFound()
  }

  if ('requiresJoin' in data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">
          Присоединитесь к марафону, чтобы просматривать участников
        </p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Участники</h1>
      <ParticipantsList
        slug={slug}
        participants={data.participants}
        currentFilters={filters}
        roles={ROLES}
        technologies={TECHNOLOGIES}
        currentUserId={data.userParticipantId}
      />
    </div>
  )
}

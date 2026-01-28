import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { collections } from '@/lib/db/collections'
import { getCurrentUser } from '@/lib/auth/session'
import { Button } from '@/components/ui/button'
import { TeamsList } from '@/components/team/teams-list'
import { MANAGEMENT_TYPES, DECISION_SYSTEMS, GENRES, ROLES } from '@/lib/references'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export const metadata: Metadata = {
  title: 'Команды',
}

async function getTeamsData(
  slug: string,
  userId: any,
  filters: {
    managementType?: string
    decisionSystem?: string
    genre?: string
    hasOpenPositions?: boolean
    openPositionRole?: string
  }
) {
  const marathonsCollection = await collections.marathons()
  const marathon = await marathonsCollection.findOne({ slug: slug.toLowerCase() })

  if (!marathon) return null

  // Check if user is organizer
  const isOrganizer = marathon.organizers.some(
    (orgId) => orgId.toString() === userId.toString()
  ) || marathon.creatorId.toString() === userId.toString()

  const participantsCollection = await collections.participants()
  const userParticipant = await participantsCollection.findOne({
    marathonId: marathon._id,
    userId: userId,
  })

  // Organizers can access even without being a participant
  if (!userParticipant && !isOrganizer) return { requiresJoin: true, marathon }

  // Build filter
  const filter: Record<string, unknown> = {
    marathonId: marathon._id,
    isSuspended: false,
  }

  if (filters.managementType) filter.managementType = filters.managementType
  if (filters.decisionSystem) filter.decisionSystem = filters.decisionSystem
  if (filters.genre) filter.genre = filters.genre

  const teamsCollection = await collections.teams()
  let teams = await teamsCollection.find(filter).sort({ createdAt: -1 }).toArray()

  // Get open positions
  const openPositionsCollection = await collections.openPositions()

  if (filters.hasOpenPositions || filters.openPositionRole) {
    const positionsFilter: Record<string, unknown> = { marathonId: marathon._id }
    if (filters.openPositionRole) positionsFilter.role = filters.openPositionRole

    const positions = await openPositionsCollection.find(positionsFilter).toArray()
    const teamIdsWithPositions = new Set(positions.map((p) => p.teamId.toString()))
    teams = teams.filter((t) => teamIdsWithPositions.has(t._id.toString()))
  }

  // Get positions for each team
  const teamIds = teams.map((t) => t._id)
  const allPositions = await openPositionsCollection.find({ teamId: { $in: teamIds } }).toArray()

  const positionsByTeam = new Map<string, typeof allPositions>()
  allPositions.forEach((pos) => {
    const teamId = pos.teamId.toString()
    if (!positionsByTeam.has(teamId)) positionsByTeam.set(teamId, [])
    positionsByTeam.get(teamId)!.push(pos)
  })

  return {
    marathon,
    hasTeam: !!userParticipant?.teamId,
    teams: teams.map((t) => ({
      id: t._id.toString(),
      name: t.name,
      managementType: t.managementType,
      decisionSystem: t.decisionSystem,
      genre: t.genre,
      memberCount: t.memberCount,
      openPositions: (positionsByTeam.get(t._id.toString()) || []).map((p) => ({
        id: p._id.toString(),
        role: p.role,
      })),
    })),
  }
}

export default async function TeamsPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const search = await searchParams
  const user = await getCurrentUser()

  if (!user) {
    redirect(`/login?from=/${slug}/teams`)
  }

  const filters = {
    managementType: typeof search.managementType === 'string' ? search.managementType : undefined,
    decisionSystem: typeof search.decisionSystem === 'string' ? search.decisionSystem : undefined,
    genre: typeof search.genre === 'string' ? search.genre : undefined,
    hasOpenPositions: search.hasOpenPositions === 'true',
    openPositionRole: typeof search.openPositionRole === 'string' ? search.openPositionRole : undefined,
  }

  const data = await getTeamsData(slug, user._id, filters)

  if (!data) notFound()

  if ('requiresJoin' in data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">
          Присоединитесь к марафону, чтобы просматривать команды
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Команды</h1>
        {!data.hasTeam && (
          <Button asChild>
            <Link href={`/${slug}/teams/new`}>Создать команду</Link>
          </Button>
        )}
      </div>
      <TeamsList
        slug={slug}
        teams={data.teams}
        currentFilters={filters}
        managementTypes={MANAGEMENT_TYPES}
        decisionSystems={DECISION_SYSTEMS}
        genres={GENRES}
        roles={ROLES}
      />
    </div>
  )
}

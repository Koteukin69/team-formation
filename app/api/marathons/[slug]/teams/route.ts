import { NextRequest, NextResponse } from 'next/server'
import { collections } from '@/lib/db/collections'
import { getCurrentUser } from '@/lib/auth/session'
import { createTeamSchema } from '@/lib/validation/schemas'
import type { Filter } from 'mongodb'
import type { Team } from '@/types'

interface RouteContext {
  params: Promise<{ slug: string }>
}

// GET /api/marathons/[slug]/teams - List teams
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { slug } = await context.params
    const marathonsCollection = await collections.marathons()
    const marathon = await marathonsCollection.findOne({ slug: slug.toLowerCase() })

    if (!marathon) {
      return NextResponse.json({ error: 'Марафон не найден' }, { status: 404 })
    }

    const participantsCollection = await collections.participants()
    const userParticipant = await participantsCollection.findOne({
      marathonId: marathon._id,
      userId: user._id,
    })

    if (!userParticipant) {
      return NextResponse.json(
        { error: 'Вы не являетесь участником марафона' },
        { status: 403 }
      )
    }

    // Parse query params
    const searchParams = request.nextUrl.searchParams
    const managementType = searchParams.get('managementType')
    const decisionSystem = searchParams.get('decisionSystem')
    const genre = searchParams.get('genre')
    const hasOpenPositions = searchParams.get('hasOpenPositions') === 'true'
    const openPositionRole = searchParams.get('openPositionRole')

    // Build filter
    const filter: Filter<Team> = {
      marathonId: marathon._id,
      isSuspended: false,
    }

    if (managementType) filter.managementType = managementType as any
    if (decisionSystem) filter.decisionSystem = decisionSystem as any
    if (genre) filter.genre = genre

    const teamsCollection = await collections.teams()
    let teams = await teamsCollection.find(filter).sort({ createdAt: -1 }).toArray()

    // If filtering by open positions, get positions and filter
    const openPositionsCollection = await collections.openPositions()

    if (hasOpenPositions || openPositionRole) {
      const positionsFilter: Record<string, unknown> = {
        marathonId: marathon._id,
      }
      if (openPositionRole) {
        positionsFilter.role = openPositionRole
      }

      const positions = await openPositionsCollection.find(positionsFilter).toArray()
      const teamIdsWithPositions = new Set(positions.map((p) => p.teamId.toString()))

      teams = teams.filter((t) => teamIdsWithPositions.has(t._id.toString()))
    }

    // Get open positions for each team
    const teamIds = teams.map((t) => t._id)
    const allPositions = await openPositionsCollection
      .find({ teamId: { $in: teamIds } })
      .toArray()

    const positionsByTeam = new Map<string, typeof allPositions>()
    allPositions.forEach((pos) => {
      const teamId = pos.teamId.toString()
      if (!positionsByTeam.has(teamId)) {
        positionsByTeam.set(teamId, [])
      }
      positionsByTeam.get(teamId)!.push(pos)
    })

    return NextResponse.json({
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
          description: p.description,
        })),
      })),
    })
  } catch (error) {
    console.error('Get teams error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// POST /api/marathons/[slug]/teams - Create team
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { slug } = await context.params
    const marathonsCollection = await collections.marathons()
    const marathon = await marathonsCollection.findOne({ slug: slug.toLowerCase() })

    if (!marathon) {
      return NextResponse.json({ error: 'Марафон не найден' }, { status: 404 })
    }

    const participantsCollection = await collections.participants()
    const participant = await participantsCollection.findOne({
      marathonId: marathon._id,
      userId: user._id,
    })

    if (!participant) {
      return NextResponse.json(
        { error: 'Вы не являетесь участником марафона' },
        { status: 403 }
      )
    }

    if (participant.teamId) {
      return NextResponse.json(
        { error: 'Вы уже состоите в команде' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const parsed = createTeamSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Ошибка валидации', details: parsed.error.flatten() },
        { status: 422 }
      )
    }

    const { name, managementType, decisionSystem, genre, description, pitchDoc, designDoc, chatLink, gitLink } = parsed.data

    const teamsCollection = await collections.teams()
    const now = new Date()

    const result = await teamsCollection.insertOne({
      marathonId: marathon._id,
      name,
      leaderId: decisionSystem === 'dictatorship' ? participant._id : undefined,
      managementType,
      decisionSystem,
      genre,
      description,
      pitchDoc,
      designDoc,
      chatLink,
      gitLink,
      isSuspended: false,
      memberCount: 1,
      createdAt: now,
      updatedAt: now,
    } as any)

    // Add participant to team
    await participantsCollection.updateOne(
      { _id: participant._id },
      { $set: { teamId: result.insertedId, updatedAt: now } }
    )

    const team = await teamsCollection.findOne({ _id: result.insertedId })

    return NextResponse.json(
      {
        id: team!._id.toString(),
        name: team!.name,
        leaderId: team!.leaderId?.toString(),
        managementType: team!.managementType,
        decisionSystem: team!.decisionSystem,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create team error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

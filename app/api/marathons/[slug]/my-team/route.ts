import { NextRequest, NextResponse } from 'next/server'
import { collections } from '@/lib/db/collections'
import { getCurrentUser } from '@/lib/auth/session'

interface RouteContext {
  params: Promise<{ slug: string }>
}

// GET /api/marathons/[slug]/my-team - Get my team
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

    if (!participant.teamId) {
      return new NextResponse(null, { status: 204 })
    }

    const teamsCollection = await collections.teams()
    const team = await teamsCollection.findOne({ _id: participant.teamId })

    if (!team) {
      return new NextResponse(null, { status: 204 })
    }

    // Get team members
    const members = await participantsCollection
      .find({ teamId: team._id })
      .toArray()

    // Get open positions
    const openPositionsCollection = await collections.openPositions()
    const positions = await openPositionsCollection.find({ teamId: team._id }).toArray()

    // Get pending requests
    const teamRequestsCollection = await collections.teamRequests()
    const pendingRequests = await teamRequestsCollection
      .find({ teamId: team._id, status: 'pending' })
      .toArray()

    // Get pending applications
    const applicationsCollection = await collections.applications()
    const pendingApplications = await applicationsCollection
      .find({ teamId: team._id, status: 'pending' })
      .toArray()

    return NextResponse.json({
      id: team._id.toString(),
      name: team.name,
      managementType: team.managementType,
      decisionSystem: team.decisionSystem,
      leaderId: team.leaderId?.toString(),
      genre: team.genre,
      description: team.description,
      pitchDoc: team.pitchDoc,
      designDoc: team.designDoc,
      chatLink: team.chatLink,
      gitLink: team.gitLink,
      memberCount: team.memberCount,
      isLeader: team.leaderId?.toString() === participant._id.toString(),
      myParticipantId: participant._id.toString(),
      members: members.map((m) => ({
        id: m._id.toString(),
        name: m.name,
        nickname: m.nickname,
        roles: m.roles,
        isLeader: team.leaderId?.toString() === m._id.toString(),
      })),
      openPositions: positions.map((p) => ({
        id: p._id.toString(),
        role: p.role,
        description: p.description,
      })),
      pendingRequestsCount: pendingRequests.length,
      pendingApplicationsCount: pendingApplications.length,
    })
  } catch (error) {
    console.error('Get my team error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

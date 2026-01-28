import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { collections } from '@/lib/db/collections'
import { getCurrentUser } from '@/lib/auth/session'

interface RouteContext {
  params: Promise<{ slug: string; teamId: string }>
}

// GET /api/marathons/[slug]/teams/[teamId] - Get team details
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { slug, teamId } = await context.params
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

    const teamsCollection = await collections.teams()
    let team
    try {
      team = await teamsCollection.findOne({
        _id: new ObjectId(teamId),
        marathonId: marathon._id,
      })
    } catch {
      return NextResponse.json({ error: 'Команда не найдена' }, { status: 404 })
    }

    if (!team) {
      return NextResponse.json({ error: 'Команда не найдена' }, { status: 404 })
    }

    // Get team members
    const members = await participantsCollection
      .find({ teamId: team._id })
      .toArray()

    // Get open positions
    const openPositionsCollection = await collections.openPositions()
    const positions = await openPositionsCollection.find({ teamId: team._id }).toArray()

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
      isSuspended: team.isSuspended,
      suspendReason: team.suspendReason,
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
    })
  } catch (error) {
    console.error('Get team error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

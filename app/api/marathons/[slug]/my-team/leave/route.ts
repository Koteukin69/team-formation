import { NextRequest, NextResponse } from 'next/server'
import { collections } from '@/lib/db/collections'
import { getCurrentUser } from '@/lib/auth/session'

interface RouteContext {
  params: Promise<{ slug: string }>
}

// POST /api/marathons/[slug]/my-team/leave - Leave team
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

    if (!participant.teamId) {
      return NextResponse.json(
        { error: 'Вы не состоите в команде' },
        { status: 404 }
      )
    }

    const teamsCollection = await collections.teams()
    const team = await teamsCollection.findOne({ _id: participant.teamId })

    if (!team) {
      return NextResponse.json(
        { error: 'Команда не найдена' },
        { status: 404 }
      )
    }

    const now = new Date()
    let teamBecameDemocracy = false
    let teamDeleted = false

    // Remove participant from team
    await participantsCollection.updateOne(
      { _id: participant._id },
      { $unset: { teamId: '' }, $set: { updatedAt: now } }
    )

    // Update team member count
    const newMemberCount = team.memberCount - 1

    if (newMemberCount === 0) {
      // Delete empty team
      await teamsCollection.deleteOne({ _id: team._id })

      // Delete open positions
      const openPositionsCollection = await collections.openPositions()
      await openPositionsCollection.deleteMany({ teamId: team._id })

      // Delete pending team requests
      const teamRequestsCollection = await collections.teamRequests()
      await teamRequestsCollection.deleteMany({ teamId: team._id, status: 'pending' })

      // Reject pending applications
      const applicationsCollection = await collections.applications()
      await applicationsCollection.updateMany(
        { teamId: team._id, status: 'pending' },
        { $set: { status: 'rejected', resolvedAt: now } }
      )

      // Invalidate pending invitations
      const invitationsCollection = await collections.invitations()
      await invitationsCollection.updateMany(
        { teamId: team._id, status: 'pending' },
        { $set: { status: 'invalidated', resolvedAt: now } }
      )

      teamDeleted = true
    } else {
      // Check if leaving member was leader
      const wasLeader = team.leaderId?.toString() === participant._id.toString()

      const updates: Record<string, unknown> = {
        memberCount: newMemberCount,
        updatedAt: now,
      }

      if (wasLeader && team.decisionSystem === 'dictatorship') {
        // Switch to democracy
        updates.decisionSystem = 'democracy'
        updates.leaderId = null
        teamBecameDemocracy = true
      }

      await teamsCollection.updateOne({ _id: team._id }, { $set: updates })
    }

    return NextResponse.json({
      status: 'ok',
      teamBecameDemocracy,
      teamDeleted,
    })
  } catch (error) {
    console.error('Leave team error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

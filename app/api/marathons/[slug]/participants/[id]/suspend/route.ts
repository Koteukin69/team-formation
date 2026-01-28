import { NextRequest, NextResponse } from 'next/server'
import { collections } from '@/lib/db/collections'
import { getCurrentUser } from '@/lib/auth/session'
import { moderationReasonSchema } from '@/lib/validation/schemas'
import { ObjectId } from 'mongodb'

interface RouteContext {
  params: Promise<{ slug: string; id: string }>
}

// POST /api/marathons/[slug]/participants/[id]/suspend - Suspend participant
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { slug, id } = await context.params

    // Validate participant ID
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Неверный ID участника' }, { status: 400 })
    }

    const marathonsCollection = await collections.marathons()
    const marathon = await marathonsCollection.findOne({ slug: slug.toLowerCase() })

    if (!marathon) {
      return NextResponse.json({ error: 'Марафон не найден' }, { status: 404 })
    }

    // Check if user is organizer or creator
    const isOrganizer = marathon.organizers.some(
      (orgId) => orgId.toString() === user._id.toString()
    )
    const isCreator = marathon.creatorId.toString() === user._id.toString()

    if (!isOrganizer && !isCreator) {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = moderationReasonSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Неверные данные', details: (validation.error as any).errors },
        { status: 422 }
      )
    }

    const { reason } = validation.data

    // Find participant
    const participantsCollection = await collections.participants()
    const participant = await participantsCollection.findOne({
      _id: new ObjectId(id),
      marathonId: marathon._id,
    })

    if (!participant) {
      return NextResponse.json({ error: 'Участник не найден' }, { status: 404 })
    }

    // Cannot suspend the creator
    if (participant.userId.toString() === marathon.creatorId.toString()) {
      return NextResponse.json(
        { error: 'Нельзя отстранить создателя марафона' },
        { status: 403 }
      )
    }

    // Cannot suspend other organizers
    const isTargetOrganizer = marathon.organizers.some(
      (orgId) => orgId.toString() === participant.userId.toString()
    )
    if (isTargetOrganizer && !isCreator) {
      return NextResponse.json(
        { error: 'Нельзя отстранить организатора' },
        { status: 403 }
      )
    }

    const now = new Date()
    let removedFromTeam = false
    let teamDeleted = false

    // Suspend participant
    await participantsCollection.updateOne(
      { _id: participant._id },
      {
        $set: {
          isSuspended: true,
          suspendReason: reason,
          updatedAt: now,
        },
      }
    )

    // If participant is in a team, remove them
    if (participant.teamId) {
      const teamsCollection = await collections.teams()
      const team = await teamsCollection.findOne({ _id: participant.teamId })

      if (team) {
        removedFromTeam = true

        // Remove participant from team
        await participantsCollection.updateOne(
          { _id: participant._id },
          { $unset: { teamId: '' } }
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
          // Check if suspended member was leader
          const wasLeader = team.leaderId?.toString() === participant._id.toString()

          const updates: Record<string, unknown> = {
            memberCount: newMemberCount,
            updatedAt: now,
          }

          if (wasLeader && team.decisionSystem === 'dictatorship') {
            // Switch to democracy
            updates.decisionSystem = 'democracy'
            updates.leaderId = null
          }

          await teamsCollection.updateOne({ _id: team._id }, { $set: updates })
        }
      }
    }

    // Cancel all pending applications from this participant
    const applicationsCollection = await collections.applications()
    await applicationsCollection.updateMany(
      {
        marathonId: marathon._id,
        participantId: participant._id,
        status: 'pending',
      },
      { $set: { status: 'cancelled', resolvedAt: now } }
    )

    // Invalidate all pending invitations to this participant
    const invitationsCollection = await collections.invitations()
    await invitationsCollection.updateMany(
      {
        marathonId: marathon._id,
        participantId: participant._id,
        status: 'pending',
      },
      { $set: { status: 'invalidated', resolvedAt: now } }
    )

    return NextResponse.json({
      status: 'ok',
      removedFromTeam,
      teamDeleted,
    })
  } catch (error) {
    console.error('Suspend participant error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

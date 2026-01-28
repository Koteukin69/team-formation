import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { collections } from '@/lib/db/collections'
import { getCurrentUser } from '@/lib/auth/session'

interface RouteContext {
  params: Promise<{ slug: string; invitationId: string }>
}

// POST /api/marathons/[slug]/my-invitations/[invitationId]/accept - Accept invitation
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { slug, invitationId } = await context.params
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

    const invitationsCollection = await collections.invitations()
    let invitation
    try {
      invitation = await invitationsCollection.findOne({
        _id: new ObjectId(invitationId),
        participantId: participant._id,
      })
    } catch {
      return NextResponse.json({ error: 'Приглашение не найдено' }, { status: 404 })
    }

    if (!invitation) {
      return NextResponse.json({ error: 'Приглашение не найдено' }, { status: 404 })
    }

    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: 'Приглашение уже обработано' },
        { status: 409 }
      )
    }

    // Check team still exists and not full
    const teamsCollection = await collections.teams()
    const team = await teamsCollection.findOne({ _id: invitation.teamId })

    if (!team) {
      await invitationsCollection.updateOne(
        { _id: invitation._id },
        { $set: { status: 'invalidated', resolvedAt: new Date() } }
      )
      return NextResponse.json(
        { error: 'Команда больше не существует' },
        { status: 409 }
      )
    }

    if (team.memberCount >= marathon.maxTeamSize) {
      return NextResponse.json(
        { error: 'Команда уже заполнена' },
        { status: 409 }
      )
    }

    const now = new Date()

    // Add participant to team
    await participantsCollection.updateOne(
      { _id: participant._id },
      { $set: { teamId: team._id, updatedAt: now } }
    )

    // Update team member count
    await teamsCollection.updateOne(
      { _id: team._id },
      { $inc: { memberCount: 1 }, $set: { updatedAt: now } }
    )

    // Accept invitation
    await invitationsCollection.updateOne(
      { _id: invitation._id },
      { $set: { status: 'accepted', resolvedAt: now } }
    )

    // Invalidate other pending invitations for this participant
    await invitationsCollection.updateMany(
      { participantId: participant._id, status: 'pending', _id: { $ne: invitation._id } },
      { $set: { status: 'invalidated', resolvedAt: now } }
    )

    // Cancel pending applications from this participant
    const applicationsCollection = await collections.applications()
    await applicationsCollection.updateMany(
      { participantId: participant._id, status: 'pending' },
      { $set: { status: 'cancelled', resolvedAt: now } }
    )

    return NextResponse.json({ status: 'ok', teamId: team._id.toString() })
  } catch (error) {
    console.error('Accept invitation error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

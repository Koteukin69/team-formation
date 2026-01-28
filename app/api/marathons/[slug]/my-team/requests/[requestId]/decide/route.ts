import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { collections } from '@/lib/db/collections'
import { getCurrentUser } from '@/lib/auth/session'
import { decideSchema } from '@/lib/validation/schemas'

interface RouteContext {
  params: Promise<{ slug: string; requestId: string }>
}

// POST /api/marathons/[slug]/my-team/requests/[requestId]/decide - Leader decision
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { slug, requestId } = await context.params
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

    if (!participant || !participant.teamId) {
      return NextResponse.json({ error: 'Вы не состоите в команде' }, { status: 404 })
    }

    const teamsCollection = await collections.teams()
    const team = await teamsCollection.findOne({ _id: participant.teamId })

    if (!team) {
      return NextResponse.json({ error: 'Команда не найдена' }, { status: 404 })
    }

    if (team.decisionSystem !== 'dictatorship') {
      return NextResponse.json(
        { error: 'Решение тимлида доступно только в режиме диктатуры' },
        { status: 403 }
      )
    }

    if (team.leaderId?.toString() !== participant._id.toString()) {
      return NextResponse.json({ error: 'Вы не являетесь тимлидом' }, { status: 403 })
    }

    const teamRequestsCollection = await collections.teamRequests()
    let teamRequest
    try {
      teamRequest = await teamRequestsCollection.findOne({
        _id: new ObjectId(requestId),
        teamId: team._id,
      })
    } catch {
      return NextResponse.json({ error: 'Запрос не найден' }, { status: 404 })
    }

    if (!teamRequest) {
      return NextResponse.json({ error: 'Запрос не найден' }, { status: 404 })
    }

    if (teamRequest.status !== 'pending') {
      return NextResponse.json({ error: 'Запрос уже обработан' }, { status: 409 })
    }

    const body = await request.json()
    const parsed = decideSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Ошибка валидации', details: parsed.error.flatten() },
        { status: 422 }
      )
    }

    const now = new Date()

    if (parsed.data.decision === 'approve') {
      await processApprovedRequest(teamRequest._id, marathon, team, participantsCollection, teamsCollection)
      return NextResponse.json({ status: 'ok', requestStatus: 'approved' })
    } else {
      await teamRequestsCollection.updateOne(
        { _id: teamRequest._id },
        {
          $set: {
            status: 'rejected',
            decidedBy: participant._id,
            decidedAt: now,
            resolvedAt: now,
          },
        }
      )
      return NextResponse.json({ status: 'ok', requestStatus: 'rejected' })
    }
  } catch (error) {
    console.error('Decide error:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}

// Process approved request
async function processApprovedRequest(
  requestId: ObjectId,
  marathon: any,
  team: any,
  participantsCollection: any,
  teamsCollection: any
) {
  const teamRequestsCollection = await collections.teamRequests()
  const request = await teamRequestsCollection.findOne({ _id: requestId })

  if (!request) return

  const now = new Date()

  await teamRequestsCollection.updateOne(
    { _id: requestId },
    { $set: { status: 'approved', resolvedAt: now } }
  )

  switch (request.type) {
    case 'accept_application': {
      const applicationsCollection = await collections.applications()
      const application = await applicationsCollection.findOne({
        _id: new ObjectId(request.data.applicationId),
      })
      if (application && application.status === 'pending') {
        await participantsCollection.updateOne(
          { _id: application.participantId },
          { $set: { teamId: team._id, updatedAt: now } }
        )
        await teamsCollection.updateOne(
          { _id: team._id },
          { $inc: { memberCount: 1 }, $set: { updatedAt: now } }
        )
        await applicationsCollection.updateOne(
          { _id: application._id },
          { $set: { status: 'accepted', resolvedAt: now } }
        )
      }
      break
    }

    case 'reject_application': {
      const applicationsCollection = await collections.applications()
      await applicationsCollection.updateOne(
        { _id: new ObjectId(request.data.applicationId) },
        { $set: { status: 'rejected', resolvedAt: now } }
      )
      break
    }

    case 'open_position': {
      const openPositionsCollection = await collections.openPositions()
      await openPositionsCollection.insertOne({
        teamId: team._id,
        marathonId: marathon._id,
        role: request.data.role!,
        description: request.data.description,
        createdAt: now,
      } as any)
      break
    }

    case 'close_position': {
      const openPositionsCollection = await collections.openPositions()
      await openPositionsCollection.deleteOne({
        _id: new ObjectId(request.data.positionId),
      })
      break
    }

    case 'invite': {
      const invitationsCollection = await collections.invitations()
      await invitationsCollection.insertOne({
        marathonId: marathon._id,
        teamId: team._id,
        participantId: new ObjectId(request.data.participantId),
        requestId: requestId,
        message: request.data.message,
        status: 'pending',
        createdAt: now,
      } as any)
      break
    }

    case 'kick': {
      const memberToKick = await participantsCollection.findOne({
        _id: new ObjectId(request.data.memberId),
      })
      if (memberToKick && memberToKick.teamId?.toString() === team._id.toString()) {
        await participantsCollection.updateOne(
          { _id: memberToKick._id },
          { $unset: { teamId: '' }, $set: { updatedAt: now } }
        )
        await teamsCollection.updateOne(
          { _id: team._id },
          { $inc: { memberCount: -1 }, $set: { updatedAt: now } }
        )
      }
      break
    }

    case 'transfer_lead': {
      await teamsCollection.updateOne(
        { _id: team._id },
        { $set: { leaderId: new ObjectId(request.data.memberId), updatedAt: now } }
      )
      break
    }

    case 'change_decision_system': {
      const updates: Record<string, unknown> = {
        decisionSystem: request.data.decisionSystem,
        updatedAt: now,
      }
      if (request.data.decisionSystem === 'dictatorship' && request.data.leaderId) {
        updates.leaderId = new ObjectId(request.data.leaderId)
      } else if (request.data.decisionSystem === 'democracy') {
        updates.leaderId = null
      }
      await teamsCollection.updateOne({ _id: team._id }, { $set: updates })
      break
    }
  }
}

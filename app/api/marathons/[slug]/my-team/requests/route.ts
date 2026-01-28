import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { collections } from '@/lib/db/collections'
import { getCurrentUser } from '@/lib/auth/session'
import { createRequestSchema } from '@/lib/validation/schemas'

interface RouteContext {
  params: Promise<{ slug: string }>
}

// GET /api/marathons/[slug]/my-team/requests - Get team requests
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

    if (!participant || !participant.teamId) {
      return NextResponse.json({ error: 'Вы не состоите в команде' }, { status: 404 })
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') || 'pending'

    const teamRequestsCollection = await collections.teamRequests()
    const requests = await teamRequestsCollection
      .find({ teamId: participant.teamId, status: status as any })
      .sort({ createdAt: -1 })
      .toArray()

    // Get team info for context
    const teamsCollection = await collections.teams()
    const team = await teamsCollection.findOne({ _id: participant.teamId })

    return NextResponse.json({
      requests: requests.map((r) => ({
        id: r._id.toString(),
        type: r.type,
        status: r.status,
        authorId: r.authorId.toString(),
        data: r.data,
        votes: {
          approve: r.votes.filter((v) => v.vote === 'approve').length,
          reject: r.votes.filter((v) => v.vote === 'reject').length,
        },
        myVote: r.votes.find((v) => v.participantId.toString() === participant._id.toString())?.vote,
        createdAt: r.createdAt,
      })),
      teamMemberCount: team?.memberCount || 0,
      decisionSystem: team?.decisionSystem,
      isLeader: team?.leaderId?.toString() === participant._id.toString(),
      myParticipantId: participant._id.toString(),
    })
  } catch (error) {
    console.error('Get team requests error:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}

// POST /api/marathons/[slug]/my-team/requests - Create team request
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

    if (!participant || !participant.teamId) {
      return NextResponse.json({ error: 'Вы не состоите в команде' }, { status: 404 })
    }

    const body = await request.json()
    const parsed = createRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Ошибка валидации', details: parsed.error.flatten() },
        { status: 422 }
      )
    }

    const teamsCollection = await collections.teams()
    const team = await teamsCollection.findOne({ _id: participant.teamId })

    if (!team) {
      return NextResponse.json({ error: 'Команда не найдена' }, { status: 404 })
    }

    const now = new Date()
    const requestData = parsed.data

    // Build request document
    const teamRequestsCollection = await collections.teamRequests()

    // Check for duplicate pending request
    const existingRequest = await teamRequestsCollection.findOne({
      teamId: team._id,
      type: requestData.type,
      status: 'pending',
    })

    if (existingRequest) {
      return NextResponse.json(
        { error: 'Аналогичный запрос уже существует' },
        { status: 409 }
      )
    }

    const result = await teamRequestsCollection.insertOne({
      teamId: team._id,
      authorId: participant._id,
      type: requestData.type,
      status: 'pending',
      data: requestData as any,
      votes: [],
      createdAt: now,
    } as any)

    // In dictatorship mode, if leader creates request, auto-approve
    if (team.decisionSystem === 'dictatorship' && team.leaderId?.toString() === participant._id.toString()) {
      await processApprovedRequest(result.insertedId, marathon, team, participantsCollection, teamsCollection)
    }

    return NextResponse.json(
      { id: result.insertedId.toString(), type: requestData.type, status: 'pending' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create team request error:', error)
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

  // Mark as approved
  await teamRequestsCollection.updateOne(
    { _id: requestId },
    { $set: { status: 'approved', resolvedAt: now } }
  )

  // Execute action based on type
  switch (request.type) {
    case 'accept_application': {
      const applicationsCollection = await collections.applications()
      const application = await applicationsCollection.findOne({
        _id: new ObjectId(request.data.applicationId),
      })
      if (application && application.status === 'pending') {
        // Add participant to team
        await participantsCollection.updateOne(
          { _id: application.participantId },
          { $set: { teamId: team._id, updatedAt: now } }
        )
        // Update team member count
        await teamsCollection.updateOne(
          { _id: team._id },
          { $inc: { memberCount: 1 }, $set: { updatedAt: now } }
        )
        // Mark application as accepted
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

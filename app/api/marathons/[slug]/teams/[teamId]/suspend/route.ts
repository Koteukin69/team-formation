import { NextRequest, NextResponse } from 'next/server'
import { collections } from '@/lib/db/collections'
import { getCurrentUser } from '@/lib/auth/session'
import { moderationReasonSchema } from '@/lib/validation/schemas'
import { ObjectId } from 'mongodb'

interface RouteContext {
  params: Promise<{ slug: string; teamId: string }>
}

// POST /api/marathons/[slug]/teams/[teamId]/suspend - Suspend team
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { slug, teamId } = await context.params

    // Validate team ID
    if (!ObjectId.isValid(teamId)) {
      return NextResponse.json({ error: 'Неверный ID команды' }, { status: 400 })
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

    // Find team
    const teamsCollection = await collections.teams()
    const team = await teamsCollection.findOne({
      _id: new ObjectId(teamId),
      marathonId: marathon._id,
    })

    if (!team) {
      return NextResponse.json({ error: 'Команда не найдена' }, { status: 404 })
    }

    const now = new Date()

    // Suspend team
    await teamsCollection.updateOne(
      { _id: team._id },
      {
        $set: {
          isSuspended: true,
          suspendReason: reason,
          updatedAt: now,
        },
      }
    )

    // Reject all pending applications to this team
    const applicationsCollection = await collections.applications()
    await applicationsCollection.updateMany(
      { teamId: team._id, status: 'pending' },
      { $set: { status: 'rejected', resolvedAt: now } }
    )

    // Invalidate all pending invitations from this team
    const invitationsCollection = await collections.invitations()
    await invitationsCollection.updateMany(
      { teamId: team._id, status: 'pending' },
      { $set: { status: 'invalidated', resolvedAt: now } }
    )

    // Reject all pending team requests
    const teamRequestsCollection = await collections.teamRequests()
    await teamRequestsCollection.updateMany(
      { teamId: team._id, status: 'pending' },
      { $set: { status: 'rejected', updatedAt: now } }
    )

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('Suspend team error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { collections } from '@/lib/db/collections'
import { getCurrentUser } from '@/lib/auth/session'
import { updateMarathonSchema } from '@/lib/validation/schemas'

interface RouteContext {
  params: Promise<{ slug: string }>
}

// GET /api/marathons/[slug] - Get marathon by slug
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params
    const marathonsCollection = await collections.marathons()
    const marathon = await marathonsCollection.findOne({ slug: slug.toLowerCase() })

    if (!marathon) {
      return NextResponse.json(
        { error: 'Марафон не найден' },
        { status: 404 }
      )
    }

    // Get participant and team counts
    const participantsCollection = await collections.participants()
    const teamsCollection = await collections.teams()

    const [participantCount, teamCount] = await Promise.all([
      participantsCollection.countDocuments({
        marathonId: marathon._id,
        isBanned: false,
        isSuspended: false,
      }),
      teamsCollection.countDocuments({
        marathonId: marathon._id,
        isSuspended: false,
      }),
    ])

    return NextResponse.json({
      id: marathon._id.toString(),
      name: marathon.name,
      slug: marathon.slug,
      minTeamSize: marathon.minTeamSize,
      maxTeamSize: marathon.maxTeamSize,
      participantCount,
      teamCount,
      createdAt: marathon.createdAt,
    })
  } catch (error) {
    console.error('Get marathon error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// PATCH /api/marathons/[slug] - Update marathon
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { slug } = await context.params
    const marathonsCollection = await collections.marathons()
    const marathon = await marathonsCollection.findOne({ slug: slug.toLowerCase() })

    if (!marathon) {
      return NextResponse.json(
        { error: 'Марафон не найден' },
        { status: 404 }
      )
    }

    // Check if user is organizer
    const isOrganizer = marathon.organizers.some(
      (orgId) => orgId.toString() === user._id.toString()
    )
    if (!isOrganizer) {
      return NextResponse.json(
        { error: 'Нет прав на редактирование' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const parsed = updateMarathonSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Ошибка валидации', details: parsed.error.flatten() },
        { status: 422 }
      )
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() }
    if (parsed.data.name) updates.name = parsed.data.name
    if (parsed.data.minTeamSize) updates.minTeamSize = parsed.data.minTeamSize
    if (parsed.data.maxTeamSize) updates.maxTeamSize = parsed.data.maxTeamSize

    await marathonsCollection.updateOne(
      { _id: marathon._id },
      { $set: updates }
    )

    const updated = await marathonsCollection.findOne({ _id: marathon._id })

    return NextResponse.json({
      id: updated!._id.toString(),
      name: updated!.name,
      slug: updated!.slug,
      minTeamSize: updated!.minTeamSize,
      maxTeamSize: updated!.maxTeamSize,
    })
  } catch (error) {
    console.error('Update marathon error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// DELETE /api/marathons/[slug] - Delete marathon
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { slug } = await context.params
    const marathonsCollection = await collections.marathons()
    const marathon = await marathonsCollection.findOne({ slug: slug.toLowerCase() })

    if (!marathon) {
      return NextResponse.json(
        { error: 'Марафон не найден' },
        { status: 404 }
      )
    }

    // Only creator can delete
    if (marathon.creatorId.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: 'Только создатель может удалить марафон' },
        { status: 403 }
      )
    }

    // Delete all related data
    const [
      participantsCollection,
      teamsCollection,
      openPositionsCollection,
      teamRequestsCollection,
      applicationsCollection,
      invitationsCollection,
    ] = await Promise.all([
      collections.participants(),
      collections.teams(),
      collections.openPositions(),
      collections.teamRequests(),
      collections.applications(),
      collections.invitations(),
    ])

    await Promise.all([
      participantsCollection.deleteMany({ marathonId: marathon._id }),
      teamsCollection.deleteMany({ marathonId: marathon._id }),
      openPositionsCollection.deleteMany({ marathonId: marathon._id }),
      applicationsCollection.deleteMany({ marathonId: marathon._id }),
      invitationsCollection.deleteMany({ marathonId: marathon._id }),
    ])

    // Delete team requests for teams in this marathon
    const teams = await teamsCollection.find({ marathonId: marathon._id }).toArray()
    const teamIds = teams.map((t) => t._id)
    if (teamIds.length > 0) {
      await teamRequestsCollection.deleteMany({ teamId: { $in: teamIds } })
    }

    // Delete marathon
    await marathonsCollection.deleteOne({ _id: marathon._id })

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('Delete marathon error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

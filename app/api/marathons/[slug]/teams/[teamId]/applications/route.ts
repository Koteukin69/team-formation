import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { collections } from '@/lib/db/collections'
import { getCurrentUser } from '@/lib/auth/session'
import { createApplicationSchema } from '@/lib/validation/schemas'

interface RouteContext {
  params: Promise<{ slug: string; teamId: string }>
}

// POST /api/marathons/[slug]/teams/[teamId]/applications - Apply to team
export async function POST(request: NextRequest, context: RouteContext) {
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

    const teamsCollection = await collections.teams()
    let team
    try {
      team = await teamsCollection.findOne({
        _id: new ObjectId(teamId),
        marathonId: marathon._id,
        isSuspended: false,
      })
    } catch {
      return NextResponse.json({ error: 'Команда не найдена' }, { status: 404 })
    }

    if (!team) {
      return NextResponse.json({ error: 'Команда не найдена' }, { status: 404 })
    }

    // Check for existing application
    const applicationsCollection = await collections.applications()
    const existing = await applicationsCollection.findOne({
      marathonId: marathon._id,
      participantId: participant._id,
      teamId: team._id,
      status: 'pending',
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Вы уже подали заявку в эту команду' },
        { status: 409 }
      )
    }

    const body = await request.json()
    const parsed = createApplicationSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Ошибка валидации', details: parsed.error.flatten() },
        { status: 422 }
      )
    }

    const now = new Date()
    const result = await applicationsCollection.insertOne({
      marathonId: marathon._id,
      teamId: team._id,
      participantId: participant._id,
      message: parsed.data.message,
      status: 'pending',
      createdAt: now,
    } as any)

    return NextResponse.json(
      {
        id: result.insertedId.toString(),
        teamId: team._id.toString(),
        status: 'pending',
        message: parsed.data.message,
        createdAt: now,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Apply to team error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

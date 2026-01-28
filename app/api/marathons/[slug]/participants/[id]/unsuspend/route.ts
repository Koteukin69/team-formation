import { NextRequest, NextResponse } from 'next/server'
import { collections } from '@/lib/db/collections'
import { getCurrentUser } from '@/lib/auth/session'
import { ObjectId } from 'mongodb'

interface RouteContext {
  params: Promise<{ slug: string; id: string }>
}

// POST /api/marathons/[slug]/participants/[id]/unsuspend - Remove suspension
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

    // Find participant
    const participantsCollection = await collections.participants()
    const participant = await participantsCollection.findOne({
      _id: new ObjectId(id),
      marathonId: marathon._id,
    })

    if (!participant) {
      return NextResponse.json({ error: 'Участник не найден' }, { status: 404 })
    }

    // Check if participant is actually suspended
    if (!participant.isSuspended) {
      return NextResponse.json(
        { error: 'Участник не отстранён' },
        { status: 409 }
      )
    }

    const now = new Date()

    // Remove suspension
    await participantsCollection.updateOne(
      { _id: participant._id },
      {
        $set: {
          isSuspended: false,
          updatedAt: now,
        },
        $unset: {
          suspendReason: '',
        },
      }
    )

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('Unsuspend participant error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

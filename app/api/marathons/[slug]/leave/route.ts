import { NextRequest, NextResponse } from 'next/server'
import { collections } from '@/lib/db/collections'
import { getCurrentUser } from '@/lib/auth/session'

interface RouteContext {
  params: Promise<{ slug: string }>
}

// POST /api/marathons/[slug]/leave - Leave marathon
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
      return NextResponse.json(
        { error: 'Марафон не найден' },
        { status: 404 }
      )
    }

    const participantsCollection = await collections.participants()
    const participant = await participantsCollection.findOne({
      marathonId: marathon._id,
      userId: user._id,
    })

    if (!participant) {
      return NextResponse.json(
        { error: 'Вы не являетесь участником этого марафона' },
        { status: 409 }
      )
    }

    // If in team, need to leave team first
    if (participant.teamId) {
      return NextResponse.json(
        { error: 'Сначала покиньте команду' },
        { status: 409 }
      )
    }

    // Delete participant
    await participantsCollection.deleteOne({ _id: participant._id })

    // Delete pending applications
    const applicationsCollection = await collections.applications()
    await applicationsCollection.deleteMany({
      participantId: participant._id,
      status: 'pending',
    })

    // Invalidate pending invitations
    const invitationsCollection = await collections.invitations()
    await invitationsCollection.updateMany(
      { participantId: participant._id, status: 'pending' },
      { $set: { status: 'invalidated', resolvedAt: new Date() } }
    )

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('Leave marathon error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { collections } from '@/lib/db/collections'
import { getCurrentUser } from '@/lib/auth/session'

interface RouteContext {
  params: Promise<{ slug: string }>
}

// GET /api/marathons/[slug]/my-status - Get user's status in marathon
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
      return NextResponse.json(
        { error: 'Марафон не найден' },
        { status: 404 }
      )
    }

    // Check if organizer
    const isOrganizer = marathon.organizers.some(
      (orgId) => orgId.toString() === user._id.toString()
    )

    // Check if participant
    const participantsCollection = await collections.participants()
    const participant = await participantsCollection.findOne({
      marathonId: marathon._id,
      userId: user._id,
    })

    return NextResponse.json({
      isParticipant: !!participant,
      isOrganizer,
      isBanned: participant?.isBanned || false,
      isSuspended: participant?.isSuspended || false,
      suspendReason: participant?.suspendReason || null,
      hasTeam: !!participant?.teamId,
      teamId: participant?.teamId?.toString() || null,
      participantId: participant?._id.toString() || null,
    })
  } catch (error) {
    console.error('Get my status error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

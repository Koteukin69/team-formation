import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { collections } from '@/lib/db/collections'
import { getCurrentUser } from '@/lib/auth/session'

interface RouteContext {
  params: Promise<{ slug: string; id: string }>
}

// GET /api/marathons/[slug]/participants/[id] - Get participant details
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { slug, id } = await context.params
    const marathonsCollection = await collections.marathons()
    const marathon = await marathonsCollection.findOne({ slug: slug.toLowerCase() })

    if (!marathon) {
      return NextResponse.json({ error: 'Марафон не найден' }, { status: 404 })
    }

    // Check if user is participant
    const participantsCollection = await collections.participants()
    const userParticipant = await participantsCollection.findOne({
      marathonId: marathon._id,
      userId: user._id,
    })

    if (!userParticipant) {
      return NextResponse.json(
        { error: 'Вы не являетесь участником марафона' },
        { status: 403 }
      )
    }

    // Find participant
    let participant
    try {
      participant = await participantsCollection.findOne({
        _id: new ObjectId(id),
        marathonId: marathon._id,
        isBanned: false,
        isSuspended: false,
      })
    } catch {
      return NextResponse.json(
        { error: 'Участник не найден' },
        { status: 404 }
      )
    }

    if (!participant) {
      return NextResponse.json(
        { error: 'Участник не найден' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: participant._id.toString(),
      name: participant.name,
      nickname: participant.nickname,
      roles: participant.roles,
      technologies: participant.technologies,
      description: participant.description,
      hasTeam: !!participant.teamId,
      teamId: participant.teamId?.toString() || null,
    })
  } catch (error) {
    console.error('Get participant error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

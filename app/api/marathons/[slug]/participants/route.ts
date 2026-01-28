import { NextRequest, NextResponse } from 'next/server'
import { collections } from '@/lib/db/collections'
import { getCurrentUser } from '@/lib/auth/session'
import type { Filter } from 'mongodb'
import type { Participant } from '@/types'

interface RouteContext {
  params: Promise<{ slug: string }>
}

// GET /api/marathons/[slug]/participants - List participants
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

    // Parse query params
    const searchParams = request.nextUrl.searchParams
    const available = searchParams.get('available') === 'true'
    const rolesParam = searchParams.get('roles')
    const technologiesParam = searchParams.get('technologies')

    // Build filter
    const filter: Filter<Participant> = {
      marathonId: marathon._id,
      isBanned: false,
      isSuspended: false,
    }

    if (available) {
      filter.teamId = { $exists: false }
    }

    if (rolesParam) {
      const roles = rolesParam.split(',').filter(Boolean)
      if (roles.length > 0) {
        filter.roles = { $in: roles }
      }
    }

    if (technologiesParam) {
      const technologies = technologiesParam.split(',').filter(Boolean)
      if (technologies.length > 0) {
        filter.technologies = { $in: technologies }
      }
    }

    const participants = await participantsCollection
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({
      participants: participants.map((p) => ({
        id: p._id.toString(),
        name: p.name,
        nickname: p.nickname,
        roles: p.roles,
        technologies: p.technologies,
        hasTeam: !!p.teamId,
      })),
    })
  } catch (error) {
    console.error('Get participants error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

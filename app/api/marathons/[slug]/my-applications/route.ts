import { NextRequest, NextResponse } from 'next/server'
import { collections } from '@/lib/db/collections'
import { getCurrentUser } from '@/lib/auth/session'

interface RouteContext {
  params: Promise<{ slug: string }>
}

// GET /api/marathons/[slug]/my-applications - Get my applications
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

    if (!participant) {
      return NextResponse.json(
        { error: 'Вы не являетесь участником марафона' },
        { status: 403 }
      )
    }

    const applicationsCollection = await collections.applications()
    const applications = await applicationsCollection
      .find({ participantId: participant._id })
      .sort({ createdAt: -1 })
      .toArray()

    // Get team names
    const teamIds = applications.map((a) => a.teamId)
    const teamsCollection = await collections.teams()
    const teams = await teamsCollection.find({ _id: { $in: teamIds } }).toArray()
    const teamMap = new Map(teams.map((t) => [t._id.toString(), t.name]))

    return NextResponse.json({
      applications: applications.map((a) => ({
        id: a._id.toString(),
        teamId: a.teamId.toString(),
        teamName: teamMap.get(a.teamId.toString()) || 'Неизвестная команда',
        status: a.status,
        message: a.message,
        createdAt: a.createdAt,
        resolvedAt: a.resolvedAt,
      })),
    })
  } catch (error) {
    console.error('Get my applications error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

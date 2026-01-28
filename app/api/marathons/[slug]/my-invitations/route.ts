import { NextRequest, NextResponse } from 'next/server'
import { collections } from '@/lib/db/collections'
import { getCurrentUser } from '@/lib/auth/session'

interface RouteContext {
  params: Promise<{ slug: string }>
}

// GET /api/marathons/[slug]/my-invitations - Get my invitations
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

    const invitationsCollection = await collections.invitations()
    const invitations = await invitationsCollection
      .find({ participantId: participant._id, status: 'pending' })
      .sort({ createdAt: -1 })
      .toArray()

    // Get team info
    const teamIds = invitations.map((i) => i.teamId)
    const teamsCollection = await collections.teams()
    const teams = await teamsCollection.find({ _id: { $in: teamIds } }).toArray()
    const teamMap = new Map(
      teams.map((t) => [t._id.toString(), { name: t.name, memberCount: t.memberCount }])
    )

    return NextResponse.json({
      invitations: invitations.map((i) => {
        const team = teamMap.get(i.teamId.toString())
        return {
          id: i._id.toString(),
          teamId: i.teamId.toString(),
          teamName: team?.name || 'Неизвестная команда',
          teamMemberCount: team?.memberCount || 0,
          message: i.message,
          createdAt: i.createdAt,
        }
      }),
    })
  } catch (error) {
    console.error('Get my invitations error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

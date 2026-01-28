import { NextRequest, NextResponse } from 'next/server'
import { collections } from '@/lib/db/collections'
import { getCurrentUser } from '@/lib/auth/session'

interface RouteContext {
  params: Promise<{ slug: string }>
}

// GET /api/marathons/[slug]/my-team/applications - Get applications to my team
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

    if (!participant || !participant.teamId) {
      return NextResponse.json(
        { error: 'Вы не состоите в команде' },
        { status: 404 }
      )
    }

    const applicationsCollection = await collections.applications()
    const applications = await applicationsCollection
      .find({ teamId: participant.teamId, status: 'pending' })
      .sort({ createdAt: -1 })
      .toArray()

    // Get applicant info
    const participantIds = applications.map((a) => a.participantId)
    const applicants = await participantsCollection
      .find({ _id: { $in: participantIds } })
      .toArray()
    const applicantMap = new Map(
      applicants.map((p) => [
        p._id.toString(),
        { name: p.name || 'Без имени', nickname: p.nickname, roles: p.roles },
      ])
    )

    return NextResponse.json({
      applications: applications.map((a) => {
        const applicant = applicantMap.get(a.participantId.toString())
        return {
          id: a._id.toString(),
          participantId: a.participantId.toString(),
          participantName: applicant?.name || 'Без имени',
          participantNickname: applicant?.nickname,
          participantRoles: applicant?.roles || [],
          status: a.status,
          message: a.message,
          createdAt: a.createdAt,
        }
      }),
    })
  } catch (error) {
    console.error('Get team applications error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

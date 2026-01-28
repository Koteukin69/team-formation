import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { collections } from '@/lib/db/collections'
import { getCurrentUser } from '@/lib/auth/session'

interface RouteContext {
  params: Promise<{ slug: string; invitationId: string }>
}

// POST /api/marathons/[slug]/my-invitations/[invitationId]/decline - Decline invitation
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { slug, invitationId } = await context.params
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
    let invitation
    try {
      invitation = await invitationsCollection.findOne({
        _id: new ObjectId(invitationId),
        participantId: participant._id,
      })
    } catch {
      return NextResponse.json({ error: 'Приглашение не найдено' }, { status: 404 })
    }

    if (!invitation) {
      return NextResponse.json({ error: 'Приглашение не найдено' }, { status: 404 })
    }

    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: 'Приглашение уже обработано' },
        { status: 409 }
      )
    }

    await invitationsCollection.updateOne(
      { _id: invitation._id },
      { $set: { status: 'declined', resolvedAt: new Date() } }
    )

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('Decline invitation error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

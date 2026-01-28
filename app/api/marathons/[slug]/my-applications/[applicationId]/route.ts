import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { collections } from '@/lib/db/collections'
import { getCurrentUser } from '@/lib/auth/session'

interface RouteContext {
  params: Promise<{ slug: string; applicationId: string }>
}

// DELETE /api/marathons/[slug]/my-applications/[applicationId] - Cancel application
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { slug, applicationId } = await context.params
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
    let application
    try {
      application = await applicationsCollection.findOne({
        _id: new ObjectId(applicationId),
        participantId: participant._id,
      })
    } catch {
      return NextResponse.json({ error: 'Заявка не найдена' }, { status: 404 })
    }

    if (!application) {
      return NextResponse.json({ error: 'Заявка не найдена' }, { status: 404 })
    }

    if (application.status !== 'pending') {
      return NextResponse.json(
        { error: 'Заявка уже обработана' },
        { status: 409 }
      )
    }

    await applicationsCollection.updateOne(
      { _id: application._id },
      { $set: { status: 'cancelled', resolvedAt: new Date() } }
    )

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('Cancel application error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

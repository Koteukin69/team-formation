import { NextRequest, NextResponse } from 'next/server'
import { collections } from '@/lib/db/collections'
import { getCurrentUser } from '@/lib/auth/session'
import { ObjectId } from 'mongodb'

interface RouteContext {
  params: Promise<{ slug: string; userId: string }>
}

// DELETE /api/marathons/[slug]/organizers/[userId] - Remove organizer
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { slug, userId } = await context.params

    // Validate user ID
    if (!ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Неверный ID пользователя' }, { status: 400 })
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

    // Cannot remove the creator
    if (userId === marathon.creatorId.toString()) {
      return NextResponse.json(
        { error: 'Нельзя удалить создателя марафона' },
        { status: 403 }
      )
    }

    // Check if user is actually an organizer
    const isTargetOrganizer = marathon.organizers.some(
      (orgId) => orgId.toString() === userId
    )

    if (!isTargetOrganizer) {
      return NextResponse.json(
        { error: 'Пользователь не является организатором' },
        { status: 404 }
      )
    }

    // Remove from organizers
    await marathonsCollection.updateOne(
      { _id: marathon._id },
      { $pull: { organizers: new ObjectId(userId) } }
    )

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('Remove organizer error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

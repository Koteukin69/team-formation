import { NextRequest, NextResponse } from 'next/server'
import { collections } from '@/lib/db/collections'
import { getCurrentUser } from '@/lib/auth/session'
import { ObjectId } from 'mongodb'
import { z } from 'zod'

interface RouteContext {
  params: Promise<{ slug: string }>
}

const addOrganizerSchema = z.object({
  userId: z.string().refine((val) => ObjectId.isValid(val), 'Неверный ID пользователя'),
})

// GET /api/marathons/[slug]/organizers - Get all organizers
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

    // Check if user is organizer or creator
    const isOrganizer = marathon.organizers.some(
      (orgId) => orgId.toString() === user._id.toString()
    )
    const isCreator = marathon.creatorId.toString() === user._id.toString()

    if (!isOrganizer && !isCreator) {
      return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 })
    }

    // Get all organizer user data
    const usersCollection = await collections.users()
    const organizerUsers = await usersCollection
      .find({
        _id: { $in: marathon.organizers },
      })
      .toArray()

    // Get creator data
    const creator = await usersCollection.findOne({ _id: marathon.creatorId })

    const organizers = organizerUsers.map((org) => ({
      id: org._id.toString(),
      email: org.email,
      isCreator: org._id.toString() === marathon.creatorId.toString(),
    }))

    // Add creator if not already in organizers array
    if (creator && !organizers.some((org) => org.isCreator)) {
      organizers.unshift({
        id: creator._id.toString(),
        email: creator.email,
        isCreator: true,
      })
    }

    return NextResponse.json({ organizers })
  } catch (error) {
    console.error('Get organizers error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// POST /api/marathons/[slug]/organizers - Add organizer
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

    // Parse and validate request body
    const body = await request.json()
    const validation = addOrganizerSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Неверные данные', details: (validation.error as any).errors },
        { status: 422 }
      )
    }

    const { userId } = validation.data
    const userIdObj = new ObjectId(userId)

    // Check if user exists
    const usersCollection = await collections.users()
    const targetUser = await usersCollection.findOne({ _id: userIdObj })

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      )
    }

    // Check if already an organizer
    const isAlreadyOrganizer = marathon.organizers.some(
      (orgId) => orgId.toString() === userId
    )

    if (isAlreadyOrganizer || marathon.creatorId.toString() === userId) {
      return NextResponse.json(
        { error: 'Пользователь уже является организатором' },
        { status: 409 }
      )
    }

    // Add to organizers
    await marathonsCollection.updateOne(
      { _id: marathon._id },
      { $addToSet: { organizers: userIdObj } }
    )

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('Add organizer error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

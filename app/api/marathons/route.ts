import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { collections } from '@/lib/db/collections'
import { getCurrentUser } from '@/lib/auth/session'
import { createMarathonSchema } from '@/lib/validation/schemas'

// GET /api/marathons - List all marathons
export async function GET() {
  try {
    const marathonsCollection = await collections.marathons()
    const marathons = await marathonsCollection
      .find({})
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({
      marathons: marathons.map((m) => ({
        id: m._id.toString(),
        name: m.name,
        slug: m.slug,
        minTeamSize: m.minTeamSize,
        maxTeamSize: m.maxTeamSize,
        createdAt: m.createdAt,
      })),
    })
  } catch (error) {
    console.error('Get marathons error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// POST /api/marathons - Create a new marathon
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = createMarathonSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Ошибка валидации', details: parsed.error.flatten() },
        { status: 422 }
      )
    }

    const { name, slug, minTeamSize, maxTeamSize } = parsed.data

    const marathonsCollection = await collections.marathons()

    // Check if slug is taken
    const existing = await marathonsCollection.findOne({ slug })
    if (existing) {
      return NextResponse.json(
        { error: 'Это краткое название уже занято' },
        { status: 409 }
      )
    }

    // Create marathon
    const now = new Date()
    const result = await marathonsCollection.insertOne({
      name,
      slug,
      minTeamSize,
      maxTeamSize,
      creatorId: user._id,
      organizers: [user._id],
      createdAt: now,
      updatedAt: now,
    } as any)

    const marathon = await marathonsCollection.findOne({ _id: result.insertedId })

    return NextResponse.json(
      {
        id: marathon!._id.toString(),
        name: marathon!.name,
        slug: marathon!.slug,
        minTeamSize: marathon!.minTeamSize,
        maxTeamSize: marathon!.maxTeamSize,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create marathon error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

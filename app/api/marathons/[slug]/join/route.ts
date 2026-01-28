import { NextRequest, NextResponse } from 'next/server'
import { collections } from '@/lib/db/collections'
import { getCurrentUser } from '@/lib/auth/session'

interface RouteContext {
  params: Promise<{ slug: string }>
}

// POST /api/marathons/[slug]/join - Join marathon
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
      return NextResponse.json(
        { error: 'Марафон не найден' },
        { status: 404 }
      )
    }

    const participantsCollection = await collections.participants()

    // Check if already participant
    const existing = await participantsCollection.findOne({
      marathonId: marathon._id,
      userId: user._id,
    })

    if (existing) {
      if (existing.isBanned) {
        return NextResponse.json(
          { error: 'Вы заблокированы в этом марафоне' },
          { status: 403 }
        )
      }
      return NextResponse.json(
        { error: 'Вы уже участник этого марафона' },
        { status: 409 }
      )
    }

    // Create participant
    const now = new Date()
    await participantsCollection.insertOne({
      marathonId: marathon._id,
      userId: user._id,
      roles: [],
      technologies: [],
      isBanned: false,
      isSuspended: false,
      createdAt: now,
      updatedAt: now,
    } as any)

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('Join marathon error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

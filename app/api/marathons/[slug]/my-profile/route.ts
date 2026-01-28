import { NextRequest, NextResponse } from 'next/server'
import { collections } from '@/lib/db/collections'
import { getCurrentUser } from '@/lib/auth/session'
import { updateProfileSchema } from '@/lib/validation/schemas'

interface RouteContext {
  params: Promise<{ slug: string }>
}

// GET /api/marathons/[slug]/my-profile - Get my profile
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

    // Check if profile is filled
    if (!participant.name && !participant.nickname) {
      return new NextResponse(null, { status: 204 })
    }

    return NextResponse.json({
      id: participant._id.toString(),
      name: participant.name,
      nickname: participant.nickname,
      roles: participant.roles,
      technologies: participant.technologies,
      description: participant.description,
    })
  } catch (error) {
    console.error('Get my profile error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// PATCH /api/marathons/[slug]/my-profile - Update my profile
export async function PATCH(request: NextRequest, context: RouteContext) {
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

    // Check if user is organizer
    const isOrganizer = marathon.organizers.some(
      (orgId) => orgId.toString() === user._id.toString()
    ) || marathon.creatorId.toString() === user._id.toString()

    const participantsCollection = await collections.participants()
    let participant = await participantsCollection.findOne({
      marathonId: marathon._id,
      userId: user._id,
    })

    // If user is not a participant but is an organizer, create participant profile
    if (!participant && isOrganizer) {
      const now = new Date()
      const result = await participantsCollection.insertOne({
        marathonId: marathon._id,
        userId: user._id,
        name: '',
        nickname: '',
        roles: [],
        technologies: [],
        description: '',
        isBanned: false,
        isSuspended: false,
        createdAt: now,
        updatedAt: now,
      } as any)
      participant = await participantsCollection.findOne({ _id: result.insertedId })
    }

    if (!participant) {
      return NextResponse.json(
        { error: 'Вы не являетесь участником марафона' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const parsed = updateProfileSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Ошибка валидации', details: parsed.error.flatten() },
        { status: 422 }
      )
    }

    const { name, nickname, roles, technologies, description } = parsed.data

    // Check nickname uniqueness if changed
    if (nickname && nickname !== participant.nickname) {
      const existing = await participantsCollection.findOne({
        marathonId: marathon._id,
        nickname: nickname.toLowerCase(),
        _id: { $ne: participant._id },
      })

      if (existing) {
        return NextResponse.json(
          { error: 'Этот никнейм уже занят' },
          { status: 409 }
        )
      }
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() }
    if (name !== undefined) updates.name = name
    if (nickname !== undefined) updates.nickname = nickname?.toLowerCase()
    if (roles !== undefined) updates.roles = roles
    if (technologies !== undefined) updates.technologies = technologies
    if (description !== undefined) updates.description = description

    await participantsCollection.updateOne(
      { _id: participant._id },
      { $set: updates }
    )

    const updated = await participantsCollection.findOne({ _id: participant._id })

    return NextResponse.json({
      id: updated!._id.toString(),
      name: updated!.name,
      nickname: updated!.nickname,
      roles: updated!.roles,
      technologies: updated!.technologies,
      description: updated!.description,
    })
  } catch (error) {
    console.error('Update my profile error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

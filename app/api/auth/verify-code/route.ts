import { NextRequest, NextResponse } from 'next/server'
import { collections } from '@/lib/db/collections'
import { createSession } from '@/lib/auth/session'
import { verifyCodeSchema } from '@/lib/validation/schemas'
import { verifyCode } from '@/lib/utils'

const MAX_ATTEMPTS = 5

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = verifyCodeSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Ошибка валидации', details: parsed.error.flatten() },
        { status: 422 }
      )
    }

    const { email, code } = parsed.data
    const normalizedEmail = email.toLowerCase().trim()

    // Find auth code
    const authCodesCollection = await collections.authCodes()
    const authCode = await authCodesCollection.findOne({ email: normalizedEmail })

    if (!authCode) {
      return NextResponse.json(
        { error: 'Код не найден. Запросите новый код.' },
        { status: 401 }
      )
    }

    // Check expiration
    if (authCode.expiresAt < new Date()) {
      await authCodesCollection.deleteOne({ _id: authCode._id })
      return NextResponse.json(
        { error: 'Код истёк. Запросите новый код.' },
        { status: 410 }
      )
    }

    // Check attempts
    if (authCode.attempts >= MAX_ATTEMPTS) {
      await authCodesCollection.deleteOne({ _id: authCode._id })
      return NextResponse.json(
        { error: 'Превышено количество попыток. Запросите новый код.' },
        { status: 401 }
      )
    }

    // Verify code
    if (!verifyCode(code, authCode.code)) {
      await authCodesCollection.updateOne(
        { _id: authCode._id },
        { $inc: { attempts: 1 } }
      )
      return NextResponse.json(
        { error: 'Неверный код' },
        { status: 401 }
      )
    }

    // Delete used code
    await authCodesCollection.deleteOne({ _id: authCode._id })

    // Find or create user
    const usersCollection = await collections.users()
    let user = await usersCollection.findOne({ email: normalizedEmail })

    if (!user) {
      const result = await usersCollection.insertOne({
        email: normalizedEmail,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)
      user = await usersCollection.findOne({ _id: result.insertedId })
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Не удалось создать пользователя' },
        { status: 500 }
      )
    }

    // Create session
    await createSession(user)

    return NextResponse.json({
      status: 'ok',
      user: {
        id: user._id.toString(),
        email: user.email,
      },
    })
  } catch (error) {
    console.error('Verify code error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

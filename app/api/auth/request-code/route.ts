import { NextRequest, NextResponse } from 'next/server'
import { collections } from '@/lib/db/collections'
import { sendAuthCode } from '@/lib/email/client'
import { checkAndIncrementRateLimit } from '@/lib/rate-limit/limiter'
import { requestCodeSchema } from '@/lib/validation/schemas'
import { generateCode, hashCode } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = requestCodeSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Ошибка валидации', details: parsed.error.flatten() },
        { status: 422 }
      )
    }

    const { email } = parsed.data
    const normalizedEmail = email.toLowerCase().trim()

    // Check rate limits
    const minuteLimit = await checkAndIncrementRateLimit(`email:${normalizedEmail}`, 'email_minute')
    if (!minuteLimit.allowed) {
      return NextResponse.json(
        { error: 'Слишком много запросов. Попробуйте через минуту.' },
        { status: 429 }
      )
    }

    const hourLimit = await checkAndIncrementRateLimit(`email:${normalizedEmail}`, 'email_hour')
    if (!hourLimit.allowed) {
      return NextResponse.json(
        { error: 'Превышен лимит запросов. Попробуйте позже.' },
        { status: 429 }
      )
    }

    // Generate and store code
    const code = generateCode()
    const hashedCode = hashCode(code)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    const authCodesCollection = await collections.authCodes()
    await authCodesCollection.updateOne(
      { email: normalizedEmail },
      {
        $set: {
          code: hashedCode,
          expiresAt,
          attempts: 0,
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    )

    // Send email
    const sent = await sendAuthCode(normalizedEmail, code)
    if (!sent) {
      return NextResponse.json(
        { error: 'Не удалось отправить письмо. Попробуйте позже.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('Request code error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

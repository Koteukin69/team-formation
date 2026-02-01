import { NextRequest, NextResponse } from 'next/server'
import { generateCode } from '@/lib/utils';
import { send } from '@/lib/email/client'
import Config from '@/config';
import clientPromise from '@/lib/db/mongodb'
import { requestCodeSchema } from '@/lib/validator';
import { checkRateLimit, recordRequest, getClientIP } from '@/lib/rate-limiter';

export async function POST(req: NextRequest) {
  try {
    const validated = (await requestCodeSchema.safeParseAsync(await req.json()));
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Неверный email' },
        { status: 422 }
      )
    }

    const normalizedEmail = (validated.data.email as string).toLowerCase().trim()
    const clientIP = getClientIP(req)
    
    const ipMinuteLimit = await checkRateLimit(
      `ip:${clientIP}`,
      Config.rateLimits.ipPerMinute.window,
      Config.rateLimits.ipPerMinute.max
    )
    if (!ipMinuteLimit.allowed) {
      return NextResponse.json(
        { error: 'Слишком много запросов. Попробуйте позже.', retryAfter: ipMinuteLimit.retryAfterSeconds },
        { status: 429 }
      )
    }
    
    const ipHourLimit = await checkRateLimit(
      `ip:${clientIP}`,
      Config.rateLimits.ipPerHour.window,
      Config.rateLimits.ipPerHour.max
    )
    if (!ipHourLimit.allowed) {
      return NextResponse.json(
        { error: 'Слишком много запросов. Попробуйте позже.', retryAfter: ipHourLimit.retryAfterSeconds },
        { status: 429 }
      )
    }
    
    const emailLimit = await checkRateLimit(
      `email:${normalizedEmail}`,
      Config.rateLimits.email.window,
      Config.rateLimits.email.max
    )
    if (!emailLimit.allowed) {
      return NextResponse.json(
        { error: 'Слишком много запросов на этот email. Попробуйте позже.', retryAfter: emailLimit.retryAfterSeconds },
        { status: 429 }
      )
    }

    const code: string = generateCode();
    const expiresAt = new Date(Date.now() + Config.authCodeTtlMs);
    
    const client = await clientPromise
    const collection = client.db('auth').collection('codes')

    await collection.updateOne(
      { email: normalizedEmail },
      {
        $set: {
          code: code,
          expiresAt,
          attempts: 0,
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    const sent = await send(normalizedEmail, Config.emailSubject({"name": Config.name}), Config.emailHtml({"code": code, "name": Config.name}));
    if (!sent) {
      return NextResponse.json(
        { error: 'Не удалось отправить письмо. Попробуйте позже.' },
        { status: 500 }
      )
    }

    await Promise.all([
      recordRequest(`ip:${clientIP}`),
      recordRequest(`email:${normalizedEmail}`)
    ])

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

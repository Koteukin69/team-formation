import { NextRequest, NextResponse } from 'next/server'
import { generateCode } from '@/lib/utils';
import { send } from '@/lib/email/client'
import Config from '@/config';
import { collections } from '@/lib/db/collections'
import { schemas } from '@/lib/validator';

export async function POST(req: NextRequest) {
  try {
    const validated = (await schemas.requestCode.safeParseAsync(await req.json()));
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Неверный email' },
        { status: 422 }
      )
    }

    const normalizedEmail = (validated.data.email as string).toLowerCase().trim()

    const code: number = generateCode();

    const collection = await collections.emailCodes();

    await collection.updateOne(
      { email: normalizedEmail },
      {
        $set: {
          code,
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

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

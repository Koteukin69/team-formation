import { NextRequest, NextResponse } from 'next/server'
import { collections } from '@/lib/db/collections'
import { createToken } from '@/lib/auth';
import { schemas } from '@/lib/validator';
import { User, Role } from "@/lib/types";
import { Collection } from "mongodb";

export async function POST(req: NextRequest) {
  try {
    const validated = (await schemas.verifyCode.safeParseAsync(await req.json()));
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Неверный email или код' },
        { status: 422 }
      )
    }

    const { email, code } = validated.data as { email: string, code: string };
    const normalizedEmail = email.toLowerCase().trim();

    const codesCollection = await collections.emailCodes();
    const authCode = await codesCollection.findOne({email: normalizedEmail});

    if (!authCode) {
      return NextResponse.json(
        { error: 'Код не найден. Запросите новый код.' },
        { status: 401 }
      )
    }

    if (new Date(authCode.createdAt.getDate() + 10 * 60000) > new Date()) {
      await codesCollection.deleteOne({_id: authCode._id})
      return NextResponse.json(
        { error: 'Код истёк. Запросите новый код.' },
        { status: 410 }
      )
    }

    if (code !== authCode.code.toString()) {
      const newAttempts = (authCode.attempts || 0) + 1;

      if (newAttempts >= 5) {
        await codesCollection.deleteOne({_id: authCode._id});
        return NextResponse.json(
          { error: 'Превышено количество попыток. Запросите новый код.', exhausted: true },
          { status: 429 }
        );
      }

      await codesCollection.updateOne(
        {_id: authCode._id},
        {$set: {attempts: newAttempts}}
      );

      return NextResponse.json(
        { error: 'Неверный код', attemptsLeft: 5 - newAttempts },
        { status: 401 }
      );
    }

    await codesCollection.deleteOne({_id: authCode._id});

    const usersCollection: Collection<User> = await collections.users();
    const user = (await usersCollection.findOne({email: normalizedEmail})) as User ??
      (await usersCollection.updateOne({email: normalizedEmail},
        {
          $set: {
            role: "user"
          },
        },
        {upsert: true})
      );

    const role: Role = user ? user.role : "user";

    const token = await createToken({
      userId: user._id.toString(),
      email: normalizedEmail,
      role: role
    });

    const response: NextResponse = NextResponse.json({
      success: true,
      message: 'Logged in successfully'
    });

    
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      domain: `.${(process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost').split(':')[0]}`,
    });

    return response;
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/db/mongodb'
import { createToken } from '@/lib/auth';
import { verifyCodeSchema } from '@/lib/validator';

export async function POST(req: NextRequest) {
  try {
    const validated = (await verifyCodeSchema.safeParse(await req.json()));
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Неверный email или код' },
        { status: 422 }
      )
    }

    const { email, code }:{ email: string, code: string } = validated.data as { email: string, code: string };
    const normalizedEmail = email.toLowerCase().trim();
    
    const client = await clientPromise;
    const db = client.db('auth');
    const codes = db.collection('codes');
    const authCode = await codes.findOne({ email: normalizedEmail });

    if (!authCode) {
      return NextResponse.json(
        { error: 'Код не найден. Запросите новый код.' },
        { status: 401 }
      )
    }

    if (authCode.expiresAt < new Date()) {
      await codes.deleteOne({ _id: authCode._id })
      return NextResponse.json(
        { error: 'Код истёк. Запросите новый код.' },
        { status: 410 }
      )
    }

    if (code !== authCode.code) {
      return NextResponse.json(
        { error: 'Неверный код' },
        { status: 401 }
      )
    }

    await codes.deleteOne({ _id: authCode._id });

    const users = db.collection('users');
    const user = await users.findOne({ email: normalizedEmail })

    if (!user) {
      await users.updateOne({email: normalizedEmail},
        {
          $set: {
            role: "user"
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        {upsert: true});
    }
    const role = user ? user.role : "user";

    const token = await createToken({
      email: email,
      role: role
    });

    const response = NextResponse.json({ 
      success: true,
      message: 'Logged in successfully' 
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,  
      secure: process.env.NODE_ENV === 'production', 
      sameSite: 'lax', 
      maxAge: 60 * 60 * 24 
    });

    return response;
  } catch (error) {
    console.error('Verify code error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
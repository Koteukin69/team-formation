import { NextResponse } from 'next/server'
import { destroySession, getSession } from '@/lib/auth/session'

export async function POST() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      )
    }

    await destroySession()

    return NextResponse.json({ status: 'ok' })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

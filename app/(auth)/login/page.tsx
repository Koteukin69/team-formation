import { Suspense } from 'react'
import { LoginForm } from '@/components/auth/login-form'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Вход | Team Formation',
  description: 'Войдите в систему для участия в марафонах и поиска команды',
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Suspense fallback={<div className="animate-pulse">Загрузка...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}

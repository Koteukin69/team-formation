'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface ApplicationActionsProps {
  slug: string
  applicationId: string
  decisionSystem: string
  isLeader: boolean
}

export function ApplicationActions({
  slug,
  applicationId,
  decisionSystem,
  isLeader,
}: ApplicationActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleAction = async (action: 'accept' | 'reject') => {
    setLoading(action)

    try {
      // Create a request to accept/reject the application
      const response = await fetch(`/api/marathons/${slug}/my-team/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: action === 'accept' ? 'accept_application' : 'reject_application',
          applicationId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Произошла ошибка')
        return
      }

      if (decisionSystem === 'dictatorship' && isLeader) {
        toast.success(action === 'accept' ? 'Участник принят в команду' : 'Заявка отклонена')
      } else {
        toast.success('Запрос создан')
      }

      router.refresh()
    } catch {
      toast.error('Ошибка сети')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        onClick={() => handleAction('accept')}
        disabled={loading !== null}
      >
        {loading === 'accept'
          ? 'Обработка...'
          : decisionSystem === 'dictatorship' && isLeader
          ? 'Принять'
          : 'Запрос на принятие'}
      </Button>
      <Button
        variant="outline"
        onClick={() => handleAction('reject')}
        disabled={loading !== null}
      >
        {loading === 'reject'
          ? 'Обработка...'
          : decisionSystem === 'dictatorship' && isLeader
          ? 'Отклонить'
          : 'Запрос на отклонение'}
      </Button>
    </div>
  )
}

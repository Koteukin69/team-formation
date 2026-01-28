'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface InvitationActionsProps {
  slug: string
  invitationId: string
}

export function InvitationActions({ slug, invitationId }: InvitationActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<'accept' | 'decline' | null>(null)

  const handleAction = async (action: 'accept' | 'decline') => {
    setLoading(action)

    try {
      const response = await fetch(
        `/api/marathons/${slug}/my-invitations/${invitationId}/${action}`,
        { method: 'POST' }
      )

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Произошла ошибка')
        return
      }

      if (action === 'accept') {
        toast.success('Вы вступили в команду!')
        router.push(`/${slug}/my-team`)
      } else {
        toast.success('Приглашение отклонено')
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
      <Button onClick={() => handleAction('accept')} disabled={loading !== null}>
        {loading === 'accept' ? 'Принятие...' : 'Принять'}
      </Button>
      <Button
        variant="outline"
        onClick={() => handleAction('decline')}
        disabled={loading !== null}
      >
        {loading === 'decline' ? 'Отклонение...' : 'Отклонить'}
      </Button>
    </div>
  )
}

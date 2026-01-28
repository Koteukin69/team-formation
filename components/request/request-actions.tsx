'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface RequestActionsProps {
  slug: string
  requestId: string
  decisionSystem: string
  isLeader: boolean
  myVote?: string
  isAuthor: boolean
}

export function RequestActions({
  slug,
  requestId,
  decisionSystem,
  isLeader,
  myVote,
  isAuthor,
}: RequestActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleVote = async (vote: 'approve' | 'reject') => {
    setLoading(vote)

    try {
      const response = await fetch(
        `/api/marathons/${slug}/my-team/requests/${requestId}/vote`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vote }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Произошла ошибка')
        return
      }

      if (data.requestStatus === 'approved') {
        toast.success('Запрос одобрен')
      } else if (data.requestStatus === 'rejected') {
        toast.success('Запрос отклонён')
      } else {
        toast.success('Голос учтён')
      }

      router.refresh()
    } catch {
      toast.error('Ошибка сети')
    } finally {
      setLoading(null)
    }
  }

  const handleDecide = async (decision: 'approve' | 'reject') => {
    setLoading(decision)

    try {
      const response = await fetch(
        `/api/marathons/${slug}/my-team/requests/${requestId}/decide`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ decision }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Произошла ошибка')
        return
      }

      toast.success(decision === 'approve' ? 'Запрос одобрен' : 'Запрос отклонён')
      router.refresh()
    } catch {
      toast.error('Ошибка сети')
    } finally {
      setLoading(null)
    }
  }

  if (decisionSystem === 'dictatorship') {
    if (!isLeader) {
      return (
        <p className="text-sm text-muted-foreground">
          Ожидание решения тимлида
        </p>
      )
    }

    return (
      <div className="flex gap-2">
        <Button
          onClick={() => handleDecide('approve')}
          disabled={loading !== null}
        >
          {loading === 'approve' ? 'Одобрение...' : 'Одобрить'}
        </Button>
        <Button
          variant="outline"
          onClick={() => handleDecide('reject')}
          disabled={loading !== null}
        >
          {loading === 'reject' ? 'Отклонение...' : 'Отклонить'}
        </Button>
      </div>
    )
  }

  // Democracy mode
  if (myVote) {
    return (
      <p className="text-sm">
        Вы проголосовали:{' '}
        <Badge variant={myVote === 'approve' ? 'default' : 'secondary'}>
          {myVote === 'approve' ? 'За' : 'Против'}
        </Badge>
      </p>
    )
  }

  return (
    <div className="flex gap-2">
      <Button
        onClick={() => handleVote('approve')}
        disabled={loading !== null}
      >
        {loading === 'approve' ? 'Голосование...' : 'За'}
      </Button>
      <Button
        variant="outline"
        onClick={() => handleVote('reject')}
        disabled={loading !== null}
      >
        {loading === 'reject' ? 'Голосование...' : 'Против'}
      </Button>
    </div>
  )
}

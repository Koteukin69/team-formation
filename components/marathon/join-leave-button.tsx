'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface JoinLeaveButtonProps {
  slug: string
  isParticipant: boolean
}

export function JoinLeaveButton({ slug, isParticipant }: JoinLeaveButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)

    try {
      const endpoint = isParticipant
        ? `/api/marathons/${slug}/leave`
        : `/api/marathons/${slug}/join`

      const response = await fetch(endpoint, { method: 'POST' })
      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Произошла ошибка')
        return
      }

      toast.success(
        isParticipant
          ? 'Вы покинули марафон'
          : 'Вы присоединились к марафону'
      )
      router.refresh()
    } catch {
      toast.error('Ошибка сети')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleClick}
      disabled={loading}
      variant={isParticipant ? 'outline' : 'default'}
    >
      {loading
        ? 'Загрузка...'
        : isParticipant
        ? 'Покинуть марафон'
        : 'Присоединиться'}
    </Button>
  )
}

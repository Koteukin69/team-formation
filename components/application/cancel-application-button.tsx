'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface CancelApplicationButtonProps {
  slug: string
  applicationId: string
}

export function CancelApplicationButton({ slug, applicationId }: CancelApplicationButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleCancel = async () => {
    setLoading(true)

    try {
      const response = await fetch(`/api/marathons/${slug}/my-applications/${applicationId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Произошла ошибка')
        return
      }

      toast.success('Заявка отменена')
      router.refresh()
    } catch {
      toast.error('Ошибка сети')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleCancel} disabled={loading}>
      {loading ? 'Отмена...' : 'Отменить заявку'}
    </Button>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface LeaveTeamButtonProps {
  slug: string
}

export function LeaveTeamButton({ slug }: LeaveTeamButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLeave = async () => {
    setLoading(true)

    try {
      const response = await fetch(`/api/marathons/${slug}/my-team/leave`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Произошла ошибка')
        return
      }

      if (data.teamDeleted) {
        toast.success('Вы покинули команду. Команда была удалена.')
      } else if (data.teamBecameDemocracy) {
        toast.success('Вы покинули команду. Команда перешла в режим демократии.')
      } else {
        toast.success('Вы покинули команду')
      }

      setOpen(false)
      router.push(`/${slug}/teams`)
      router.refresh()
    } catch {
      toast.error('Ошибка сети')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Покинуть команду
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Покинуть команду?</DialogTitle>
          <DialogDescription>
            Вы уверены, что хотите покинуть команду? Если вы единственный участник,
            команда будет удалена.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Отмена
          </Button>
          <Button variant="destructive" onClick={handleLeave} disabled={loading}>
            {loading ? 'Выход...' : 'Покинуть'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

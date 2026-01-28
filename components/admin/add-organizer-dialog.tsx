'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

interface AddOrganizerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (userId: string) => Promise<void>
}

export function AddOrganizerDialog({
  open,
  onOpenChange,
  onSubmit,
}: AddOrganizerDialogProps) {
  const [userId, setUserId] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!userId.trim()) {
      return
    }

    setIsLoading(true)
    try {
      await onSubmit(userId)
      setUserId('')
      onOpenChange(false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Добавить организатора</DialogTitle>
            <DialogDescription>
              Введите ID пользователя, которого хотите сделать организатором марафона
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="userId">User ID</Label>
              <Input
                id="userId"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="507f1f77bcf86cd799439011"
                required
              />
              <p className="text-xs text-muted-foreground">
                24-символьный MongoDB ObjectId
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Загрузка...' : 'Добавить'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

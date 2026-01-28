'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ApplicationFormProps {
  slug: string
  teamId: string
}

export function ApplicationForm({ slug, teamId }: ApplicationFormProps) {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/marathons/${slug}/teams/${teamId}/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim() || undefined }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Не удалось подать заявку')
        return
      }

      // Success - redirect to applications page
      router.push(`/${slug}/my-applications`)
      router.refresh()
    } catch (error) {
      console.error('Application submit error:', error)
      setError('Не удалось подать заявку')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div>
        <Label htmlFor="message">Сообщение (опционально)</Label>
        <Textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Расскажите о себе и почему хотите вступить в команду..."
          maxLength={500}
          rows={4}
          className="mt-1"
        />
        <p className="text-sm text-muted-foreground mt-1">
          {message.length}/500 символов
        </p>
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? 'Отправка...' : 'Подать заявку'}
      </Button>
    </form>
  )
}

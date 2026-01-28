'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'

export function CreateMarathonForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [minTeamSize, setMinTeamSize] = useState(2)
  const [maxTeamSize, setMaxTeamSize] = useState(5)

  const handleSlugChange = (value: string) => {
    // Auto-format slug: lowercase, only allowed chars
    const formatted = value
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '')
      .slice(0, 16)
    setSlug(formatted)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/marathons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug,
          minTeamSize,
          maxTeamSize,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Произошла ошибка')
        return
      }

      toast.success('Марафон создан!')
      router.push(`/${data.slug}`)
    } catch {
      setError('Ошибка сети. Проверьте подключение.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Название марафона</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Game Jam 2026"
              required
              maxLength={100}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Краткое название (URL)</Label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">/</span>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="gamejam2026"
                required
                maxLength={16}
                disabled={loading}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Только латинские буквы, цифры, дефис и подчёркивание. До 16 символов.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minTeamSize">Мин. участников в команде</Label>
              <Input
                id="minTeamSize"
                type="number"
                min={1}
                max={50}
                value={minTeamSize}
                onChange={(e) => setMinTeamSize(parseInt(e.target.value) || 1)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxTeamSize">Макс. участников в команде</Label>
              <Input
                id="maxTeamSize"
                type="number"
                min={1}
                max={50}
                value={maxTeamSize}
                onChange={(e) => setMaxTeamSize(parseInt(e.target.value) || 1)}
                disabled={loading}
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Создание...' : 'Создать марафон'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

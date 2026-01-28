'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import type { ReferenceItem } from '@/lib/references'

interface CreateTeamFormProps {
  slug: string
  managementTypes: ReferenceItem[]
  decisionSystems: ReferenceItem[]
  genres: ReferenceItem[]
}

export function CreateTeamForm({
  slug,
  managementTypes,
  decisionSystems,
  genres,
}: CreateTeamFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [managementType, setManagementType] = useState('scrum')
  const [decisionSystem, setDecisionSystem] = useState('democracy')
  const [genre, setGenre] = useState('')
  const [description, setDescription] = useState('')
  const [chatLink, setChatLink] = useState('')
  const [gitLink, setGitLink] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`/api/marathons/${slug}/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          managementType,
          decisionSystem,
          genre: genre || undefined,
          description: description || undefined,
          chatLink: chatLink || undefined,
          gitLink: gitLink || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Произошла ошибка')
        return
      }

      toast.success('Команда создана!')
      router.push(`/${slug}/my-team`)
      router.refresh()
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
            <Label htmlFor="name">Название команды *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Dream Team"
              required
              maxLength={100}
              disabled={loading}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Тип менеджмента *</Label>
              <Select value={managementType} onValueChange={setManagementType} disabled={loading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {managementTypes.map((mt) => (
                    <SelectItem key={mt.id} value={mt.id}>
                      {mt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Система принятия решений *</Label>
              <Select value={decisionSystem} onValueChange={setDecisionSystem} disabled={loading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {decisionSystems.map((ds) => (
                    <SelectItem key={ds.id} value={ds.id}>
                      {ds.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {decisionSystem === 'dictatorship'
                  ? 'Вы станете тимлидом и будете принимать решения единолично'
                  : 'Решения принимаются голосованием большинства'}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Жанр игры</Label>
            <Select value={genre} onValueChange={setGenre} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите жанр" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Не указан</SelectItem>
                {genres.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Описание команды</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Расскажите о вашей команде, идее проекта..."
              maxLength={2000}
              disabled={loading}
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="chatLink">Ссылка на чат</Label>
              <Input
                id="chatLink"
                type="url"
                value={chatLink}
                onChange={(e) => setChatLink(e.target.value)}
                placeholder="https://t.me/..."
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gitLink">Ссылка на репозиторий</Label>
              <Input
                id="gitLink"
                type="url"
                value={gitLink}
                onChange={(e) => setGitLink(e.target.value)}
                placeholder="https://github.com/..."
                disabled={loading}
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Создание...' : 'Создать команду'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

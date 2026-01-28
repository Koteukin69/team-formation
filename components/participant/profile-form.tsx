'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import type { ReferenceItem } from '@/lib/references'

interface ProfileFormProps {
  slug: string
  initialData: {
    name: string
    nickname: string
    roles: string[]
    technologies: string[]
    description: string
  }
  roles: ReferenceItem[]
  technologies: ReferenceItem[]
}

export function ProfileForm({ slug, initialData, roles, technologies }: ProfileFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState(initialData.name)
  const [nickname, setNickname] = useState(initialData.nickname)
  const [selectedRoles, setSelectedRoles] = useState<string[]>(initialData.roles)
  const [selectedTechnologies, setSelectedTechnologies] = useState<string[]>(
    initialData.technologies
  )
  const [description, setDescription] = useState(initialData.description)

  const handleNicknameChange = (value: string) => {
    const formatted = value
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '')
      .slice(0, 16)
    setNickname(formatted)
  }

  const toggleRole = (roleId: string) => {
    setSelectedRoles((prev) =>
      prev.includes(roleId)
        ? prev.filter((r) => r !== roleId)
        : [...prev, roleId]
    )
  }

  const toggleTechnology = (techId: string) => {
    setSelectedTechnologies((prev) =>
      prev.includes(techId)
        ? prev.filter((t) => t !== techId)
        : [...prev, techId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`/api/marathons/${slug}/my-profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          nickname,
          roles: selectedRoles,
          technologies: selectedTechnologies,
          description,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Произошла ошибка')
        return
      }

      toast.success('Профиль обновлён')
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
            <Label htmlFor="name">ФИО</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Иван Иванов"
              maxLength={100}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nickname">Никнейм</Label>
            <Input
              id="nickname"
              value={nickname}
              onChange={(e) => handleNicknameChange(e.target.value)}
              placeholder="ivan123"
              maxLength={16}
              disabled={loading}
            />
            <p className="text-sm text-muted-foreground">
              Только латинские буквы, цифры, дефис и подчёркивание
            </p>
          </div>

          <div className="space-y-2">
            <Label>Роли</Label>
            <div className="flex flex-wrap gap-2">
              {roles.map((role) => (
                <Badge
                  key={role.id}
                  variant={selectedRoles.includes(role.id) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleRole(role.id)}
                >
                  {role.name}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Технологии</Label>
            <div className="flex flex-wrap gap-2">
              {technologies.map((tech) => (
                <Badge
                  key={tech.id}
                  variant={selectedTechnologies.includes(tech.id) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleTechnology(tech.id)}
                >
                  {tech.name}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">О себе</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Расскажите о своём опыте, портфолио, предпочтениях..."
              maxLength={2000}
              disabled={loading}
              className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <p className="text-sm text-muted-foreground">
              {description.length}/2000 символов
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Сохранение...' : 'Сохранить профиль'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

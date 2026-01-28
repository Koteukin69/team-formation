'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { getRoleName, getTechnologyName, type ReferenceItem } from '@/lib/references'
import Link from 'next/link'

interface Participant {
  id: string
  name: string
  nickname?: string
  roles: string[]
  technologies: string[]
  hasTeam: boolean
}

interface ParticipantsListProps {
  slug: string
  participants: Participant[]
  currentFilters: {
    available?: boolean
    roles?: string[]
    technologies?: string[]
  }
  roles: ReferenceItem[]
  technologies: ReferenceItem[]
  currentUserId: string
}

export function ParticipantsList({
  slug,
  participants,
  currentFilters,
  roles,
  technologies,
  currentUserId,
}: ParticipantsListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateFilter = (key: string, value: string | boolean | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === null || value === false || value === '') {
      params.delete(key)
    } else {
      params.set(key, String(value))
    }
    router.push(`/${slug}/participants?${params.toString()}`)
  }

  const toggleRole = (roleId: string) => {
    const current = currentFilters.roles || []
    const updated = current.includes(roleId)
      ? current.filter((r) => r !== roleId)
      : [...current, roleId]
    updateFilter('roles', updated.length > 0 ? updated.join(',') : null)
  }

  const toggleTechnology = (techId: string) => {
    const current = currentFilters.technologies || []
    const updated = current.includes(techId)
      ? current.filter((t) => t !== techId)
      : [...current, techId]
    updateFilter('technologies', updated.length > 0 ? updated.join(',') : null)
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Button
                variant={currentFilters.available ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateFilter('available', !currentFilters.available)}
              >
                Без команды
              </Button>
            </div>

            <Separator />

            <div>
              <p className="text-sm font-medium mb-2">Роли</p>
              <div className="flex flex-wrap gap-2">
                {roles.map((role) => (
                  <Badge
                    key={role.id}
                    variant={currentFilters.roles?.includes(role.id) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleRole(role.id)}
                  >
                    {role.name}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Технологии</p>
              <div className="flex flex-wrap gap-2">
                {technologies.map((tech) => (
                  <Badge
                    key={tech.id}
                    variant={currentFilters.technologies?.includes(tech.id) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleTechnology(tech.id)}
                  >
                    {tech.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="text-sm text-muted-foreground mb-4">
        Найдено: {participants.length}
      </div>

      {participants.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Участники не найдены. Попробуйте изменить фильтры.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {participants.map((participant) => (
            <Link key={participant.id} href={`/${slug}/participants/${participant.id}`}>
              <Card className={`h-full transition-colors hover:bg-muted/50 ${participant.id === currentUserId ? 'border-primary' : ''}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>{participant.name}</span>
                    {participant.hasTeam && (
                      <Badge variant="secondary" className="text-xs">В команде</Badge>
                    )}
                  </CardTitle>
                  {participant.nickname && (
                    <p className="text-sm text-muted-foreground">@{participant.nickname}</p>
                  )}
                </CardHeader>
                <CardContent>
                  {participant.roles.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {participant.roles.slice(0, 3).map((role) => (
                        <Badge key={role} variant="secondary" className="text-xs">
                          {getRoleName(role)}
                        </Badge>
                      ))}
                      {participant.roles.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{participant.roles.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                  {participant.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {participant.technologies.slice(0, 3).map((tech) => (
                        <Badge key={tech} variant="outline" className="text-xs">
                          {getTechnologyName(tech)}
                        </Badge>
                      ))}
                      {participant.technologies.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{participant.technologies.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

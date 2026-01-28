'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  getManagementTypeName,
  getDecisionSystemName,
  getGenreName,
  getRoleName,
  type ReferenceItem,
} from '@/lib/references'
import { pluralize } from '@/lib/utils'

interface Team {
  id: string
  name: string
  managementType: string
  decisionSystem: string
  genre?: string
  memberCount: number
  openPositions: { id: string; role: string }[]
}

interface TeamsListProps {
  slug: string
  teams: Team[]
  currentFilters: {
    managementType?: string
    decisionSystem?: string
    genre?: string
    hasOpenPositions?: boolean
    openPositionRole?: string
  }
  managementTypes: ReferenceItem[]
  decisionSystems: ReferenceItem[]
  genres: ReferenceItem[]
  roles: ReferenceItem[]
}

export function TeamsList({
  slug,
  teams,
  currentFilters,
  managementTypes,
  decisionSystems,
  genres,
  roles,
}: TeamsListProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === null || value === '' || value === 'all') {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    router.push(`/${slug}/teams?${params.toString()}`)
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Тип менеджмента</label>
              <Select
                value={currentFilters.managementType || 'all'}
                onValueChange={(v) => updateFilter('managementType', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Все" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все</SelectItem>
                  {managementTypes.map((mt) => (
                    <SelectItem key={mt.id} value={mt.id}>
                      {mt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Система решений</label>
              <Select
                value={currentFilters.decisionSystem || 'all'}
                onValueChange={(v) => updateFilter('decisionSystem', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Все" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все</SelectItem>
                  {decisionSystems.map((ds) => (
                    <SelectItem key={ds.id} value={ds.id}>
                      {ds.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Жанр</label>
              <Select
                value={currentFilters.genre || 'all'}
                onValueChange={(v) => updateFilter('genre', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Все" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все</SelectItem>
                  {genres.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Открытая позиция</label>
              <Select
                value={currentFilters.openPositionRole || 'all'}
                onValueChange={(v) => updateFilter('openPositionRole', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Любая" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Любая</SelectItem>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="flex items-center gap-2">
            <Button
              variant={currentFilters.hasOpenPositions ? 'default' : 'outline'}
              size="sm"
              onClick={() =>
                updateFilter('hasOpenPositions', currentFilters.hasOpenPositions ? null : 'true')
              }
            >
              Есть открытые позиции
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="text-sm text-muted-foreground mb-4">
        Найдено: {teams.length}
      </div>

      {teams.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Команды не найдены. Попробуйте изменить фильтры.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Link key={team.id} href={`/${slug}/teams/${team.id}`}>
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{team.name}</CardTitle>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {getManagementTypeName(team.managementType)}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {getDecisionSystemName(team.decisionSystem)}
                    </Badge>
                    {team.genre && (
                      <Badge variant="outline" className="text-xs">
                        {getGenreName(team.genre)}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    {team.memberCount}{' '}
                    {pluralize(team.memberCount, 'участник', 'участника', 'участников')}
                  </p>

                  {team.openPositions.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Ищут:</p>
                      <div className="flex flex-wrap gap-1">
                        {team.openPositions.map((pos) => (
                          <Badge key={pos.id} variant="default" className="text-xs">
                            {getRoleName(pos.role)}
                          </Badge>
                        ))}
                      </div>
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

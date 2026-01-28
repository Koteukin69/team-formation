'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ModerationDialog } from './moderation-dialog'
import { toast } from 'sonner'

interface Team {
  id: string
  name: string
  memberCount: number
  isSuspended: boolean
  suspendReason?: string
  managementType: string
  decisionSystem: string
}

interface AdminTeamsListProps {
  teams: Team[]
  slug: string
}

type FilterType = 'all' | 'active' | 'suspended'

export function AdminTeamsList({ teams: initialTeams, slug }: AdminTeamsListProps) {
  const [teams, setTeams] = useState(initialTeams)
  const [filter, setFilter] = useState<FilterType>('all')
  const [suspendDialog, setSuspendDialog] = useState<{ open: boolean; team: Team | null }>({
    open: false,
    team: null,
  })
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; team: Team | null }>({
    open: false,
    team: null,
  })

  const filteredTeams = teams.filter((t) => {
    if (filter === 'active') return !t.isSuspended
    if (filter === 'suspended') return t.isSuspended
    return true
  })

  const handleSuspend = async (teamId: string, reason: string) => {
    try {
      const res = await fetch(`/api/marathons/${slug}/teams/${teamId}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Ошибка при отстранении команды')
      }

      // Update local state
      setTeams((prev) =>
        prev.map((t) =>
          t.id === teamId ? { ...t, isSuspended: true, suspendReason: reason } : t
        )
      )

      toast.success('Команда отстранена')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка при отстранении')
      throw error
    }
  }

  const handleUnsuspend = async (teamId: string) => {
    try {
      const res = await fetch(`/api/marathons/${slug}/teams/${teamId}/unsuspend`, {
        method: 'POST',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Ошибка при снятии отстранения')
      }

      // Update local state
      setTeams((prev) =>
        prev.map((t) =>
          t.id === teamId ? { ...t, isSuspended: false, suspendReason: undefined } : t
        )
      )

      toast.success('Отстранение снято')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка при снятии отстранения')
    }
  }

  const handleDelete = async (teamId: string) => {
    try {
      const res = await fetch(`/api/marathons/${slug}/teams/${teamId}/delete`, {
        method: 'POST',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Ошибка при удалении команды')
      }

      // Remove from local state
      setTeams((prev) => prev.filter((t) => t.id !== teamId))

      toast.success('Команда удалена')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка при удалении')
    }
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
          <TabsList>
            <TabsTrigger value="all">Все ({teams.length})</TabsTrigger>
            <TabsTrigger value="active">
              Активные ({teams.filter((t) => !t.isSuspended).length})
            </TabsTrigger>
            <TabsTrigger value="suspended">
              Отстранённые ({teams.filter((t) => t.isSuspended).length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-4">
        {filteredTeams.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Нет команд
            </CardContent>
          </Card>
        ) : (
          filteredTeams.map((team) => (
            <Card key={team.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{team.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {team.memberCount} {team.memberCount === 1 ? 'участник' : 'участников'}
                    </p>
                  </div>
                  {team.isSuspended && <Badge variant="destructive">Отстранена</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Badge variant="outline">{team.managementType}</Badge>
                  <Badge variant="outline">{team.decisionSystem}</Badge>
                </div>

                {team.isSuspended && team.suspendReason && (
                  <Alert>
                    <AlertDescription>
                      <strong>Причина:</strong> {team.suspendReason}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  {!team.isSuspended ? (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSuspendDialog({ open: true, team })}
                      >
                        Отстранить
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteDialog({ open: true, team })}
                      >
                        Удалить
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" onClick={() => handleUnsuspend(team.id)}>
                      Снять отстранение
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <ModerationDialog
        open={suspendDialog.open}
        onOpenChange={(open) => setSuspendDialog({ open, team: null })}
        title="Отстранить команду"
        description={`Вы уверены, что хотите отстранить команду "${suspendDialog.team?.name}"? Команда будет скрыта из списков и не сможет выполнять действия.`}
        actionLabel="Отстранить"
        onSubmit={(reason) => handleSuspend(suspendDialog.team!.id, reason)}
      />

      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, team: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить команду?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить команду "{deleteDialog.team?.name}"? Это действие
              нельзя отменить. Все участники будут удалены из команды.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteDialog.team) {
                  handleDelete(deleteDialog.team.id)
                }
              }}
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

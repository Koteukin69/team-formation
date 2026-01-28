'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ModerationDialog } from './moderation-dialog'
import { toast } from 'sonner'

interface Participant {
  id: string
  name: string
  nickname: string
  isBanned: boolean
  banReason?: string
  isSuspended: boolean
  suspendReason?: string
  hasTeam: boolean
  roles: string[]
  technologies: string[]
}

interface AdminParticipantsListProps {
  participants: Participant[]
  slug: string
}

type FilterType = 'all' | 'active' | 'banned' | 'suspended'

export function AdminParticipantsList({
  participants: initialParticipants,
  slug,
}: AdminParticipantsListProps) {
  const [participants, setParticipants] = useState(initialParticipants)
  const [filter, setFilter] = useState<FilterType>('all')
  const [banDialog, setBanDialog] = useState<{ open: boolean; participant: Participant | null }>({
    open: false,
    participant: null,
  })
  const [suspendDialog, setSuspendDialog] = useState<{
    open: boolean
    participant: Participant | null
  }>({
    open: false,
    participant: null,
  })

  const filteredParticipants = participants.filter((p) => {
    if (filter === 'active') return !p.isBanned && !p.isSuspended
    if (filter === 'banned') return p.isBanned
    if (filter === 'suspended') return p.isSuspended
    return true
  })

  const handleBan = async (participantId: string, reason: string) => {
    try {
      const res = await fetch(`/api/marathons/${slug}/participants/${participantId}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Ошибка при бане участника')
      }

      // Update local state
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === participantId
            ? { ...p, isBanned: true, banReason: reason, hasTeam: false }
            : p
        )
      )

      toast.success('Участник забанен')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка при бане участника')
      throw error
    }
  }

  const handleSuspend = async (participantId: string, reason: string) => {
    try {
      const res = await fetch(`/api/marathons/${slug}/participants/${participantId}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Ошибка при отстранении участника')
      }

      // Update local state
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === participantId
            ? { ...p, isSuspended: true, suspendReason: reason, hasTeam: false }
            : p
        )
      )

      toast.success('Участник отстранён')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка при отстранении')
      throw error
    }
  }

  const handleUnsuspend = async (participantId: string) => {
    try {
      const res = await fetch(`/api/marathons/${slug}/participants/${participantId}/unsuspend`, {
        method: 'POST',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Ошибка при снятии отстранения')
      }

      // Update local state
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === participantId
            ? { ...p, isSuspended: false, suspendReason: undefined }
            : p
        )
      )

      toast.success('Отстранение снято')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка при снятии отстранения')
    }
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
          <TabsList>
            <TabsTrigger value="all">Все ({participants.length})</TabsTrigger>
            <TabsTrigger value="active">
              Активные ({participants.filter((p) => !p.isBanned && !p.isSuspended).length})
            </TabsTrigger>
            <TabsTrigger value="banned">
              Забаненные ({participants.filter((p) => p.isBanned).length})
            </TabsTrigger>
            <TabsTrigger value="suspended">
              Отстранённые ({participants.filter((p) => p.isSuspended).length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-4">
        {filteredParticipants.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Нет участников
            </CardContent>
          </Card>
        ) : (
          filteredParticipants.map((participant) => (
            <Card key={participant.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{participant.name}</CardTitle>
                    {participant.nickname && (
                      <p className="text-sm text-muted-foreground mt-1">
                        @{participant.nickname}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap justify-end">
                    {participant.isBanned && (
                      <Badge variant="destructive">Забанен</Badge>
                    )}
                    {participant.isSuspended && (
                      <Badge variant="secondary">Отстранён</Badge>
                    )}
                    {participant.hasTeam && <Badge>В команде</Badge>}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {participant.roles.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Роли:</p>
                    <div className="flex flex-wrap gap-1">
                      {participant.roles.map((role) => (
                        <Badge key={role} variant="outline">
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {(participant.isBanned || participant.isSuspended) && (
                  <Alert>
                    <AlertDescription>
                      <strong>Причина:</strong>{' '}
                      {participant.banReason || participant.suspendReason}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  {!participant.isBanned && !participant.isSuspended && (
                    <>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() =>
                          setBanDialog({ open: true, participant })
                        }
                      >
                        Забанить
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          setSuspendDialog({ open: true, participant })
                        }
                      >
                        Отстранить
                      </Button>
                    </>
                  )}
                  {participant.isSuspended && !participant.isBanned && (
                    <Button
                      size="sm"
                      onClick={() => handleUnsuspend(participant.id)}
                    >
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
        open={banDialog.open}
        onOpenChange={(open) => setBanDialog({ open, participant: null })}
        title="Забанить участника"
        description={`Вы уверены, что хотите забанить ${banDialog.participant?.name}? Участник будет удалён из команды и не сможет вернуться в марафон.`}
        actionLabel="Забанить"
        onSubmit={(reason) => handleBan(banDialog.participant!.id, reason)}
      />

      <ModerationDialog
        open={suspendDialog.open}
        onOpenChange={(open) => setSuspendDialog({ open, participant: null })}
        title="Отстранить участника"
        description={`Вы уверены, что хотите отстранить ${suspendDialog.participant?.name}? Участник будет удалён из команды, но сможет вернуться после снятия отстранения.`}
        actionLabel="Отстранить"
        onSubmit={(reason) => handleSuspend(suspendDialog.participant!.id, reason)}
      />
    </>
  )
}

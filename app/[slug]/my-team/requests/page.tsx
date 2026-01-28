import { notFound, redirect } from 'next/navigation'
import { collections } from '@/lib/db/collections'
import { getCurrentUser } from '@/lib/auth/session'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RequestActions } from '@/components/request/request-actions'
import { formatRelativeTime } from '@/lib/utils'
import { getRoleName } from '@/lib/references'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ slug: string }>
}

export const metadata: Metadata = {
  title: 'Запросы команды',
}

const requestTypeLabels: Record<string, string> = {
  invite: 'Приглашение участника',
  open_position: 'Открытие позиции',
  close_position: 'Закрытие позиции',
  kick: 'Исключение участника',
  update_settings: 'Изменение настроек',
  accept_application: 'Принятие заявки',
  reject_application: 'Отклонение заявки',
  transfer_lead: 'Передача лидерства',
  change_decision_system: 'Изменение системы решений',
}

async function getRequestsData(slug: string, userId: any) {
  const marathonsCollection = await collections.marathons()
  const marathon = await marathonsCollection.findOne({ slug: slug.toLowerCase() })

  if (!marathon) return null

  const participantsCollection = await collections.participants()
  const participant = await participantsCollection.findOne({
    marathonId: marathon._id,
    userId: userId,
  })

  if (!participant || !participant.teamId) return { noTeam: true }

  const teamsCollection = await collections.teams()
  const team = await teamsCollection.findOne({ _id: participant.teamId })

  if (!team) return { noTeam: true }

  const teamRequestsCollection = await collections.teamRequests()
  const requests = await teamRequestsCollection
    .find({ teamId: team._id, status: 'pending' })
    .sort({ createdAt: -1 })
    .toArray()

  // Get author names
  const authorIds = requests.map((r) => r.authorId)
  const authors = await participantsCollection.find({ _id: { $in: authorIds } }).toArray()
  const authorMap = new Map(authors.map((a) => [a._id.toString(), a.name || 'Участник']))

  return {
    requests: requests.map((r) => ({
      id: r._id.toString(),
      type: r.type,
      status: r.status,
      authorId: r.authorId.toString(),
      authorName: authorMap.get(r.authorId.toString()) || 'Участник',
      data: r.data,
      votes: {
        approve: r.votes.filter((v) => v.vote === 'approve').length,
        reject: r.votes.filter((v) => v.vote === 'reject').length,
      },
      myVote: r.votes.find((v) => v.participantId.toString() === participant._id.toString())?.vote,
      createdAt: r.createdAt,
    })),
    teamMemberCount: team.memberCount,
    decisionSystem: team.decisionSystem,
    isLeader: team.leaderId?.toString() === participant._id.toString(),
    myParticipantId: participant._id.toString(),
  }
}

export default async function TeamRequestsPage({ params }: PageProps) {
  const { slug } = await params
  const user = await getCurrentUser()

  if (!user) {
    redirect(`/login?from=/${slug}/my-team/requests`)
  }

  const data = await getRequestsData(slug, user._id)

  if (!data) notFound()
  if ('noTeam' in data) {
    redirect(`/${slug}/teams`)
  }

  const { requests, teamMemberCount, decisionSystem, isLeader, myParticipantId } = data
  const majority = Math.floor(teamMemberCount / 2) + 1

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Запросы команды</h1>
      <p className="text-muted-foreground mb-6">
        {decisionSystem === 'democracy'
          ? `Решения принимаются голосованием (${majority} из ${teamMemberCount} голосов)`
          : 'Решения принимает тимлид'}
      </p>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Нет активных запросов</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <Card key={req.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {requestTypeLabels[req.type] || req.type}
                    </CardTitle>
                    <CardDescription>
                      От: {req.authorName} • {formatRelativeTime(new Date(req.createdAt))}
                    </CardDescription>
                  </div>
                  {decisionSystem === 'democracy' && (
                    <div className="flex gap-2">
                      <Badge variant="secondary">За: {req.votes.approve}</Badge>
                      <Badge variant="outline">Против: {req.votes.reject}</Badge>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {/* Request details */}
                {req.type === 'open_position' && req.data.role && (
                  <p className="text-sm mb-4">
                    Роль: <Badge>{getRoleName(req.data.role)}</Badge>
                    {req.data.description && (
                      <span className="text-muted-foreground ml-2">{req.data.description}</span>
                    )}
                  </p>
                )}

                {req.type === 'invite' && (
                  <p className="text-sm mb-4 text-muted-foreground">
                    {req.data.message || 'Приглашение без сообщения'}
                  </p>
                )}

                <RequestActions
                  slug={slug}
                  requestId={req.id}
                  decisionSystem={decisionSystem}
                  isLeader={isLeader}
                  myVote={req.myVote}
                  isAuthor={req.authorId === myParticipantId}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

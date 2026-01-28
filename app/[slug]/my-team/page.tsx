import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { collections } from '@/lib/db/collections'
import { getCurrentUser } from '@/lib/auth/session'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { LeaveTeamButton } from '@/components/team/leave-team-button'
import { getManagementTypeName, getDecisionSystemName, getGenreName, getRoleName } from '@/lib/references'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ slug: string }>
}

export const metadata: Metadata = {
  title: 'Моя команда',
}

async function getMyTeamData(slug: string, userId: any) {
  const marathonsCollection = await collections.marathons()
  const marathon = await marathonsCollection.findOne({ slug: slug.toLowerCase() })

  if (!marathon) return null

  const participantsCollection = await collections.participants()
  const participant = await participantsCollection.findOne({
    marathonId: marathon._id,
    userId: userId,
  })

  if (!participant) return { notParticipant: true }
  if (!participant.teamId) return { noTeam: true }

  const teamsCollection = await collections.teams()
  const team = await teamsCollection.findOne({ _id: participant.teamId })

  if (!team) return { noTeam: true }

  const members = await participantsCollection.find({ teamId: team._id }).toArray()

  const openPositionsCollection = await collections.openPositions()
  const positions = await openPositionsCollection.find({ teamId: team._id }).toArray()

  const teamRequestsCollection = await collections.teamRequests()
  const pendingRequests = await teamRequestsCollection.countDocuments({
    teamId: team._id,
    status: 'pending',
  })

  const applicationsCollection = await collections.applications()
  const pendingApplications = await applicationsCollection.countDocuments({
    teamId: team._id,
    status: 'pending',
  })

  return {
    marathon,
    team: {
      id: team._id.toString(),
      name: team.name,
      managementType: team.managementType,
      decisionSystem: team.decisionSystem,
      leaderId: team.leaderId?.toString(),
      genre: team.genre,
      description: team.description,
      chatLink: team.chatLink,
      gitLink: team.gitLink,
      memberCount: team.memberCount,
    },
    isLeader: team.leaderId?.toString() === participant._id.toString(),
    myParticipantId: participant._id.toString(),
    members: members.map((m) => ({
      id: m._id.toString(),
      name: m.name || 'Без имени',
      nickname: m.nickname,
      roles: m.roles,
      isLeader: team.leaderId?.toString() === m._id.toString(),
    })),
    openPositions: positions.map((p) => ({
      id: p._id.toString(),
      role: p.role,
      description: p.description,
    })),
    pendingRequests,
    pendingApplications,
  }
}

export default async function MyTeamPage({ params }: PageProps) {
  const { slug } = await params
  const user = await getCurrentUser()

  if (!user) {
    redirect(`/login?from=/${slug}/my-team`)
  }

  const data = await getMyTeamData(slug, user._id)

  if (!data) notFound()

  if ('notParticipant' in data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Присоединитесь к марафону, чтобы создать или вступить в команду
        </p>
      </div>
    )
  }

  if ('noTeam' in data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Вы пока не состоите в команде</p>
        <div className="flex justify-center gap-4">
          <Button asChild>
            <Link href={`/${slug}/teams/new`}>Создать команду</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/${slug}/teams`}>Найти команду</Link>
          </Button>
        </div>
      </div>
    )
  }

  const { team, isLeader, members, openPositions, pendingRequests, pendingApplications } = data

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{team.name}</h1>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="secondary">{getManagementTypeName(team.managementType)}</Badge>
            <Badge variant="outline">{getDecisionSystemName(team.decisionSystem)}</Badge>
            {team.genre && <Badge variant="outline">{getGenreName(team.genre)}</Badge>}
          </div>
        </div>
        <LeaveTeamButton slug={slug} />
      </div>

      {/* Quick actions */}
      {(pendingRequests > 0 || pendingApplications > 0) && (
        <Card className="border-primary">
          <CardContent className="py-4">
            <div className="flex flex-wrap gap-4">
              {pendingRequests > 0 && (
                <Link href={`/${slug}/my-team/requests`}>
                  <Badge variant="default" className="cursor-pointer">
                    {pendingRequests} активных запросов
                  </Badge>
                </Link>
              )}
              {pendingApplications > 0 && (
                <Link href={`/${slug}/my-team/applications`}>
                  <Badge variant="default" className="cursor-pointer">
                    {pendingApplications} заявок в команду
                  </Badge>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Members */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Участники ({team.memberCount})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {member.name}
                    {member.isLeader && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        Тимлид
                      </Badge>
                    )}
                  </p>
                  {member.nickname && (
                    <p className="text-sm text-muted-foreground">@{member.nickname}</p>
                  )}
                  {member.roles.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {member.roles.slice(0, 2).map((role) => (
                        <Badge key={role} variant="outline" className="text-xs">
                          {getRoleName(role)}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Open positions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Открытые позиции</CardTitle>
            <CardDescription>
              Позиции, на которые команда ищет участников
            </CardDescription>
          </CardHeader>
          <CardContent>
            {openPositions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Нет открытых позиций</p>
            ) : (
              <div className="space-y-2">
                {openPositions.map((pos) => (
                  <div key={pos.id} className="flex items-center justify-between">
                    <div>
                      <Badge>{getRoleName(pos.role)}</Badge>
                      {pos.description && (
                        <p className="text-sm text-muted-foreground mt-1">{pos.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Description and links */}
      {(team.description || team.chatLink || team.gitLink) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">О команде</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {team.description && <p className="whitespace-pre-wrap">{team.description}</p>}
            {(team.chatLink || team.gitLink) && (
              <>
                <Separator />
                <div className="flex flex-wrap gap-4">
                  {team.chatLink && (
                    <a
                      href={team.chatLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm"
                    >
                      Чат команды
                    </a>
                  )}
                  {team.gitLink && (
                    <a
                      href={team.gitLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm"
                    >
                      Репозиторий
                    </a>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Management actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Управление</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/${slug}/my-team/requests`}>Запросы команды</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/${slug}/my-team/applications`}>Заявки в команду</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

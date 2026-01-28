import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ObjectId } from 'mongodb'
import { collections } from '@/lib/db/collections'
import { getCurrentUser } from '@/lib/auth/session'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { getManagementTypeName, getDecisionSystemName, getGenreName, getRoleName } from '@/lib/references'
import { ApplicationForm } from '@/components/application/application-form'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ slug: string; teamId: string }>
}

export const metadata: Metadata = {
  title: 'Детали команды',
}

async function getTeamData(slug: string, teamId: string, userId: any) {
  const marathonsCollection = await collections.marathons()
  const marathon = await marathonsCollection.findOne({ slug: slug.toLowerCase() })

  if (!marathon) return null

  // Validate teamId
  if (!ObjectId.isValid(teamId)) return null

  // Check access rights
  const isOrganizer = marathon.organizers.some(
    (orgId) => orgId.toString() === userId.toString()
  ) || marathon.creatorId.toString() === userId.toString()

  const participantsCollection = await collections.participants()
  const participant = await participantsCollection.findOne({
    marathonId: marathon._id,
    userId: userId,
  })

  // Only participants or organizers can view
  if (!participant && !isOrganizer) {
    return { requiresJoin: true, marathon }
  }

  // Get team
  const teamsCollection = await collections.teams()
  const team = await teamsCollection.findOne({
    _id: new ObjectId(teamId),
    marathonId: marathon._id,
  })

  if (!team) return null

  // Get team members
  const members = await participantsCollection
    .find({ teamId: team._id })
    .toArray()

  // Get open positions
  const openPositionsCollection = await collections.openPositions()
  const openPositions = await openPositionsCollection
    .find({ teamId: team._id })
    .toArray()

  // Check current user status
  const hasTeam = !!participant?.teamId
  const applicationsCollection = await collections.applications()
  const hasApplication = participant
    ? await applicationsCollection.findOne({
        teamId: team._id,
        participantId: participant._id,
        status: 'pending',
      })
    : null

  const canApply = !hasTeam && !hasApplication && !team.isSuspended && !!participant

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
      isSuspended: team.isSuspended,
      suspendReason: team.suspendReason,
    },
    members: members.map((m) => ({
      id: m._id.toString(),
      name: m.name || 'Без имени',
      nickname: m.nickname,
      roles: m.roles,
      isLeader: team.leaderId?.toString() === m._id.toString(),
    })),
    openPositions: openPositions.map((p) => ({
      id: p._id.toString(),
      role: p.role,
      description: p.description,
    })),
    canApply,
    hasApplication: !!hasApplication,
  }
}

export default async function TeamPage({ params }: PageProps) {
  const { slug, teamId } = await params
  const user = await getCurrentUser()

  if (!user) {
    redirect(`/login?from=/${slug}/teams/${teamId}`)
  }

  const data = await getTeamData(slug, teamId, user._id)

  if (!data) notFound()

  if ('requiresJoin' in data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Присоединитесь к марафону, чтобы просматривать команды
        </p>
      </div>
    )
  }

  const { team, members, openPositions, canApply, hasApplication } = data

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="outline" asChild>
        <Link href={`/${slug}/teams`}>← Назад к списку</Link>
      </Button>

      {/* Suspended alert */}
      {team.isSuspended && (
        <Alert variant="destructive">
          <AlertTitle>Команда отстранена</AlertTitle>
          <AlertDescription>{team.suspendReason}</AlertDescription>
        </Alert>
      )}

      {/* Team header */}
      <div>
        <h1 className="text-2xl font-bold">{team.name}</h1>
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="secondary">{getManagementTypeName(team.managementType)}</Badge>
          <Badge variant="outline">{getDecisionSystemName(team.decisionSystem)}</Badge>
          {team.genre && <Badge variant="outline">{getGenreName(team.genre)}</Badge>}
        </div>
      </div>

      {/* Description */}
      {team.description && (
        <Card>
          <CardHeader>
            <CardTitle>О команде</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{team.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Members and open positions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Участники ({team.memberCount})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {members.map((member) => (
              <div key={member.id}>
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
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Открытые позиции</CardTitle>
          </CardHeader>
          <CardContent>
            {openPositions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Нет открытых позиций</p>
            ) : (
              <div className="space-y-2">
                {openPositions.map((pos) => (
                  <div key={pos.id}>
                    <Badge>{getRoleName(pos.role)}</Badge>
                    {pos.description && (
                      <p className="text-sm text-muted-foreground mt-1">{pos.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Links */}
      {(team.chatLink || team.gitLink) && (
        <Card>
          <CardHeader>
            <CardTitle>Ссылки</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            {team.chatLink && (
              <a
                href={team.chatLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Чат команды
              </a>
            )}
            {team.gitLink && (
              <a
                href={team.gitLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Репозиторий
              </a>
            )}
          </CardContent>
        </Card>
      )}

      {/* Apply button */}
      {canApply && (
        <Card>
          <CardHeader>
            <CardTitle>Подать заявку</CardTitle>
          </CardHeader>
          <CardContent>
            <ApplicationForm slug={slug} teamId={team.id} />
          </CardContent>
        </Card>
      )}

      {hasApplication && (
        <Alert>
          <AlertTitle>Заявка подана</AlertTitle>
          <AlertDescription>
            Ваша заявка в эту команду находится на рассмотрении
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

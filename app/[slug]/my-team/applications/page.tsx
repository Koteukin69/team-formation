import { notFound, redirect } from 'next/navigation'
import { collections } from '@/lib/db/collections'
import { getCurrentUser } from '@/lib/auth/session'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ApplicationActions } from '@/components/application/application-actions'
import { formatRelativeTime } from '@/lib/utils'
import { getRoleName } from '@/lib/references'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ slug: string }>
}

export const metadata: Metadata = {
  title: 'Заявки в команду',
}

async function getTeamApplications(slug: string, userId: any) {
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

  const applicationsCollection = await collections.applications()
  const applications = await applicationsCollection
    .find({ teamId: team._id, status: 'pending' })
    .sort({ createdAt: -1 })
    .toArray()

  // Get applicant info
  const participantIds = applications.map((a) => a.participantId)
  const applicants = await participantsCollection.find({ _id: { $in: participantIds } }).toArray()
  const applicantMap = new Map(
    applicants.map((p) => [
      p._id.toString(),
      { name: p.name || 'Без имени', nickname: p.nickname, roles: p.roles },
    ])
  )

  return {
    applications: applications.map((a) => {
      const applicant = applicantMap.get(a.participantId.toString())
      return {
        id: a._id.toString(),
        participantId: a.participantId.toString(),
        participantName: applicant?.name || 'Без имени',
        participantNickname: applicant?.nickname,
        participantRoles: applicant?.roles || [],
        message: a.message,
        createdAt: a.createdAt,
      }
    }),
    decisionSystem: team.decisionSystem,
    isLeader: team.leaderId?.toString() === participant._id.toString(),
  }
}

export default async function TeamApplicationsPage({ params }: PageProps) {
  const { slug } = await params
  const user = await getCurrentUser()

  if (!user) {
    redirect(`/login?from=/${slug}/my-team/applications`)
  }

  const data = await getTeamApplications(slug, user._id)

  if (!data) notFound()
  if ('noTeam' in data) {
    redirect(`/${slug}/teams`)
  }

  const { applications, decisionSystem, isLeader } = data

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Заявки в команду</h1>

      {applications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Нет активных заявок</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <Card key={app.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{app.participantName}</CardTitle>
                    <CardDescription>
                      {app.participantNickname && `@${app.participantNickname} • `}
                      {formatRelativeTime(new Date(app.createdAt))}
                    </CardDescription>
                  </div>
                  {app.participantRoles.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {app.participantRoles.slice(0, 3).map((role) => (
                        <Badge key={role} variant="secondary" className="text-xs">
                          {getRoleName(role)}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {app.message && (
                  <p className="text-sm text-muted-foreground mb-4">{app.message}</p>
                )}
                <ApplicationActions
                  slug={slug}
                  applicationId={app.id}
                  decisionSystem={decisionSystem}
                  isLeader={isLeader}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

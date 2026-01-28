import { notFound, redirect } from 'next/navigation'
import { collections } from '@/lib/db/collections'
import { getCurrentUser } from '@/lib/auth/session'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CancelApplicationButton } from '@/components/application/cancel-application-button'
import { formatRelativeTime } from '@/lib/utils'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ slug: string }>
}

export const metadata: Metadata = {
  title: 'Мои заявки',
}

async function getMyApplications(slug: string, userId: any) {
  const marathonsCollection = await collections.marathons()
  const marathon = await marathonsCollection.findOne({ slug: slug.toLowerCase() })

  if (!marathon) return null

  const participantsCollection = await collections.participants()
  const participant = await participantsCollection.findOne({
    marathonId: marathon._id,
    userId: userId,
  })

  if (!participant) return { notParticipant: true }
  if (participant.teamId) return { hasTeam: true, slug }

  const applicationsCollection = await collections.applications()
  const applications = await applicationsCollection
    .find({ participantId: participant._id })
    .sort({ createdAt: -1 })
    .toArray()

  const teamIds = applications.map((a) => a.teamId)
  const teamsCollection = await collections.teams()
  const teams = await teamsCollection.find({ _id: { $in: teamIds } }).toArray()
  const teamMap = new Map(teams.map((t) => [t._id.toString(), t.name]))

  return {
    applications: applications.map((a) => ({
      id: a._id.toString(),
      teamId: a.teamId.toString(),
      teamName: teamMap.get(a.teamId.toString()) || 'Неизвестная команда',
      status: a.status,
      message: a.message,
      createdAt: a.createdAt,
    })),
  }
}

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'На рассмотрении', variant: 'default' },
  accepted: { label: 'Принята', variant: 'secondary' },
  rejected: { label: 'Отклонена', variant: 'destructive' },
  cancelled: { label: 'Отменена', variant: 'outline' },
}

export default async function MyApplicationsPage({ params }: PageProps) {
  const { slug } = await params
  const user = await getCurrentUser()

  if (!user) {
    redirect(`/login?from=/${slug}/my-applications`)
  }

  const data = await getMyApplications(slug, user._id)

  if (!data) notFound()
  if ('notParticipant' in data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Присоединитесь к марафону, чтобы подавать заявки
        </p>
      </div>
    )
  }
  if ('hasTeam' in data) {
    redirect(`/${data.slug}/my-team`)
  }

  const { applications } = data

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Мои заявки</h1>

      {applications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              У вас пока нет заявок. Найдите команду и подайте заявку на вступление.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const status = statusLabels[app.status] || statusLabels.pending
            return (
              <Card key={app.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{app.teamName}</CardTitle>
                      <CardDescription>
                        {formatRelativeTime(new Date(app.createdAt))}
                      </CardDescription>
                    </div>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {app.message && (
                    <p className="text-sm text-muted-foreground mb-4">{app.message}</p>
                  )}
                  {app.status === 'pending' && (
                    <CancelApplicationButton slug={slug} applicationId={app.id} />
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

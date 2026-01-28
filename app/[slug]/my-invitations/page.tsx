import { notFound, redirect } from 'next/navigation'
import { collections } from '@/lib/db/collections'
import { getCurrentUser } from '@/lib/auth/session'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { InvitationActions } from '@/components/invitation/invitation-actions'
import { formatRelativeTime, pluralize } from '@/lib/utils'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ slug: string }>
}

export const metadata: Metadata = {
  title: 'Приглашения',
}

async function getMyInvitations(slug: string, userId: any) {
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

  const invitationsCollection = await collections.invitations()
  const invitations = await invitationsCollection
    .find({ participantId: participant._id, status: 'pending' })
    .sort({ createdAt: -1 })
    .toArray()

  const teamIds = invitations.map((i) => i.teamId)
  const teamsCollection = await collections.teams()
  const teams = await teamsCollection.find({ _id: { $in: teamIds } }).toArray()
  const teamMap = new Map(
    teams.map((t) => [t._id.toString(), { name: t.name, memberCount: t.memberCount }])
  )

  return {
    invitations: invitations.map((i) => {
      const team = teamMap.get(i.teamId.toString())
      return {
        id: i._id.toString(),
        teamId: i.teamId.toString(),
        teamName: team?.name || 'Неизвестная команда',
        teamMemberCount: team?.memberCount || 0,
        message: i.message,
        createdAt: i.createdAt,
      }
    }),
  }
}

export default async function MyInvitationsPage({ params }: PageProps) {
  const { slug } = await params
  const user = await getCurrentUser()

  if (!user) {
    redirect(`/login?from=/${slug}/my-invitations`)
  }

  const data = await getMyInvitations(slug, user._id)

  if (!data) notFound()
  if ('notParticipant' in data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Присоединитесь к марафону, чтобы получать приглашения
        </p>
      </div>
    )
  }
  if ('hasTeam' in data) {
    redirect(`/${data.slug}/my-team`)
  }

  const { invitations } = data

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Приглашения</h1>

      {invitations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              У вас пока нет приглашений. Заполните профиль, чтобы команды могли вас найти.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {invitations.map((inv) => (
            <Card key={inv.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{inv.teamName}</CardTitle>
                <CardDescription>
                  {inv.teamMemberCount}{' '}
                  {pluralize(inv.teamMemberCount, 'участник', 'участника', 'участников')} •{' '}
                  {formatRelativeTime(new Date(inv.createdAt))}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {inv.message && (
                  <p className="text-sm text-muted-foreground mb-4">{inv.message}</p>
                )}
                <InvitationActions slug={slug} invitationId={inv.id} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

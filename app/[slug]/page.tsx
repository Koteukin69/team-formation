import { notFound } from 'next/navigation'
import { collections } from '@/lib/db/collections'
import { getCurrentUser } from '@/lib/auth/session'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { JoinLeaveButton } from '@/components/marathon/join-leave-button'
import { pluralize } from '@/lib/utils'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ slug: string }>
}

async function getMarathonData(slug: string) {
  const marathonsCollection = await collections.marathons()
  const marathon = await marathonsCollection.findOne({ slug: slug.toLowerCase() })

  if (!marathon) return null

  const participantsCollection = await collections.participants()
  const teamsCollection = await collections.teams()

  const [participantCount, teamCount, freeParticipantCount] = await Promise.all([
    participantsCollection.countDocuments({
      marathonId: marathon._id,
      isBanned: false,
      isSuspended: false,
    }),
    teamsCollection.countDocuments({
      marathonId: marathon._id,
      isSuspended: false,
    }),
    participantsCollection.countDocuments({
      marathonId: marathon._id,
      isBanned: false,
      isSuspended: false,
      teamId: { $exists: false },
    }),
  ])

  return {
    marathon,
    participantCount,
    teamCount,
    freeParticipantCount,
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const data = await getMarathonData(slug)

  if (!data) {
    return { title: 'Марафон не найден' }
  }

  return {
    title: data.marathon.name,
    description: `Присоединяйтесь к марафону ${data.marathon.name}. ${data.participantCount} участников, ${data.teamCount} команд.`,
  }
}

export default async function MarathonPage({ params }: PageProps) {
  const { slug } = await params
  const data = await getMarathonData(slug)

  if (!data) {
    notFound()
  }

  const { marathon, participantCount, teamCount, freeParticipantCount } = data
  const user = await getCurrentUser()

  // Get user status
  let userStatus = {
    isParticipant: false,
    isOrganizer: false,
    isBanned: false,
  }

  if (user) {
    const participantsCollection = await collections.participants()
    const participant = await participantsCollection.findOne({
      marathonId: marathon._id,
      userId: user._id,
    })

    userStatus = {
      isParticipant: !!participant && !participant.isBanned,
      isOrganizer: marathon.organizers.some(
        (orgId) => orgId.toString() === user._id.toString()
      ),
      isBanned: participant?.isBanned || false,
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{marathon.name}</h1>
          <p className="text-muted-foreground mt-1">
            Размер команды: {marathon.minTeamSize}—{marathon.maxTeamSize}{' '}
            {pluralize(marathon.maxTeamSize, 'человек', 'человека', 'человек')}
          </p>
        </div>
        {user && !userStatus.isBanned && (
          <JoinLeaveButton
            slug={marathon.slug}
            isParticipant={userStatus.isParticipant}
          />
        )}
      </div>

      {userStatus.isBanned && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">
              Вы заблокированы в этом марафоне и не можете участвовать.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Всего участников</CardDescription>
            <CardTitle className="text-3xl">{participantCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {freeParticipantCount} без команды
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Команд</CardDescription>
            <CardTitle className="text-3xl">{teamCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Активных команд
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ваш статус</CardDescription>
            <CardTitle className="text-xl mt-1">
              {!user ? (
                'Не авторизован'
              ) : userStatus.isBanned ? (
                <Badge variant="destructive">Заблокирован</Badge>
              ) : userStatus.isParticipant ? (
                <Badge variant="default">Участник</Badge>
              ) : (
                'Не участник'
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userStatus.isOrganizer && (
              <Badge variant="secondary">Организатор</Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {!user && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-2">
              Войдите в систему, чтобы присоединиться к марафону
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

import Link from 'next/link'
import { collections } from '@/lib/db/collections'
import { getCurrentUser } from '@/lib/auth/session'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { pluralize } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Марафоны | Team Formation',
  description: 'Список доступных марафонов и хакатонов. Присоединяйтесь к мероприятиям и находите команду.',
}

async function getMarathonsWithStats() {
  const marathonsCollection = await collections.marathons()
  const participantsCollection = await collections.participants()
  const teamsCollection = await collections.teams()

  const marathons = await marathonsCollection
    .find({})
    .sort({ createdAt: -1 })
    .toArray()

  const marathonsWithStats = await Promise.all(
    marathons.map(async (marathon) => {
      const [participantCount, teamCount] = await Promise.all([
        participantsCollection.countDocuments({
          marathonId: marathon._id,
          isBanned: false,
          isSuspended: false,
        }),
        teamsCollection.countDocuments({
          marathonId: marathon._id,
          isSuspended: false,
        }),
      ])

      return {
        id: marathon._id.toString(),
        name: marathon.name,
        slug: marathon.slug,
        minTeamSize: marathon.minTeamSize,
        maxTeamSize: marathon.maxTeamSize,
        participantCount,
        teamCount,
        createdAt: marathon.createdAt,
      }
    })
  )

  return marathonsWithStats
}

export default async function HomePage() {
  const user = await getCurrentUser()
  const marathons = await getMarathonsWithStats()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Марафоны</h1>
          <p className="text-muted-foreground mt-1">
            Выберите марафон и найдите свою команду
          </p>
        </div>
        {user && (
          <Button asChild>
            <Link href="/marathons/new">Создать марафон</Link>
          </Button>
        )}
      </div>

      {marathons.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">Пока нет доступных марафонов</p>
            {user ? (
              <Button asChild>
                <Link href="/marathons/new">Создать первый марафон</Link>
              </Button>
            ) : (
              <Button asChild variant="outline">
                <Link href="/login">Войдите, чтобы создать марафон</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {marathons.map((marathon) => (
            <Link key={marathon.id} href={`/${marathon.slug}`}>
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardHeader>
                  <CardTitle>{marathon.name}</CardTitle>
                  <CardDescription>/{marathon.slug}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="secondary">
                      {marathon.participantCount}{' '}
                      {pluralize(
                        marathon.participantCount,
                        'участник',
                        'участника',
                        'участников'
                      )}
                    </Badge>
                    <Badge variant="secondary">
                      {marathon.teamCount}{' '}
                      {pluralize(marathon.teamCount, 'команда', 'команды', 'команд')}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Размер команды: {marathon.minTeamSize}—{marathon.maxTeamSize}{' '}
                    {pluralize(marathon.maxTeamSize, 'человек', 'человека', 'человек')}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

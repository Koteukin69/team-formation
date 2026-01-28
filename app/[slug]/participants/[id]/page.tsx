import { notFound, redirect } from 'next/navigation'
import { collections } from '@/lib/db/collections'
import { getCurrentUser } from '@/lib/auth/session'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ObjectId } from 'mongodb'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ slug: string; id: string }>
}

export const metadata: Metadata = {
  title: 'Профиль участника',
}

async function getParticipantData(slug: string, participantId: string, userId: any) {
  const marathonsCollection = await collections.marathons()
  const marathon = await marathonsCollection.findOne({ slug: slug.toLowerCase() })

  if (!marathon) return null

  // Validate participantId
  if (!ObjectId.isValid(participantId)) return null

  // Check if user is organizer
  const isOrganizer = marathon.organizers.some(
    (orgId) => orgId.toString() === userId.toString()
  ) || marathon.creatorId.toString() === userId.toString()

  const participantsCollection = await collections.participants()

  // Check if current user is participant
  const currentUserParticipant = await participantsCollection.findOne({
    marathonId: marathon._id,
    userId: userId,
  })

  // Organizers can access even without being a participant
  if (!currentUserParticipant && !isOrganizer) {
    return { requiresJoin: true }
  }

  // Get target participant
  const participant = await participantsCollection.findOne({
    _id: new ObjectId(participantId),
    marathonId: marathon._id,
  })

  if (!participant) return null

  // Get team info if participant has a team
  let teamName = null
  if (participant.teamId) {
    const teamsCollection = await collections.teams()
    const team = await teamsCollection.findOne({ _id: participant.teamId })
    teamName = team?.name
  }

  return {
    participant: {
      id: participant._id.toString(),
      name: participant.name || 'Без имени',
      nickname: participant.nickname,
      roles: participant.roles,
      technologies: participant.technologies,
      description: participant.description,
      hasTeam: !!participant.teamId,
      teamId: participant.teamId?.toString(),
      teamName,
    },
    marathon,
    currentUserHasTeam: !!currentUserParticipant?.teamId,
  }
}

export default async function ParticipantPage({ params }: PageProps) {
  const { slug, id } = await params
  const user = await getCurrentUser()

  if (!user) {
    redirect(`/login?from=/${slug}/participants/${id}`)
  }

  const data = await getParticipantData(slug, id, user._id)

  if (!data) {
    notFound()
  }

  if ('requiresJoin' in data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">
          Присоединитесь к марафону, чтобы просматривать участников
        </p>
      </div>
    )
  }

  const { participant, currentUserHasTeam } = data

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Button variant="outline" asChild>
          <Link href={`/${slug}/participants`}>← Назад к списку</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{participant.name}</CardTitle>
              {participant.nickname && (
                <p className="text-muted-foreground mt-1">@{participant.nickname}</p>
              )}
            </div>
            {participant.hasTeam && <Badge>В команде</Badge>}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {participant.roles.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Роли</h3>
              <div className="flex flex-wrap gap-2">
                {participant.roles.map((role) => (
                  <Badge key={role} variant="outline">
                    {role}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {participant.technologies.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Технологии</h3>
              <div className="flex flex-wrap gap-2">
                {participant.technologies.map((tech) => (
                  <Badge key={tech} variant="secondary">
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {participant.description && (
            <div>
              <h3 className="font-semibold mb-2">Описание</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {participant.description}
              </p>
            </div>
          )}

          {participant.hasTeam && participant.teamName && (
            <div>
              <h3 className="font-semibold mb-2">Команда</h3>
              <Button variant="outline" asChild>
                <Link href={`/${slug}/teams/${participant.teamId}`}>
                  {participant.teamName}
                </Link>
              </Button>
            </div>
          )}

          {!participant.hasTeam && !currentUserHasTeam && (
            <div>
              <Button asChild>
                <Link href={`/${slug}/my-team`}>Пригласить в команду</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

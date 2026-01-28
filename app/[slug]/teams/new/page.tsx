import { notFound, redirect } from 'next/navigation'
import { collections } from '@/lib/db/collections'
import { getCurrentUser } from '@/lib/auth/session'
import { CreateTeamForm } from '@/components/team/create-team-form'
import { MANAGEMENT_TYPES, DECISION_SYSTEMS, GENRES } from '@/lib/references'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ slug: string }>
}

export const metadata: Metadata = {
  title: 'Создать команду',
}

async function checkCanCreateTeam(slug: string, userId: any) {
  const marathonsCollection = await collections.marathons()
  const marathon = await marathonsCollection.findOne({ slug: slug.toLowerCase() })

  if (!marathon) return null

  const participantsCollection = await collections.participants()
  const participant = await participantsCollection.findOne({
    marathonId: marathon._id,
    userId: userId,
  })

  // Must be a participant to create a team (even organizers need to join)
  if (!participant) return { notParticipant: true }
  if (participant.teamId) return { hasTeam: true }

  return { canCreate: true, marathon }
}

export default async function CreateTeamPage({ params }: PageProps) {
  const { slug } = await params
  const user = await getCurrentUser()

  if (!user) {
    redirect(`/login?from=/${slug}/teams/new`)
  }

  const result = await checkCanCreateTeam(slug, user._id)

  if (!result) notFound()

  if ('notParticipant' in result) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Присоединитесь к марафону, чтобы создать команду
        </p>
      </div>
    )
  }

  if ('hasTeam' in result) {
    redirect(`/${slug}/my-team`)
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Создать команду</h1>
      <CreateTeamForm
        slug={slug}
        managementTypes={MANAGEMENT_TYPES}
        decisionSystems={DECISION_SYSTEMS}
        genres={GENRES}
      />
    </div>
  )
}

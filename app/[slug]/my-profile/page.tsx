import { notFound, redirect } from 'next/navigation'
import { collections } from '@/lib/db/collections'
import { getCurrentUser } from '@/lib/auth/session'
import { ProfileForm } from '@/components/participant/profile-form'
import { ROLES, TECHNOLOGIES } from '@/lib/references'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ slug: string }>
}

export const metadata: Metadata = {
  title: 'Мой профиль',
}

async function getProfileData(slug: string, userId: any) {
  const marathonsCollection = await collections.marathons()
  const marathon = await marathonsCollection.findOne({ slug: slug.toLowerCase() })

  if (!marathon) return null

  // Check if user is organizer
  const isOrganizer = marathon.organizers.some(
    (orgId) => orgId.toString() === userId.toString()
  ) || marathon.creatorId.toString() === userId.toString()

  const participantsCollection = await collections.participants()
  const participant = await participantsCollection.findOne({
    marathonId: marathon._id,
    userId: userId,
  })

  // Organizers can access even without being a participant
  if (!participant && !isOrganizer) return null

  return {
    marathon,
    participant,
    isOrganizer,
  }
}

export default async function MyProfilePage({ params }: PageProps) {
  const { slug } = await params
  const user = await getCurrentUser()

  if (!user) {
    redirect(`/login?from=/${slug}/my-profile`)
  }

  const data = await getProfileData(slug, user._id)

  if (!data) {
    notFound()
  }

  const { participant } = data

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Мой профиль</h1>
      <ProfileForm
        slug={slug}
        initialData={{
          name: participant?.name || '',
          nickname: participant?.nickname || '',
          roles: participant?.roles || [],
          technologies: participant?.technologies || [],
          description: participant?.description || '',
        }}
        roles={ROLES}
        technologies={TECHNOLOGIES}
      />
    </div>
  )
}

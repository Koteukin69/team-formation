import { notFound } from 'next/navigation'
import Link from 'next/link'
import { collections } from '@/lib/db/collections'
import { getCurrentUser } from '@/lib/auth/session'
import { Header } from '@/components/layout/header'
import { MarathonNav } from '@/components/marathon/marathon-nav'

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

async function getMarathon(slug: string) {
  const marathonsCollection = await collections.marathons()
  return marathonsCollection.findOne({ slug: slug.toLowerCase() })
}

export default async function MarathonLayout({ children, params }: LayoutProps) {
  const { slug } = await params
  const marathon = await getMarathon(slug)

  if (!marathon) {
    notFound()
  }

  const user = await getCurrentUser()

  // Get user's status in marathon
  let status = {
    isParticipant: false,
    isOrganizer: false,
    hasTeam: false,
    teamId: null as string | null,
  }

  if (user) {
    const participantsCollection = await collections.participants()
    const participant = await participantsCollection.findOne({
      marathonId: marathon._id,
      userId: user._id,
    })

    status = {
      isParticipant: !!participant,
      isOrganizer: marathon.organizers.some(
        (orgId) => orgId.toString() === user._id.toString()
      ) || marathon.creatorId.toString() === user._id.toString(),
      hasTeam: !!participant?.teamId,
      teamId: participant?.teamId?.toString() || null,
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <div>
              <Link
                href={`/${marathon.slug}`}
                className="text-xl font-bold hover:underline"
              >
                {marathon.name}
              </Link>
              <p className="text-sm text-muted-foreground">/{marathon.slug}</p>
            </div>
          </div>
          <MarathonNav slug={marathon.slug} status={status} />
        </div>
      </div>
      <main className="flex-1">
        <div className="container mx-auto px-4 py-6">{children}</div>
      </main>
    </div>
  )
}

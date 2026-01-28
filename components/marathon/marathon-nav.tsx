'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface MarathonNavProps {
  slug: string
  status: {
    isParticipant: boolean
    isOrganizer: boolean
    hasTeam: boolean
    teamId: string | null
  }
}

export function MarathonNav({ slug, status }: MarathonNavProps) {
  const pathname = usePathname()

  const navItems = [
    { href: `/${slug}`, label: 'Обзор', exact: true },
    { href: `/${slug}/participants`, label: 'Участники' },
    { href: `/${slug}/teams`, label: 'Команды' },
  ]

  // Add participant-only items
  if (status.isParticipant) {
    navItems.push({ href: `/${slug}/my-profile`, label: 'Мой профиль' })

    if (status.hasTeam) {
      navItems.push({ href: `/${slug}/my-team`, label: 'Моя команда' })
    } else {
      navItems.push({ href: `/${slug}/my-applications`, label: 'Мои заявки' })
      navItems.push({ href: `/${slug}/my-invitations`, label: 'Приглашения' })
    }
  }

  // Add organizer items
  if (status.isOrganizer) {
    navItems.push({ href: `/${slug}/admin`, label: 'Управление' })
  }

  return (
    <nav className="flex space-x-1 overflow-x-auto pb-2 -mb-px">
      {navItems.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href)

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'inline-flex items-center px-3 py-2 text-sm font-medium rounded-t-md border-b-2 whitespace-nowrap transition-colors',
              isActive
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

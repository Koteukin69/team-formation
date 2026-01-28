import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth/session'
import { UserMenu } from './user-menu'
import { Button } from '@/components/ui/button'

export async function Header() {
  const user = await getCurrentUser()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          <span className="font-bold text-xl">Team Formation</span>
        </Link>

        <nav className="flex items-center gap-4">
          {user ? (
            <UserMenu email={user.email} />
          ) : (
            <Button asChild variant="default" size="sm">
              <Link href="/login">Войти</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  )
}

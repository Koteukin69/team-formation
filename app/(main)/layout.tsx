import { Header } from '@/components/layout/header'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <footer className="border-t py-6 md:py-0">
        <div className="container mx-auto flex h-14 items-center justify-center px-4">
          <p className="text-sm text-muted-foreground">
            Team Formation - Система формирования команд
          </p>
        </div>
      </footer>
    </div>
  )
}

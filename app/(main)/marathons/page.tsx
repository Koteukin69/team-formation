import Link from "next/link";
import { headers } from "next/headers";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Users } from "lucide-react";
import { getMarathons } from "@/lib/data/marathons";

export default async function MarathonsPage() {
  const headersList = await headers();
  const userRole = headersList.get("x-user-role");
  const marathons = await getMarathons();
  const canCreate = userRole === "organizer" || userRole === "admin";

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/">
            <ArrowLeft className="size-4" />
            Вернутся на главную
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Марафоны</h1>
          <p className="text-muted-foreground mt-1">
            Выберите марафон для участия
          </p>
        </div>
        <Button asChild={canCreate} disabled={!canCreate}>
          <Link href="/create_marathon">
            <Plus className="size-4" />
            Создать марафон
          </Link>
        </Button>
      </div>

      {marathons.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Users className="size-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Нет марафонов</h2>
          <p className="text-muted-foreground mb-4">
            Будьте первым, кто создаст марафон!
          </p>
          <Button asChild={canCreate} disabled={!canCreate}>
            <Link href="/create_marathon">
              <Plus className="size-4" />
              Создать марафон
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {marathons.map((marathon) => (
            <Link key={marathon.id} href={`/marathons/${marathon.slug}`}>
              <Card className="h-full transition-colors hover:bg-accent/50 cursor-pointer">
                <CardHeader>
                  <CardTitle className="line-clamp-1">{marathon.name}</CardTitle>
                  <CardDescription className="font-mono text-xs">
                    /{marathon.slug}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="size-4" />
                    <span>
                      {marathon.minTeamSize} – {marathon.maxTeamSize} участников
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

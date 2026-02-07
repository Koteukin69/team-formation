import { Button } from '@/components/ui/button';
import Link from "next/link"
import Config from '@/config';
import { headers } from "next/headers";
import { getAccessLevel } from "@/lib/auth";
import { Role } from "@/lib/types"

export async function Hero() {
  const headersList = await headers();
  const userRole = headersList.get('x-user-role');
  const canCreate = (await getAccessLevel(userRole as Role)) >= 2;

  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col items-center justify-center gap-20">
      <h1 className="text-4xl font-semibold text-center tracking-tighter sm:text-7xl">Система для Формирования Команд</h1>
      <p className="max-w-xl text-center text-muted-foreground text-lg sm:text-xl">{Config.name} - <span className="text-foreground">Продвинутая система формирования команд</span> для марафонов/хаккатонов по модели рекрутинговых платформ.</p>
      <div className="flex flex-col gap-5 items-center">
      <div className="flex gap-5 flex-col sm:flex-row w-full">
        <Button className="cursor-pointer" size="lg" asChild>
          <Link href="/marathons">Найти марафон</Link>
        </Button>
        { canCreate ? (
          <Button variant="outline" size="lg" asChild>
            <Link href="/create_marathon">Создать марафон</Link>
          </Button>
        ) : (
          <Button variant="outline" size="lg" disabled>Создать марафон</Button>
        )}
      </div>
      <p className="text-muted-foreground text-center"><a className="underline text-foreground" href="https://github.com/koteukin69/team-formation" target='_blank'>Team Formation</a>, создано <a className="underline" href="https://github.com/koteukin69/" target='_blank'>Koteukin69</a></p>
      </div>
    </div>
  )
}

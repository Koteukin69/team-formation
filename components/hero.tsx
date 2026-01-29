'use client';

import { Button } from '@/components/ui/button';

export function Hero() {
  return (
    <div className="h-screen flex flex-col items-center justify-center gap-20 p-10 sm:p-20">
      <h1 className="text-4xl font-semibold text-center tracking-tighter sm:text-7xl">Система для Формирования Команд</h1>
      <p className="max-w-xl text-center text-muted-foreground text-lg sm:text-xl">Продвинутая система формирования команд для марафонов/хаккатонов по модели рекрутинговых платформ.</p>
      <div className="flex flex-col gap-5 items-center">
      <div className="flex gap-5 flex-col sm:flex-row w-full">
        <a href="/marathons"><Button className="w-full cursor-pointer" size="lg">Найти марафон</Button></a>
        <Button variant="outline" size="lg" disabled>Создать марафон</Button>
      </div>
      <p className="text-muted-foreground text-center"><a className="underline text-foreground" href="https://github.com/koteukin69/team-formation" target='_blank'>Team Formation</a>, создано <a className="underline" href="https://github.com/koteukin69/" target='_blank'>Koteukin69</a></p>
      </div>
    </div>
  )
}

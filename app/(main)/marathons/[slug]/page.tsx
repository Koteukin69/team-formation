import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Calendar } from "lucide-react";
import Config from "@/config";
import { getMarathonBySlug } from "@/lib/data/marathons";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const marathon = await getMarathonBySlug(slug);

  if (!marathon) {
    return {
      title: `${Config.name} - Марафон не найден`,
    };
  }

  return {
    title: `${Config.name} - Марафон ${marathon.name}`,
    description: `Марафон ${marathon.name}. Команды от ${marathon.minTeamSize} до ${marathon.maxTeamSize} участников.`,
  };
}

export default async function MarathonPage({ params }: Props) {
  const { slug } = await params;
  const marathon = await getMarathonBySlug(slug);

  if (!marathon) {
    notFound();
  }

  const createdDate = new Date(marathon.createdAt).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/marathons">
            <ArrowLeft className="size-4" />
            Назад к марафонам
          </Link>
        </Button>
      </div>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{marathon.name}</CardTitle>
            <CardDescription className="font-mono">/{marathon.slug}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <Users className="size-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Размер команды</p>
                <p className="text-muted-foreground">
                  от {marathon.minTeamSize} до {marathon.maxTeamSize} участников
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <Calendar className="size-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Дата создания</p>
                <p className="text-muted-foreground">{createdDate}</p>
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <Button className="flex-1">Присоединиться</Button>
              <Button variant="outline" className="flex-1">Подробнее</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

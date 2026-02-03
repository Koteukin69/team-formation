import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldTitle,
} from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Users, Info } from "lucide-react";
import { Markdown } from "@/components/ui/markdown";
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
    description: marathon.description || `Марафон ${marathon.name}. Команды от ${marathon.minTeamSize} до ${marathon.maxTeamSize} участников.`,
  };
}

export default async function MarathonPage({ params }: Props) {
  const { slug } = await params;
  const marathon = await getMarathonBySlug(slug);

  if (!marathon) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6 items-start">
      <div className="flex flex-row gap-6">
        <Field orientation="horizontal" className="w-auto">
          <Users className="size-5 text-muted-foreground" />
          <FieldContent className="flex-none">
            <FieldTitle>Размер команды</FieldTitle>
            <FieldDescription>
              от {marathon.minTeamSize} до {marathon.maxTeamSize} участников
            </FieldDescription>
          </FieldContent>
        </Field>
        {marathon.topic && (
          <Field orientation="horizontal" className="w-auto">
            <Info className="size-5 text-muted-foreground" />
            <FieldContent className="flex-none">
              <FieldTitle>Тема</FieldTitle>
              <FieldDescription>
                {marathon.topic}
              </FieldDescription>
            </FieldContent>
          </Field>
        )}
      </div>

      {marathon.description && (
        <Markdown>{marathon.description}</Markdown>
      )}

      <Button className="max-w-sm">Присоединиться</Button>
    </div>
  );
}

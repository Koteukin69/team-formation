"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Loader2, Plus } from "lucide-react";
import { marathonSchema } from "@/lib/validator";

export function MarathonForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [teamSize, setTeamSize] = useState([2, 5]);
  const [error, setError] = useState<{ field?: string; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = marathonSchema.safeParse({ 
      name, 
      slug,
      topic,
      description,
      minTeamSize: teamSize[0], 
      maxTeamSize: teamSize[1] 
    });
    if (!validation.success) {
      const issue = validation.error.issues[0];
      const field = issue.path[0] as string;
      setError({
        field,
        message: issue.message,
      });
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/marathons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            name, 
            slug,
            topic,
            description,
            minTeamSize: teamSize[0], 
            maxTeamSize: teamSize[1] 
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError({ message: data.error || "Ошибка создания марафона" });
          return;
        }

        router.push("/marathons");
        router.refresh();
      } catch {
        setError({ message: "Ошибка соединения с сервером" });
      }
    });
  };

  return (
    <div className="flex flex-col gap-6 w-[340px]">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Создать марафон
        </h1>
        <p className="text-sm text-muted-foreground">
          Заполните информацию о новом марафоне
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <FieldSet>
          <Field data-invalid={error?.field === "name"}>
            <FieldLabel htmlFor="name">Название</FieldLabel>
            <Input
              id="name"
              type="text"
              placeholder="Мой марафон"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending}
              autoFocus
            />
            {error?.field === "name" && <FieldError>{error.message}</FieldError>}
          </Field>

          <Field data-invalid={error?.field === "slug"}>
            <FieldLabel htmlFor="slug">Slug (URL-адрес)</FieldLabel>
            <Input
              id="slug"
              type="text"
              placeholder="my-marathon"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 16))}
              disabled={isPending}
            />
            <FieldDescription>От 3 до 16 символов, только латиница и цифры</FieldDescription>
            {error?.field === "slug" && <FieldError>{error.message}</FieldError>}
          </Field>

          <Field data-invalid={error?.field === "topic"}>
            <FieldLabel htmlFor="topic">Тема (необязательно)</FieldLabel>
            <Input
              id="topic"
              type="text"
              placeholder="Разработка игр"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={isPending}
              maxLength={100}
            />
            {error?.field === "topic" && <FieldError>{error.message}</FieldError>}
          </Field>

          <Field data-invalid={error?.field === "description"}>
            <FieldLabel htmlFor="description">Описание (необязательно)</FieldLabel>
            <Textarea
              id="description"
              placeholder="Расскажите о вашем марафоне... (поддерживается Markdown)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isPending}
              rows={4}
            />
            <FieldDescription>До 1000 символов, поддерживается Markdown</FieldDescription>
            {error?.field === "description" && <FieldError>{error.message}</FieldError>}
          </Field>

          <Field data-invalid={error?.field === "minTeamSize" || error?.field === "maxTeamSize"}>
            <FieldLabel>Размер команды: {teamSize[0]} – {teamSize[1]}</FieldLabel>
            <Slider
              value={teamSize}
              onValueChange={setTeamSize}
              min={1}
              max={20}
              step={1}
              minStepsBetweenThumbs={1}
              disabled={isPending}
              className="py-2"
            />
            <FieldDescription>
              Минимальное и максимальное количество участников в команде
            </FieldDescription>
            {(error?.field === "minTeamSize" || error?.field === "maxTeamSize") && (
              <FieldError>{error.message}</FieldError>
            )}
          </Field>

          {error && !error.field && <FieldError>{error.message}</FieldError>}

          <Button type="submit" disabled={isPending || !name || slug.length < 3}>
            {isPending ? (
              <>
                <Loader2 className="animate-spin" />
                Создание...
              </>
            ) : (
              <>
                <Plus className="size-4" />
                Создать марафон
              </>
            )}
          </Button>
        </FieldSet>
      </form>
    </div>
  );
}

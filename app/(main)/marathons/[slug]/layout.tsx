import {Field, FieldDescription, FieldGroup, FieldSet, FieldTitle} from "@/components/ui/field";
import {getMarathonBySlug} from "@/lib/data/marathons";
import {notFound} from "next/navigation";

export default async function MarathonsLayout({
  children, params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}>) {
  const { slug } = await params;
  const marathon = await getMarathonBySlug(slug);

  if (!marathon) {
    notFound();
  }

  return (
    <FieldSet>
      <Field>
        <FieldTitle className="text-2xl">{marathon.name}</FieldTitle>
        <FieldDescription className="font-mono">{marathon.slug}</FieldDescription>
      </Field>
      <FieldGroup>
        {children}
      </FieldGroup>
    </FieldSet>
  );
}

import { getMarathonsCollection } from "@/lib/db/collections";
import { validateMarathon, type Marathon } from "@/types/marathon";

export async function getMarathons(): Promise<Marathon[]> {
  const collection = await getMarathonsCollection();
  const list = await collection
    .find({})
    .sort({ createdAt: -1 })
    .project({ _id: 1, name: 1, slug: 1, topic: 1, description: 1, minTeamSize: 1, maxTeamSize: 1, createdAt: 1 })
    .toArray();

  return list.map((m) =>
    validateMarathon({
      id: m._id.toString(),
      name: m.name,
      slug: m.slug,
      topic: m.topic,
      description: m.description,
      minTeamSize: m.minTeamSize,
      maxTeamSize: m.maxTeamSize,
      createdAt: m.createdAt,
    })
  );
}

export async function getMarathonBySlug(slug: string): Promise<Marathon | null> {
  const collection = await getMarathonsCollection();
  const marathon = await collection.findOne({ slug });

  if (!marathon) {
    return null;
  }

  return validateMarathon({
    id: marathon._id.toString(),
    name: marathon.name,
    slug: marathon.slug,
    topic: marathon.topic,
    description: marathon.description,
    minTeamSize: marathon.minTeamSize,
    maxTeamSize: marathon.maxTeamSize,
    createdAt: marathon.createdAt,
  });
}

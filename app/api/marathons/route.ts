import { NextRequest, NextResponse } from "next/server";
import { collections } from "@/lib/db/collections";
import { Marathon } from "@/lib/types"
import { schemas } from "@/lib/validator";
import {getAccessLevel} from "@/lib/auth";


export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    const usersCollection = await collections.users()
    const user = await usersCollection.findOne({userId: userId});
    if (await getAccessLevel(user?.role) < 2) {
      return NextResponse.json(
        { error: "Недостаточно прав", redirect: "/refresh-session" },
        { status: 403 }
      );
    }

    const validated = await schemas.marathon.safeParseAsync(await req.json());
    if (!validated.success) {
      return NextResponse.json(
        {
          error: "Ошибка валидации данных",
          details: validated.error.flatten().fieldErrors,
        },
        { status: 422 }
      );
    }

    const { name, slug, topic, description, minTeamSize, maxTeamSize } = validated.data;
    const collection = await collections.marathons();

    const existing = await collection.findOne({ slug });
    if (existing) {
      return NextResponse.json({ error: "Slug уже занят" }, { status: 409 });
    }

    const marathon = validated.data;

    const result = await collection.insertOne(marathon as Marathon);

    return NextResponse.json(
      {
        id: result.insertedId.toString(),
        name,
        slug,
        topic,
        description,
        minTeamSize,
        maxTeamSize,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

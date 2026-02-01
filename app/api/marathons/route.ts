import { NextRequest, NextResponse } from 'next/server'
import clientPromise from "@/lib/db/mongodb";
import { marathonSchema } from "@/lib/validator"
import { getUserFromRequest } from "@/lib/auth";

async function marathonsCollection() {
  return (await clientPromise).db('marathons').collection('list');
}

export async function GET() {
  try {
    const collection = await marathonsCollection();
    const marathonsList = await collection
      .find({})
      .sort({ createdAt: -1 })
      .project({ _id: 1, name: 1, slug: 1, minTeamSize: 1, maxTeamSize: 1, createdAt: 1 })
      .toArray();

    const marathons = marathonsList.map(m => ({
      id: m._id.toString(),
      name: m.name,
      slug: m.slug,
      minTeamSize: m.minTeamSize,
      maxTeamSize: m.maxTeamSize,
      createdAt: m.createdAt,
    }));

    return NextResponse.json({ marathons });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      );
    }

    const validated = await marathonSchema.safeParseAsync(await req.json());
    if (!validated.success) {
      return NextResponse.json(
        { 
          error: 'Ошибка валидации данных',
          details: validated.error.flatten().fieldErrors 
        },
        { status: 422 }
      );
    }

    const { name, slug, minTeamSize, maxTeamSize } = validated.data;
    const collection = await marathonsCollection();

    const existing = await collection.findOne({ slug });
    if (existing) {
      return NextResponse.json(
        { error: 'Slug уже занят' },
        { status: 409 }
      );
    }

    const marathon = {
      name,
      slug,
      minTeamSize,
      maxTeamSize,
      creatorEmail: user.email,
      organizers: [user.email],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(marathon);

    return NextResponse.json(
      {
        id: result.insertedId.toString(),
        name,
        slug,
        minTeamSize,
        maxTeamSize,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
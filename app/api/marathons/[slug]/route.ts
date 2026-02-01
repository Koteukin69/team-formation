import { NextRequest, NextResponse } from 'next/server'
import clientPromise from "@/lib/db/mongodb";

async function marathonsCollection() {
  return (await clientPromise).db('marathons').collection('list');
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const collection = await marathonsCollection();
    
    const marathon = await collection.findOne({ slug });
    
    if (!marathon) {
      return NextResponse.json(
        { error: 'Марафон не найден' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: marathon._id.toString(),
      name: marathon.name,
      slug: marathon.slug,
      minTeamSize: marathon.minTeamSize,
      maxTeamSize: marathon.maxTeamSize,
      createdAt: marathon.createdAt,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server'
import { GENRES } from '@/lib/references'

export async function GET() {
  return NextResponse.json({ genres: GENRES })
}

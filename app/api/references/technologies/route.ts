import { NextResponse } from 'next/server'
import { TECHNOLOGIES } from '@/lib/references'

export async function GET() {
  return NextResponse.json({ technologies: TECHNOLOGIES })
}

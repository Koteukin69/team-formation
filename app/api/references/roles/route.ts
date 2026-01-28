import { NextResponse } from 'next/server'
import { ROLES } from '@/lib/references'

export async function GET() {
  return NextResponse.json({ roles: ROLES })
}

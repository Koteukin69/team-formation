import { NextResponse } from 'next/server'
import { MANAGEMENT_TYPES } from '@/lib/references'

export async function GET() {
  return NextResponse.json({ managementTypes: MANAGEMENT_TYPES })
}

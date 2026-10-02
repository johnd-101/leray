import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const data = await prisma.appointment.findMany({ orderBy: { start_at: 'asc' } })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.title) return NextResponse.json({ error: 'title required' }, { status: 400 })
    
    const appt = await prisma.appointment.create({
      data: {
        title: body.title.trim(),
        description: body.description || "",
        start_at: new Date(body.start_at),
        end_at: new Date(body.end_at),
        location: body.location || "",
        attendees: body.attendees || [],
        status: body.status || "confirmed",
      }
    })
    return NextResponse.json(appt, { status: 201 })
  } catch (e: any) {
    console.error('POST /api/appointments FAILED:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
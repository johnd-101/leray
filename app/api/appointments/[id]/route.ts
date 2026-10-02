import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        start_at: body.start_at ? new Date(body.start_at) : undefined,
        end_at: body.end_at ? new Date(body.end_at) : undefined,
        location: body.location,
        attendees: body.attendees,
        status: body.status,
      }
    })
    return NextResponse.json(updated)
  } catch (e: any) {
    console.error('PUT /api/appointments/[id] FAILED:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.appointment.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('DELETE FAILED:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
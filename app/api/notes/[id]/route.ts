import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params // works for Next 14 AND 15
    const body = await req.json()

    const updated = await prisma.note.update({
      where: { id },
      data: {
        title: body.title,
        content: body.content,
        color: body.color,
        tags: body.tags ?? [],
        is_pinned: !!(body.is_pinned ?? body.pinned ?? body.isPinned ?? false),
      },
    })
    return NextResponse.json(updated)
  } catch (e: any) {
    console.error('PUT /api/notes/[id] FAILED:', e.message)
    // this message is what you see in nError on the client
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.note.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('DELETE FAILED:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const note = await prisma.note.findUnique({ where: { id } })
  return NextResponse.json(note)
}
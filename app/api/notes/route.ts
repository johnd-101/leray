import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const notes = await prisma.note.findMany({ orderBy: { created_at: 'desc' } })
  return NextResponse.json(notes)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const note = await prisma.note.create({
      data: {
        title: body.title?.trim() || 'Untitled',
        content: body.content || '',
        color: body.color || '#E1F5FE',
        tags: body.tags || [],
        is_pinned: !!(body.is_pinned ?? body.pinned ?? false),
      }
    })
    return NextResponse.json(note, { status: 201 })
  } catch (e: any) {
    console.error('POST /api/notes FAILED:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
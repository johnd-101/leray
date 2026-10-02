// app/api/reminders/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // <-- use { prisma }
export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const updated = await prisma.reminder.update({
    where: { id },
    data: {
      title: body.title,
      notes: body.notes,
      due_at: body.due_at ? new Date(body.due_at) : undefined,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.reminder.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
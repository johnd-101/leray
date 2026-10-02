import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const reminders = await prisma.reminder.findMany({
    orderBy: { due_at: 'asc' },
  });
  return NextResponse.json(reminders);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("REMINDER BODY:", body);

    const reminder = await prisma.reminder.create({
      data: {
        title: body.title,
        notes: body.notes || "",
        due_at: body.due_at ? new Date(body.due_at) : new Date(),
      },
    });
    return NextResponse.json(reminder, { status: 201 });
  } catch (e: any) {
    console.error("REMINDER CREATE ERROR:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
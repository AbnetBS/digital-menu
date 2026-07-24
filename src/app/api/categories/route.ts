import { NextResponse } from "next/server";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { ensureDbSeeded } from "@/lib/seed-db";
import { ensureTablesExist } from "@/db/migrate";
import { eq, asc } from "drizzle-orm";

export async function GET() {
  await ensureTablesExist();
  await ensureDbSeeded();
  try {
    const list = await db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.id));
    return NextResponse.json(list);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  await ensureTablesExist();
  try {
    const body = await request.json();
    const newCat = await db
      .insert(categories)
      .values({
        name: body.name,
        slug: body.slug || body.name.toLowerCase().replace(/\s+/g, "-"),
        icon: body.icon || "Coffee",
        sortOrder: body.sortOrder ? Number(body.sortOrder) : 0,
      })
      .returning();
    return NextResponse.json(newCat[0]);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  await ensureTablesExist();
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: "Category ID required" }, { status: 400 });
    }
    const updated = await db
      .update(categories)
      .set({
        name: body.name,
        slug: body.slug,
        icon: body.icon,
        sortOrder: Number(body.sortOrder || 0),
      })
      .where(eq(categories.id, body.id))
      .returning();
    return NextResponse.json(updated[0]);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  await ensureTablesExist();
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }
    await db.delete(categories).where(eq(categories.id, Number(id)));
    return NextResponse.json({ success: true, id: Number(id) });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

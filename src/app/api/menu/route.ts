import { NextResponse } from "next/server";
import { db } from "@/db";
import { menuItems } from "@/db/schema";
import { ensureDbSeeded } from "@/lib/seed-db";
import { ensureTablesExist } from "@/db/migrate";
import { eq, asc } from "drizzle-orm";

export async function GET() {
  await ensureTablesExist();
  await ensureDbSeeded();
  try {
    const items = await db.select().from(menuItems).orderBy(asc(menuItems.sortOrder), asc(menuItems.id));
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  await ensureTablesExist();
  try {
    const body = await request.json();
    const newItem = await db
      .insert(menuItems)
      .values({
        name: body.name,
        category: body.category,
        price: Number(body.price),
        description: body.description || "",
        imageUrl: body.imageUrl || "https://images.pexels.com/photos/16563658/pexels-photo-16563658.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
        isPopular: Boolean(body.isPopular),
        isAvailable: body.isAvailable !== undefined ? Boolean(body.isAvailable) : true,
        dietaryTags: body.dietaryTags || "",
        prepTime: body.prepTime || "10-15 min",
        badge: body.badge || "",
        sortOrder: body.sortOrder ? Number(body.sortOrder) : 0,
      })
      .returning();
    return NextResponse.json(newItem[0]);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  await ensureTablesExist();
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: "Item ID required" }, { status: 400 });
    }

    const updated = await db
      .update(menuItems)
      .set({
        name: body.name,
        category: body.category,
        price: Number(body.price),
        description: body.description,
        imageUrl: body.imageUrl,
        isPopular: Boolean(body.isPopular),
        isAvailable: Boolean(body.isAvailable),
        dietaryTags: body.dietaryTags,
        prepTime: body.prepTime,
        badge: body.badge,
        sortOrder: body.sortOrder ? Number(body.sortOrder) : 0,
      })
      .where(eq(menuItems.id, body.id))
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
      return NextResponse.json({ error: "Item ID required" }, { status: 400 });
    }

    await db.delete(menuItems).where(eq(menuItems.id, Number(id)));
    return NextResponse.json({ success: true, id: Number(id) });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

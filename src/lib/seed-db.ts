import { db } from "@/db";
import { siteSettings, categories, menuItems, reviews, galleryItems, staffUsers, cafeTables } from "@/db/schema";
import {
  DEFAULT_SETTINGS,
  DEFAULT_CATEGORIES,
  DEFAULT_MENU_ITEMS,
  DEFAULT_REVIEWS,
  DEFAULT_GALLERY,
  DEFAULT_TABLES,
  DEFAULT_STAFF,
} from "@/lib/initial-data";

export async function ensureDbSeeded(force = false) {
  // NOTE: runs on every call — the 7 tiny SELECTs cost ~50ms total, but this is the ONLY
  // safe way to guarantee data self-heals: if a table ever becomes EMPTY (items deleted by
  // mistake), the defaults are restored on the very next request instead of never coming back.
  // (Force parameter kept for /api/setup compatibility.)
  try {
    const existingSettings = await db.select().from(siteSettings);
    if (existingSettings.length === 0) {
      const settingsToInsert = Object.entries(DEFAULT_SETTINGS).map(([key, value]) => ({
        key,
        value: typeof value === "object" ? JSON.stringify(value) : String(value),
      }));
      await db.insert(siteSettings).values(settingsToInsert);
    }

    const existingCategories = await db.select().from(categories);
    if (existingCategories.length === 0) {
      await db.insert(categories).values(
        DEFAULT_CATEGORIES.map((cat) => ({
          name: cat.name,
          slug: cat.slug,
          icon: cat.icon,
          sortOrder: cat.sortOrder,
        }))
      );
    }

    const existingMenuItems = await db.select().from(menuItems);
    if (existingMenuItems.length === 0) {
      await db.insert(menuItems).values(
        DEFAULT_MENU_ITEMS.map((item) => ({
          name: item.name,
          category: item.category,
          price: item.price,
          description: item.description,
          imageUrl: item.imageUrl,
          isPopular: item.isPopular,
          isAvailable: item.isAvailable,
          dietaryTags: item.dietaryTags ?? "",
          prepTime: item.prepTime ?? "10 min",
          badge: item.badge ?? "",
          sortOrder: item.sortOrder,
        }))
      );
    }

    const existingReviews = await db.select().from(reviews);
    if (existingReviews.length === 0) {
      await db.insert(reviews).values(
        DEFAULT_REVIEWS.map((rev) => ({
          customerName: rev.customerName,
          rating: rev.rating,
          reviewText: rev.reviewText,
          reviewDate: rev.reviewDate,
          isApproved: rev.isApproved,
          isVerified: rev.isVerified,
        }))
      );
    }

    const existingGallery = await db.select().from(galleryItems);
    if (existingGallery.length === 0) {
      await db.insert(galleryItems).values(
        DEFAULT_GALLERY.map((gal) => ({
          title: gal.title,
          category: gal.category,
          imageUrl: gal.imageUrl,
          caption: gal.caption,
          sortOrder: gal.sortOrder,
        }))
      );
    }

    const existingStaff = await db.select().from(staffUsers);
    if (existingStaff.length === 0) {
      await db.insert(staffUsers).values(DEFAULT_STAFF);
    }

    const existingTables = await db.select().from(cafeTables);
    if (existingTables.length === 0) {
      await db.insert(cafeTables).values(DEFAULT_TABLES);
    }

    return { success: true };
  } catch (error) {
    console.error("Db Seed Error:", error);
    return { success: false, error: String(error) };
  }
}

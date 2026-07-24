import { NextResponse } from "next/server";
import { ensureTablesExist, checkTablesReport, insertSmokeTest } from "@/db/migrate";
import { ensureDbSeeded } from "@/lib/seed-db";

/**
 * One-click database initializer/repair/verification.
 * Visit https://your-site.vercel.app/api/setup once after deploying.
 * It creates missing tables, repairs old broken columns, seeds default data,
 * then PROVES inserts work with a live insert+delete smoke test.
 */
export async function GET() {
  const migrateResult = await ensureTablesExist();
  const seedResult = await ensureDbSeeded();
  const tableReport = await checkTablesReport();
  const insertTest = await insertSmokeTest();

  const insertsOk = Object.values(insertTest).every((v) => v.includes("OK"));
  const tablesOk = Object.values(tableReport).every((v) => v === "OK");
  const allOk = migrateResult.success && seedResult.success && tablesOk && insertsOk;

  return NextResponse.json(
    {
      status: allOk ? "ready" : "needs_attention",
      message: allOk
        ? "Database fully initialized and verified — orders, reservations and menu inserts all work."
        : "Some steps need attention. See details below.",
      migration_errors: migrateResult.errors ?? [],
      seed_result: seedResult,
      tables: tableReport,
      insert_smoke_test: insertTest,
      next_step: allOk
        ? "Open /admin and log in with your admin password (set in Vercel env ADMIN_PASSWORD)."
        : "Fix your DATABASE_URL (Vercel → Project → Settings → Environment Variables) to a working Postgres/Neon connection string, then visit this URL again.",
    },
    { status: allOk ? 200 : 500 }
  );
}

export async function POST() {
  return GET();
}

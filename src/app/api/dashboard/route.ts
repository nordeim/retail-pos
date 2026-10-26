// ---------------------------------------------------------------------------
// /api/dashboard — the stats + series the Dashboard view renders:
// sales today, transactions today, product count, low-stock count,
// the 7-day sales series (V4/M2: the rolling window ends TODAY and each
// bucket's weekday label derives from its own date — isoWeekday — never
// from the bucket position), the category split, and the low-stock rows.
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { isoWeekday, startOfDay, WEEKDAY_MIN, weekWindow } from "@/lib/date";
import { withUser } from "@/lib/server/http";

export async function buildDashboard(userId: string, now: Date) {
  const today = startOfDay(now);
  const week = weekWindow(now); // 7 local midnights, oldest-first, today LAST

  const [todaySales, productCount, lowStockRows, weekSales, categories] =
    await Promise.all([
      db.sale.aggregate({
        where: { userId, status: "completada", createdAt: { gte: today } },
        _sum: { total: true },
        _count: true,
      }),
      db.product.count({ where: { userId } }),
      db.product.findMany({
        where: { userId, active: true, stock: { lte: db.product.fields.minStock } },
        select: { id: true, name: true, stock: true, minStock: true },
        orderBy: { stock: "asc" },
      }),
      db.sale.findMany({
        where: { userId, status: "completada", createdAt: { gte: week[0] } },
        select: { createdAt: true, total: true },
      }),
      db.category.findMany({
        where: { userId },
        include: { _count: { select: { products: true } } },
        // V10/F1h: createdAt ties (categories seeded in one tight loop)
        // made SQLite's order arbitrary — the id tiebreaker pins the
        // category order so the donut's palette mapping is deterministic
        // (the reference's own donut order is creation order).
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      }),
    ]);

  // Bucket the week's sales by local calendar day; the label rolls per-date
  // (V4/M2 — the pre-remediation positional bucket-index labeling was wrong
  // 6 days out of 7; isoWeekday per date is the reference behavior).
  const buckets = new Map<string, number>();
  for (const day of week) {
    buckets.set(day.toDateString(), 0);
  }
  for (const sale of weekSales) {
    const key = sale.createdAt.toDateString();
    if (buckets.has(key)) buckets.set(key, buckets.get(key)! + sale.total);
  }
  const weekly = week.map((day) => ({
    key: day.toDateString(),
    label: WEEKDAY_MIN[isoWeekday(day)],
    total: buckets.get(day.toDateString()) ?? 0,
  }));

  return {
    salesToday: todaySales._sum.total ?? 0,
    transactionsToday: todaySales._count,
    productCount,
    lowStockCount: lowStockRows.length,
    weekly,
    byCategory: categories.map((c) => ({ name: c.name, count: c._count.products })),
    lowStock: lowStockRows,
  };
}

export const GET = withUser(async (user) => {
  const data = await buildDashboard(user.id, new Date());
  return NextResponse.json(data);
});

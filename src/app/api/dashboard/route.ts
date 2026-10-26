// ---------------------------------------------------------------------------
// /api/dashboard — the stats + series the Dashboard view renders:
// sales today, transactions today, product count, low-stock count,
// the 7-day sales series (Monday-first labels), the category split, and the
// low-stock rows.
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { formatDayMonth, startOfDay, WEEKDAY_MIN } from "@/lib/date";
import { withUser } from "@/lib/server/http";

export async function buildDashboard(userId: string, now: Date) {
  const today = startOfDay(now);
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - 6);

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
        where: { userId, status: "completada", createdAt: { gte: weekStart } },
        select: { createdAt: true, total: true },
      }),
      db.category.findMany({
        where: { userId },
        include: { _count: { select: { products: true } } },
        orderBy: { createdAt: "asc" },
      }),
    ]);

  // Bucket the week's sales by local calendar day, Monday-first.
  const buckets = new Map<string, number>();
  for (let i = 0; i < 7; i += 1) {
    const day = new Date(weekStart);
    day.setDate(day.getDate() + i);
    buckets.set(day.toDateString(), 0);
  }
  for (const sale of weekSales) {
    const key = sale.createdAt.toDateString();
    if (buckets.has(key)) buckets.set(key, buckets.get(key)! + sale.total);
  }
  const weekly = Array.from(buckets.entries()).map(([key, total], index) => ({
    key,
    label: WEEKDAY_MIN[index],
    total,
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
  void formatDayMonth; // the axis formatter lives in date.ts (unit-pinned)
  return NextResponse.json(data);
});

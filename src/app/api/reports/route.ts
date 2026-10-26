// ---------------------------------------------------------------------------
// /api/reports?days=7|14|30|90 — the Reports page aggregates: total revenue,
// transaction count, average ticket, the daily sales series, and the
// per-payment-method breakdown. Completed sales only.
// ---------------------------------------------------------------------------

import { NextResponse, type NextRequest } from "next/server";

import { db } from "@/lib/db";
import { formatDayMonth, startOfDay } from "@/lib/date";
import { withUser } from "@/lib/server/http";
import { reportDays } from "@/lib/validation";

export async function buildReport(userId: string, days: 7 | 14 | 30 | 90, now: Date) {
  const start = startOfDay(now);
  start.setDate(start.getDate() - (days - 1));

  const sales = await db.sale.findMany({
    where: { userId, status: "completada", createdAt: { gte: start } },
    select: { createdAt: true, total: true, method: true },
    orderBy: { createdAt: "asc" },
  });

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
  const transactions = sales.length;
  const averageTicket =
    transactions > 0 ? Math.round(totalRevenue / transactions) : 0;

  // Daily buckets over the whole window (empty days render as 0).
  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i += 1) {
    const day = new Date(start);
    day.setDate(day.getDate() + i);
    buckets.set(day.toDateString(), 0);
  }
  for (const sale of sales) {
    const key = sale.createdAt.toDateString();
    if (buckets.has(key)) buckets.set(key, buckets.get(key)! + sale.total);
  }
  const daily = Array.from(buckets.entries()).map(([key, total]) => {
    const day = new Date(key);
    return { date: key, label: formatDayMonth(day), total };
  });

  const byMethod = (["efectivo", "tarjeta"] as const)
    .map((method) => {
      const rows = sales.filter((sale) => sale.method === method);
      return {
        method,
        total: rows.reduce((sum, sale) => sum + sale.total, 0),
        count: rows.length,
      };
    })
    .filter((entry) => entry.count > 0);

  return { totalRevenue, transactions, averageTicket, daily, byMethod };
}

export const GET = withUser(async (user, request: NextRequest) => {
  const days = reportDays(request.nextUrl.searchParams.get("days"));
  const data = await buildReport(user.id, days, new Date());
  return NextResponse.json(data);
});

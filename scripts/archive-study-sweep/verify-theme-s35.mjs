// Theme verification (the closing guard) — the demo user's resting state.
import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();
const u = await p.user.findUnique({
  where: { email: "demo@studyflow.app" },
  select: { themeMode: true, accentColor: true },
});
console.log(JSON.stringify({ themeMode: u?.themeMode, accentColor: u?.accentColor }));
await p.$disconnect();

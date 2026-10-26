import { PrismaClient } from "@prisma/client";

async function main() {
  const db = new PrismaClient();
  const user = await db.user.findUnique({ where: { email: "demo@studyflow.app" } });
  if (user) {
    await db.user.delete({ where: { id: user.id } });
    console.log("user deleted — cascading rows gone");
  } else {
    console.log("no user");
  }
  await db.$disconnect();
}
main();

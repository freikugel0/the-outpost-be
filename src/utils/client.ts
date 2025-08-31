import { PrismaClient } from "../../generated/prisma/index.js";

const prisma = new PrismaClient();

// async function init() {
//   await prisma.$executeRawUnsafe(`DISCARD ALL`);
// }
//
// init().catch((e) => {
//   console.error("Failed to init prisma:", e);
// });

export default prisma;

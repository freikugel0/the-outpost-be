import { hashPassword } from "../src/utils/auth.js";
import prisma from "../src/utils/client.js";

async function main() {
  // Clear existing data
  await prisma.user.deleteMany();

  // Create users
  const userNames = [
    "Alice",
    "Bob",
    "Charlie",
    "Diana",
    "Eve",
    "Frank",
    "Grace",
  ];
  await Promise.all(
    userNames.map(async (name, i) =>
      prisma.user.create({
        data: {
          email: `${name.toLowerCase()}${i}@gmail.com`,
          password: await hashPassword(`${name.toLowerCase()}12345`),
        },
      }),
    ),
  );

  console.log("Seeding complete.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

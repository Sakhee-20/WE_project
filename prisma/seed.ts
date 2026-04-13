import { PrismaClient } from "@prisma/client";
import { textToDoc } from "../lib/tiptap/empty-doc";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create a user
  const user = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      email: "demo@example.com",
      name: "Demo User",
    },
  });

  console.log(`Created user: ${user.name} (${user.email})`);

  // Create first subject with one chapter and a note
  const mathSubject = await prisma.subject.upsert({
    where: { id: "subject-math-seed" },
    update: {},
    create: {
      id: "subject-math-seed",
      name: "Mathematics",
      description: "Core maths topics",
      userId: user.id,
      chapters: {
        create: {
          title: "Algebra",
          order: 1,
          notes: {
            create: {
              title: "Introduction to Algebra",
              content: textToDoc(
                "Algebra is the branch of mathematics dealing with symbols and the rules for manipulating those symbols."
              ),
              versions: {
                create: {
                  content: textToDoc(
                    "Algebra is the branch of mathematics dealing with symbols and the rules for manipulating those symbols."
                  ),
                },
              },
            },
          },
        },
      },
    },
  });

  console.log(`Created subject: ${mathSubject.name}`);

  // Create second subject
  const physicsSubject = await prisma.subject.upsert({
    where: { id: "subject-physics-seed" },
    update: {},
    create: {
      id: "subject-physics-seed",
      name: "Physics",
      description: "Classical and modern physics",
      userId: user.id,
      chapters: {
        create: {
          title: "Mechanics",
          order: 1,
          notes: {
            create: {
              title: "Newton's Laws",
              content: textToDoc(
                "Newton's three laws of motion form the foundation of classical mechanics."
              ),
              versions: {
                create: {
                  content: textToDoc(
                    "Newton's three laws of motion form the foundation of classical mechanics."
                  ),
                },
              },
            },
          },
        },
      },
    },
  });

  console.log(`Created subject: ${physicsSubject.name}`);

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

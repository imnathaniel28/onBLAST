import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [alice, bob, carol] = await Promise.all([
    prisma.account.upsert({
      where: { publicKey: "seed-pubkey-alice-00000000000000001" },
      update: { reputationScore: 42 },
      create: { publicKey: "seed-pubkey-alice-00000000000000001", reputationScore: 42 },
    }),
    prisma.account.upsert({
      where: { publicKey: "seed-pubkey-bob-000000000000000001" },
      update: { reputationScore: 15 },
      create: { publicKey: "seed-pubkey-bob-000000000000000001", reputationScore: 15 },
    }),
    prisma.account.upsert({
      where: { publicKey: "seed-pubkey-carol-0000000000000000001" },
      update: { reputationScore: 7 },
      create: { publicKey: "seed-pubkey-carol-0000000000000000001", reputationScore: 7 },
    }),
  ]);

  const [cable, bank, movers] = await Promise.all([
    prisma.business.upsert({
      where: { slug: "acme-cable" },
      update: {},
      create: {
        slug: "acme-cable",
        name: "Acme Cable Co.",
        description:
          "Regional cable and internet provider. Known for 4-hour service windows and unexplained 'infrastructure fees'.",
      },
    }),
    prisma.business.upsert({
      where: { slug: "trusty-bank" },
      update: {},
      create: {
        slug: "trusty-bank",
        name: "Trusty Bank",
        description: "Community bank. Reports of sudden account closures without notice or appeal path.",
      },
    }),
    prisma.business.upsert({
      where: { slug: "bright-movers" },
      update: {},
      create: {
        slug: "bright-movers",
        name: "Bright Movers LLC",
        description: "Local moving company. Quoted prices and final invoices often diverge significantly.",
      },
    }),
  ]);

  await Promise.all([
    prisma.post.create({
      data: {
        authorId: alice.id,
        businessId: cable.id,
        content:
          "Scheduled between 8am–12pm. Tech showed up at 4:30pm with zero contact. Third time this year. Their hold music should be a legal disclaimer.",
      },
    }),
    prisma.post.create({
      data: {
        authorId: bob.id,
        businessId: cable.id,
        content:
          "Charged a $14.99 'wifi enhancement fee' that was never mentioned during signup. Six weeks later, still fighting to get it reversed.",
      },
    }),
    prisma.post.create({
      data: {
        authorId: carol.id,
        businessId: cable.id,
        content:
          "Internet goes out every time it rains. They say it's 'within acceptable parameters.' I say acceptable for who?",
      },
    }),
    prisma.post.create({
      data: {
        authorId: alice.id,
        businessId: bank.id,
        content:
          "Account closed after 11 years with no warning and no explanation. Funds returned after 8 business days. Zero escalation path, no supervisor available.",
      },
    }),
    prisma.post.create({
      data: {
        authorId: bob.id,
        businessId: movers.id,
        content:
          "Quoted $400. Final invoice was $1,100. Half my boxes arrived damaged. Nobody answering the phone post-move. Going to small claims.",
      },
    }),
    prisma.post.create({
      data: {
        authorId: carol.id,
        businessId: null,
        content:
          "General rule I've learned: any company that lists fees without line-itemizing them is counting on you not asking. Always ask before you sign.",
      },
    }),
  ]);

  console.log("Seed complete: 3 accounts, 3 businesses, 6 posts.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

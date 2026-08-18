import "dotenv/config"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

const email = process.env.SEED_ADMIN_EMAIL ?? "admin@peser.local"
const password = process.env.SEED_ADMIN_PASSWORD ?? "admin123"

async function main() {
  const passwordHash = await bcrypt.hash(password, 10)

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      nama: "Administrator",
      role: "ADMIN",
      credential: { create: { email, passwordHash } },
    },
  })

  console.log(`Seed admin OK: ${user.email} (id ${user.id})`)
  console.log(`Login: ${email} / ${password}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
import { prisma } from './src/client'

async function main(): Promise<void> {
  // Seed will be implemented in PROMPT_2
  // For now, just verify connection works
  console.log('🌱 Seed placeholder — will be populated in PROMPT_2')
  console.log('📦 Database connected successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

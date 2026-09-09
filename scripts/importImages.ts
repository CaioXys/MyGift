import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const imagesDirectory = path.join(process.cwd(), 'src', 'assets', 'images')

async function main(): Promise<void> {
  const imageFiles = fs.readdirSync(imagesDirectory)
  const gifts = await prisma.gift.findMany({
    select: { id: true, category: true },
  })
  const imageBuffers = new Map<string, Buffer | null>()
  let updatedCount = 0

  for (const gift of gifts) {
    let imageBuffer: Buffer | null

    if (imageBuffers.has(gift.category)) {
      imageBuffer = imageBuffers.get(gift.category) ?? null
    } else {
      const imageFile = imageFiles.find(
        (fileName) => path.parse(fileName).name === gift.category,
      )

      if (!imageFile) {
        console.warn(
          `Imagem não encontrada para a categoria "${gift.category}".`,
        )
        imageBuffers.set(gift.category, null)
        continue
      }

      imageBuffer = fs.readFileSync(path.join(imagesDirectory, imageFile))
      imageBuffers.set(gift.category, imageBuffer)
    }

    if (!imageBuffer) continue

    await prisma.gift.update({
      where: { id: gift.id },
      data: { imageCategory: imageBuffer },
    })
    updatedCount += 1
  }

  console.log(`Gifts atualizados: ${updatedCount}`)
}

main()
  .catch((error: unknown) => {
    console.error('Erro ao importar imagens das categorias:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

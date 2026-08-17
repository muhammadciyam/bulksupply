import "dotenv/config";
import { prisma } from "./src/lib/prisma";
import { saveImageFromUrl } from "./src/lib/image-upload";

async function main() {
  const product = await prisma.product.findUnique({ where: { sku: "DR-001" } });
  if (!product) throw new Error("Sample product DR-001 not found — did the seed run?");

  const imageUrl = await saveImageFromUrl(
    "products",
    product.id,
    "https://placehold.co/800x800/2f8f4e/ffffff.png?text=Golden+UHT+Milk"
  );

  const image = await prisma.productImage.create({
    data: { productId: product.id, imageUrl, sortOrder: 0 },
  });

  console.log("Product:", product.name, `(${product.sku})`);
  console.log("Image URL:", image.imageUrl);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

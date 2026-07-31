require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

(async () => {
  const product = await prisma.product.findFirst({
    where: { name: { contains: "Fragrance Free" } },
    include: { category: true },
  });
  console.log("Product:", product?.name, "| current category:", product?.category?.name, product?.categoryId);

  const testCats = await prisma.category.findMany({ where: { name: { contains: "TestSub" } } });
  const testCats2 = await prisma.category.findMany({ where: { name: { contains: "FilterTestSub" } } });
  console.log("Leftover TestSub categories:", testCats);
  console.log("Leftover FilterTestSub categories:", testCats2);

  const wipesCategory = await prisma.category.findFirst({ where: { name: "Wipes & Diapers" } });
  console.log("Wipes & Diapers id:", wipesCategory?.id);

  await prisma.$disconnect();
})();

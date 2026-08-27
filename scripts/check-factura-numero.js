const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

prisma.factura.findMany({ select: { numero: true, serieId: true, empresaId: true, esDirecta: true } })
  .then((r) => { console.log(r); return prisma.$disconnect(); })
  .catch((e) => { console.error(e); process.exit(1); });

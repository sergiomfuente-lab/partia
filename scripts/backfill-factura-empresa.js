// Rellena empresaId en las Facturas existentes usando el empresaId de su Cliente.
// Idempotente, seguro de ejecutar varias veces.
//
// Uso: node scripts/backfill-factura-empresa.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const total = await prisma.factura.count();
  const nulasAntes = await prisma.factura.count({ where: { empresaId: null } });

  console.log(`Total de facturas: ${total}`);
  console.log(`Facturas con empresaId = null (antes): ${nulasAntes}`);

  if (nulasAntes === 0) {
    console.log("No hay nada que rellenar. Ya se puede hacer el campo obligatorio.");
    return;
  }

  const resultado = await prisma.$executeRawUnsafe(`
    UPDATE "Factura" f
    SET "empresaId" = c."empresaId"
    FROM "Cliente" c
    WHERE f."clienteId" = c.id
      AND f."empresaId" IS NULL;
  `);

  console.log(`Filas actualizadas: ${resultado}`);

  const nulasDespues = await prisma.factura.count({ where: { empresaId: null } });
  console.log(`Facturas con empresaId = null (después): ${nulasDespues}`);

  if (nulasDespues > 0) {
    console.log("\n⚠️  Aún quedan facturas sin empresaId. Revísalas antes de hacer el campo obligatorio:");
    const huerfanas = await prisma.factura.findMany({
      where: { empresaId: null },
      select: { id: true, numero: true, clienteId: true },
    });
    console.log(huerfanas);
  } else {
    console.log("\n✅ Todas las facturas tienen empresaId. Ya puedes hacer el campo obligatorio.");
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

// Script puntual: rellena empresaId en las Ordenes antiguas que aún lo tengan a null,
// usando el empresaId de su Cliente asociado. Seguro de ejecutar varias veces (idempotente).
//
// Uso: node scripts/backfill-orden-empresa.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const total = await prisma.orden.count();
  const nulasAntes = await prisma.orden.count({ where: { empresaId: null } });

  console.log(`Total de órdenes: ${total}`);
  console.log(`Órdenes con empresaId = null (antes): ${nulasAntes}`);

  if (nulasAntes === 0) {
    console.log("No hay nada que rellenar. Ya se puede hacer el campo obligatorio.");
    return;
  }

  const resultado = await prisma.$executeRawUnsafe(`
    UPDATE "Orden" o
    SET "empresaId" = c."empresaId"
    FROM "Cliente" c
    WHERE o."clienteId" = c.id
      AND o."empresaId" IS NULL;
  `);

  console.log(`Filas actualizadas: ${resultado}`);

  const nulasDespues = await prisma.orden.count({ where: { empresaId: null } });
  console.log(`Órdenes con empresaId = null (después): ${nulasDespues}`);

  if (nulasDespues > 0) {
    console.log(
      "\n⚠️  Aún quedan órdenes sin empresaId. Puede que tengan un clienteId huérfano " +
      "(cliente eliminado) o algún otro caso raro. Revísalas antes de hacer el campo obligatorio:"
    );
    const huerfanas = await prisma.orden.findMany({
      where: { empresaId: null },
      select: { id: true, numero: true, clienteId: true },
    });
    console.log(huerfanas);
  } else {
    console.log("\n✅ Todas las órdenes tienen empresaId. Ya puedes hacer el campo obligatorio.");
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

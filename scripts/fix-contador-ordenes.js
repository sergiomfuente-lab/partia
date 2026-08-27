// Sincroniza ContadorOrden con el número más alto ya usado en Orden.numero
// por cada empresa, para evitar colisiones al generar nuevos números.
//
// Uso: node scripts/fix-contador-ordenes.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const empresas = await prisma.empresa.findMany({ select: { id: true, nombre: true } });

  for (const empresa of empresas) {
    const ordenes = await prisma.orden.findMany({
      where: { empresaId: empresa.id },
      select: { numero: true },
    });

    let maxNumero = 0;
    const noReconocidos = [];
    for (const o of ordenes) {
      const m = /^ORD-(\d+)$/.exec(o.numero);
      if (m) {
        maxNumero = Math.max(maxNumero, parseInt(m[1], 10));
      } else {
        noReconocidos.push(o.numero);
      }
    }

    const contadorActual = await prisma.contadorOrden.findUnique({
      where: { empresaId: empresa.id },
    });

    console.log(
      `Empresa "${empresa.nombre}": ${ordenes.length} órdenes, número más alto detectado = ${maxNumero}, ` +
      `contador actual en BD = ${contadorActual?.contador ?? "(no existe)"}`
    );
    if (noReconocidos.length > 0) {
      console.log(`  ⚠️  Números con formato no reconocido (ignorados para el cálculo): ${noReconocidos.join(", ")}`);
    }

    if (!contadorActual || contadorActual.contador < maxNumero) {
      await prisma.contadorOrden.upsert({
        where:  { empresaId: empresa.id },
        create: { empresaId: empresa.id, contador: maxNumero },
        update: { contador: maxNumero },
      });
      console.log(`  ✅ Contador actualizado a ${maxNumero}.`);
    } else {
      console.log(`  (sin cambios, el contador ya era suficiente)`);
    }
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

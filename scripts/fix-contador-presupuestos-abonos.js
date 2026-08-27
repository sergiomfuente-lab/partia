// Sincroniza ContadorPresupuesto (por empresa+año) y el contadorAbono de cada
// SerieFacturacion, con el número más alto ya usado, para evitar colisiones
// antes de aplicar la restricción de único por empresa.
//
// Uso: node scripts/fix-contador-presupuestos-abonos.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function fixPresupuestos() {
  console.log("\n=== Presupuestos ===");
  const empresas = await prisma.empresa.findMany({ select: { id: true, nombre: true } });

  for (const empresa of empresas) {
    const presupuestos = await prisma.presupuesto.findMany({
      where: { empresaId: empresa.id },
      select: { numero: true },
    });

    const maxPorAnio = {};
    const noReconocidos = [];
    for (const p of presupuestos) {
      const m = /^PRES-(\d+)-(\d{4})$/.exec(p.numero);
      if (m) {
        const [, num, anio] = m;
        maxPorAnio[anio] = Math.max(maxPorAnio[anio] ?? 0, parseInt(num, 10));
      } else {
        noReconocidos.push(p.numero);
      }
    }

    if (noReconocidos.length > 0) {
      console.log(`Empresa "${empresa.nombre}": números no reconocidos (ignorados): ${noReconocidos.join(", ")}`);
    }

    for (const [anio, maxNum] of Object.entries(maxPorAnio)) {
      const contadorActual = await prisma.contadorPresupuesto.findUnique({
        where: { empresaId_anio: { empresaId: empresa.id, anio: parseInt(anio, 10) } },
      });
      console.log(
        `Empresa "${empresa.nombre}" año ${anio}: máximo detectado = ${maxNum}, ` +
        `contador actual = ${contadorActual?.contador ?? "(no existe)"}`
      );
      if (!contadorActual || contadorActual.contador < maxNum) {
        await prisma.contadorPresupuesto.upsert({
          where:  { empresaId_anio: { empresaId: empresa.id, anio: parseInt(anio, 10) } },
          create: { empresaId: empresa.id, anio: parseInt(anio, 10), contador: maxNum },
          update: { contador: maxNum },
        });
        console.log(`  ✅ Actualizado a ${maxNum}.`);
      } else {
        console.log(`  (sin cambios)`);
      }
    }
  }
}

async function fixAbonos() {
  console.log("\n=== Abonos ===");
  const series = await prisma.serieFacturacion.findMany({
    select: { id: true, nombre: true, prefijoAbono: true, contadorAbono: true, empresaId: true },
  });

  for (const serie of series) {
    const abonos = await prisma.abono.findMany({
      where: { serieId: serie.id },
      select: { numero: true },
    });

    let maxNum = 0;
    const noReconocidos = [];
    for (const a of abonos) {
      const m = /-(\d+)-\d{4}$/.exec(a.numero);
      if (m) {
        maxNum = Math.max(maxNum, parseInt(m[1], 10));
      } else {
        noReconocidos.push(a.numero);
      }
    }

    console.log(
      `Serie "${serie.nombre}" (prefijoAbono="${serie.prefijoAbono}"): ${abonos.length} abonos, ` +
      `máximo detectado = ${maxNum}, contadorAbono actual = ${serie.contadorAbono}`
    );
    if (noReconocidos.length > 0) {
      console.log(`  ⚠️  Números no reconocidos (ignorados): ${noReconocidos.join(", ")}`);
    }

    if (serie.contadorAbono < maxNum) {
      await prisma.serieFacturacion.update({
        where: { id: serie.id },
        data:  { contadorAbono: maxNum },
      });
      console.log(`  ✅ contadorAbono actualizado a ${maxNum}.`);
    } else {
      console.log(`  (sin cambios)`);
    }
  }
}

async function main() {
  await fixPresupuestos();
  await fixAbonos();
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

// Sincroniza ContadorFactura (empresa+año, esquema legado sin serie) y
// SerieFacturacion.contadorActual (esquema con serie) con el número más
// alto ya usado en Factura.numero, para evitar colisiones.
//
// Uso: node scripts/fix-contador-facturas.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const facturas = await prisma.factura.findMany({
    select: { numero: true, serieId: true, empresaId: true, fecha: true },
  });

  // --- Legado: sin serie -> numero = "{contador}_{dd}-{mm}-{yyyy}" ---
  const maxLegadoPorEmpresaAnio = {}; // key: empresaId|anio
  // --- Con serie -> numero = "{prefijo}-{contador}-{anio}" ---
  const maxSeriePorSerie = {}; // key: serieId

  const noReconocidos = [];

  for (const f of facturas) {
    if (!f.serieId) {
      const m = /^(\d+)_\d{2}-\d{2}-(\d{4})$/.exec(f.numero);
      if (m) {
        const [, num, anio] = m;
        const key = `${f.empresaId}|${anio}`;
        maxLegadoPorEmpresaAnio[key] = Math.max(maxLegadoPorEmpresaAnio[key] ?? 0, parseInt(num, 10));
      } else {
        noReconocidos.push(f.numero);
      }
    } else {
      const m = /-(\d+)-(\d{4})$/.exec(f.numero);
      if (m) {
        const [, num] = m;
        maxSeriePorSerie[f.serieId] = Math.max(maxSeriePorSerie[f.serieId] ?? 0, parseInt(num, 10));
      } else {
        noReconocidos.push(f.numero);
      }
    }
  }

  if (noReconocidos.length > 0) {
    console.log(`⚠️  Números con formato no reconocido (ignorados): ${noReconocidos.join(", ")}`);
  }

  console.log("\n=== Contador legado (sin serie) ===");
  for (const [key, maxNum] of Object.entries(maxLegadoPorEmpresaAnio)) {
    const [empresaId, anioStr] = key.split("|");
    const anio = parseInt(anioStr, 10);
    const actual = await prisma.contadorFactura.findUnique({
      where: { empresaId_anio: { empresaId, anio } },
    });
    console.log(`Empresa ${empresaId} año ${anio}: máximo detectado = ${maxNum}, contador actual = ${actual?.contador ?? "(no existe)"}`);
    if (!actual || actual.contador < maxNum) {
      await prisma.contadorFactura.upsert({
        where:  { empresaId_anio: { empresaId, anio } },
        create: { empresaId, anio, contador: maxNum },
        update: { contador: maxNum },
      });
      console.log(`  ✅ Actualizado a ${maxNum}.`);
    } else {
      console.log("  (sin cambios)");
    }
  }

  console.log("\n=== Contador por serie ===");
  for (const [serieId, maxNum] of Object.entries(maxSeriePorSerie)) {
    const serie = await prisma.serieFacturacion.findUnique({ where: { id: serieId } });
    console.log(`Serie "${serie?.nombre}" (${serieId}): máximo detectado = ${maxNum}, contadorActual = ${serie?.contadorActual}`);
    if (serie && serie.contadorActual < maxNum) {
      await prisma.serieFacturacion.update({
        where: { id: serieId },
        data:  { contadorActual: maxNum },
      });
      console.log(`  ✅ Actualizado a ${maxNum}.`);
    } else {
      console.log("  (sin cambios)");
    }
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

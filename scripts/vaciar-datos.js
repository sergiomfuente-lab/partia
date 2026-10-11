/**
 * Vacía los datos de negocio de la base de datos para empezar una migración
 * limpia desde Bubble.
 *
 * SE CONSERVA:  Empresa, Usuario y la configuración (TipoServicio,
 *               SerieFacturacion, PlazoPago).
 * SE BORRA:     clientes, máquinas, órdenes (y sus servicios, recambios,
 *               sesiones de trabajo, historial de horas), presupuestos,
 *               facturas, abonos, proveedores, productos, compras, movimientos
 *               de stock y los contadores de numeración.
 * SE REINICIA:  contadores de las series de facturación y la última huella
 *               Veri*Factu de la empresa (porque ya no habrá facturas).
 *
 * USO
 *   node scripts/vaciar-datos.js            -> solo muestra qué borraría
 *   node scripts/vaciar-datos.js --apply    -> borra de verdad (pide confirmación)
 *
 * Antes de borrar guarda una copia de lo que se conserva en _backups/.
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const APLICAR = process.argv.includes("--apply");

// Orden seguro respecto a las claves foráneas (primero lo que depende de otras tablas).
const TABLAS_A_BORRAR = [
  "movimientoStock", "compraLinea", "compra",
  "abonoLinea", "abono",
  "facturaLinea",
  "historialHorasMaquina", "sesionTrabajo",
  "servicio", "servicioLibre", "repuesto",
  "orden", "factura", "presupuesto",
  "maquina", "cliente", "proveedor", "producto",
  "contadorFactura", "contadorPresupuesto", "contadorOrden",
];
const TABLAS_QUE_SE_CONSERVAN = ["empresa", "usuario", "tipoServicio", "serieFacturacion", "plazoPago"];

function destinoDeLaConexion() {
  const url = process.env.DATABASE_URL || "";
  const m = url.match(/@([^/?]+)\/([^?]*)/);
  return m ? `${m[1]} / base de datos "${m[2]}"` : "(no se pudo leer DATABASE_URL)";
}

function preguntar(texto) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(texto, (r) => { rl.close(); resolve(r); }));
}

async function main() {
  console.log(`\n${"=".repeat(70)}`);
  console.log(`Vaciar datos   [modo: ${APLICAR ? "APLICAR (borra de verdad)" : "PRUEBA (no borra nada)"}]`);
  console.log(`Base de datos: ${destinoDeLaConexion()}`);
  console.log(`${"=".repeat(70)}`);

  const empresas = await prisma.empresa.findMany();
  for (const e of empresas) {
    console.log(`\nEmpresa: ${e.nombre} (${e.id})`);
    if (e.facturacionInmutableActiva) {
      console.log("  ⚠ ATENCIÓN: esta empresa tiene activada la facturación inmutable (Veri*Factu).");
      console.log("    Borrar sus facturas solo es razonable si todas son de prueba o ya migradas.");
    }
  }

  console.log("\nSe CONSERVAN:");
  for (const t of TABLAS_QUE_SE_CONSERVAN) console.log(`  ${t}: ${await prisma[t].count()} filas`);

  console.log("\nSe BORRARÍAN:");
  let totalABorrar = 0;
  for (const t of TABLAS_A_BORRAR) {
    const n = await prisma[t].count();
    totalABorrar += n;
    console.log(`  ${t}: ${n} filas`);
  }
  console.log(`\nTotal de filas a borrar: ${totalABorrar}`);
  console.log("También se pondrán a 0 los contadores de las series de facturación y se vaciará la última huella Veri*Factu de la empresa.");

  if (!APLICAR) {
    console.log("\nModo prueba: no se ha borrado nada. Ejecuta con --apply para borrar de verdad.\n");
    return;
  }

  // Copia de lo que se conserva
  const carpeta = path.join(__dirname, "..", "_backups");
  fs.mkdirSync(carpeta, { recursive: true });
  const copia = {};
  for (const t of TABLAS_QUE_SE_CONSERVAN) copia[t] = await prisma[t].findMany();
  const sello = new Date().toISOString().replace(/[:.]/g, "-");
  const fichero = path.join(carpeta, `antes-de-vaciar-${sello}.json`);
  fs.writeFileSync(fichero, JSON.stringify(copia, null, 2));
  console.log(`\nCopia de lo que se conserva guardada en: ${fichero}`);

  const resp = await preguntar(`\nEscribe BORRAR (en mayúsculas) para borrar ${totalABorrar} filas de ${destinoDeLaConexion()}: `);
  if (resp.trim() !== "BORRAR") {
    console.log("Cancelado. No se ha borrado nada.\n");
    return;
  }

  // Todo en una sola transacción: o se borra todo o no se borra nada.
  const operaciones = TABLAS_A_BORRAR.map((t) => prisma[t].deleteMany({}));
  operaciones.push(prisma.serieFacturacion.updateMany({ data: { contadorActual: 0, contadorAbono: 0 } }));
  operaciones.push(prisma.empresa.updateMany({ data: { ultimaHuellaFactura: null } }));
  await prisma.$transaction(operaciones);

  console.log("\nComprobación tras el borrado:");
  for (const t of TABLAS_A_BORRAR) {
    const n = await prisma[t].count();
    if (n !== 0) console.log(`  ⚠ ${t} todavía tiene ${n} filas`);
  }
  for (const t of TABLAS_QUE_SE_CONSERVAN) console.log(`  ${t}: ${await prisma[t].count()} filas (conservadas)`);
  console.log("\nListo. La base de datos está vacía de datos de negocio y preparada para la migración.\n");
}

main()
  .catch((e) => {
    console.error("\n❌ Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

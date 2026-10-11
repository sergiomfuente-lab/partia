/**
 * Corrige la numeración de las facturas migradas desde Bubble.
 *
 * Las facturas de Bubble ya se emitieron con el formato  Nº_DD-MM-AAAA
 * (por ejemplo 253_07-01-2026), que es el campo ID_FACTURA del CSV. La primera
 * migración las había renumerado como F-001-2023, F-002-2023... y eso no
 * coincide con lo que se entregó a los clientes. Este script devuelve a cada
 * factura su número original y deja la numeración lista para continuar.
 *
 * Qué hace:
 *   1. Para cada fila de TBL-FACTURAS cuyo "unique id" exista como Factura en
 *      la base de datos, pone numero = ID_FACTURA (si viniera vacío, usa
 *      NUM_FACTURA + fecha de la factura).
 *   2. Quita la serie de esas facturas (serieId = null): el formato Nº_fecha
 *      es el de la numeración "sin serie" de la aplicación.
 *   3. Si ya no queda ninguna factura en la serie predeterminada, vuelve a
 *      poner su contador a 0.
 *   4. Deja el contador del año en curso (ContadorFactura) en el mayor número
 *      de ese año, o en el valor de --siguiente=N menos 1 si se indica, para
 *      que la próxima factura sea la siguiente.
 *
 * Uso (desde la raíz del proyecto):
 *   node scripts/corregir-numeros-factura.js                  (prueba: no escribe nada)
 *   node scripts/corregir-numeros-factura.js --apply          (aplica los cambios)
 *   node scripts/corregir-numeros-factura.js --apply --siguiente=469
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const APLICAR = process.argv.includes("--apply");
const argSiguiente = process.argv.find((a) => a.startsWith("--siguiente="));
const SIGUIENTE = argSiguiente ? parseInt(argSiguiente.split("=")[1], 10) : null;
const DATA_DIR = process.env.MIGRACION_DIR || path.join(__dirname, "..", "migracion-bubble");

const vacio = (s) => s === undefined || s === null || !String(s).trim();
const pad = (n) => String(n).padStart(2, "0");

function leerFacturasCsv() {
  if (!fs.existsSync(DATA_DIR)) throw new Error(`No encuentro la carpeta ${DATA_DIR}.`);
  const candidatos = fs.readdirSync(DATA_DIR)
    .filter((f) => f.toLowerCase().endsWith(".csv") && f.includes("Tabla_TBL-FACTURAS_"))
    .sort();
  if (candidatos.length === 0) throw new Error(`No encuentro el CSV Tabla_TBL-FACTURAS_*.csv en ${DATA_DIR}.`);
  const archivo = candidatos[candidatos.length - 1];
  console.log(`Leyendo ${archivo}`);
  const contenido = fs.readFileSync(path.join(DATA_DIR, archivo), "utf8");
  return parse(contenido, { columns: true, skip_empty_lines: true, bom: true, trim: false });
}

const FORMATO = /^(\d+)_(\d{2})-(\d{2})-(\d{4})$/;

async function main() {
  console.log(APLICAR ? "MODO APLICAR: se escribirá en la base de datos.\n" : "MODO PRUEBA: no se escribe nada. Añade --apply para aplicar.\n");

  const filas = leerFacturasCsv();
  const facturas = await prisma.factura.findMany({
    select: { id: true, numero: true, fecha: true, empresaId: true, serieId: true },
  });
  const porId = new Map(facturas.map((f) => [f.id, f]));
  console.log(`Facturas en la base de datos: ${facturas.length}. Filas en el CSV: ${filas.length}.`);

  const cambios = [];
  const usados = new Set();
  const avisos = [];
  let sinFactura = 0;

  for (const row of filas) {
    const f = porId.get(row["unique id"]);
    if (!f) { sinFactura++; continue; }

    let nuevo = vacio(row.ID_FACTURA) ? null : String(row.ID_FACTURA).trim();
    if (!nuevo) {
      const fecha = f.fecha;
      nuevo = `${String(row.NUM_FACTURA).trim()}_${pad(fecha.getDate())}-${pad(fecha.getMonth() + 1)}-${fecha.getFullYear()}`;
      avisos.push(`Factura ${f.id}: no tenía ID_FACTURA; se usa ${nuevo}.`);
    }
    if (usados.has(nuevo)) {
      throw new Error(`El número ${nuevo} está repetido en el CSV. No se cambia nada.`);
    }
    usados.add(nuevo);
    if (!FORMATO.test(nuevo)) avisos.push(`Factura con número no estándar, se respeta tal cual: ${nuevo}.`);
    cambios.push({ id: f.id, empresaId: f.empresaId, anterior: f.numero, nuevo });
  }

  // Un número nuevo no puede chocar con una factura que no se toque.
  const idsCambiados = new Set(cambios.map((c) => c.id));
  for (const f of facturas) {
    if (!idsCambiados.has(f.id) && usados.has(f.numero)) {
      throw new Error(`El número ${f.numero} ya lo usa otra factura que no se modifica. No se cambia nada.`);
    }
  }

  console.log(`\nFacturas a renumerar: ${cambios.length} (filas del CSV sin factura en la base de datos: ${sinFactura}).`);
  console.log("Ejemplos:");
  for (const c of cambios.slice(0, 5)) console.log(`  ${c.anterior}  ->  ${c.nuevo}`);
  for (const a of avisos) console.log(`  Aviso: ${a}`);

  // Contador del año en curso
  const anio = new Date().getFullYear();
  let maxAnio = 0;
  for (const c of cambios) {
    const m = FORMATO.exec(c.nuevo);
    if (m && parseInt(m[4], 10) === anio) maxAnio = Math.max(maxAnio, parseInt(m[1], 10));
  }
  const contadorObjetivo = SIGUIENTE ? SIGUIENTE - 1 : maxAnio;
  const empresaIds = [...new Set(cambios.map((c) => c.empresaId))];
  console.log(`\nContador de ${anio}: mayor número migrado = ${maxAnio}. Se deja en ${contadorObjetivo}; la próxima factura será la ${contadorObjetivo + 1}_DD-MM-${anio}.`);

  if (!APLICAR) {
    console.log("\nNo se ha cambiado nada. Si todo es correcto, ejecuta de nuevo con --apply.");
    return;
  }

  // 1 y 2: números y serie, en una sola transacción
  const lote = 200;
  for (let i = 0; i < cambios.length; i += lote) {
    const trozo = cambios.slice(i, i + lote);
    await prisma.$transaction(
      trozo.map((c) => prisma.factura.update({ where: { id: c.id }, data: { numero: c.nuevo, serieId: null } }))
    );
    console.log(`  Actualizadas ${Math.min(i + lote, cambios.length)}/${cambios.length}`);
  }

  // 3: contador de la serie predeterminada si quedó sin facturas
  const series = await prisma.serieFacturacion.findMany({ where: { empresaId: { in: empresaIds } } });
  for (const s of series) {
    const usos = await prisma.factura.count({ where: { serieId: s.id } });
    if (usos === 0 && s.contadorActual !== 0) {
      await prisma.serieFacturacion.update({ where: { id: s.id }, data: { contadorActual: 0 } });
      console.log(`  Serie "${s.nombre}": sin facturas, contador devuelto a 0.`);
    }
  }

  // 4: contador del año
  for (const empresaId of empresaIds) {
    const actual = await prisma.contadorFactura.findUnique({ where: { empresaId_anio: { empresaId, anio } } });
    await prisma.contadorFactura.upsert({
      where: { empresaId_anio: { empresaId, anio } },
      update: { contador: contadorObjetivo },
      create: { empresaId, anio, contador: contadorObjetivo },
    });
    console.log(`  Contador ${anio}: ${actual ? actual.contador : "(no existía)"} -> ${contadorObjetivo}`);
  }

  console.log("\nListo.");
}

main()
  .catch((e) => { console.error("\nERROR:", e.message || e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
